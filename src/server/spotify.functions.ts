import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().min(1).max(500),
});

function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  // raw id
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;
  // spotify:playlist:xxxx
  const uri = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  if (uri) return uri[1];
  // open.spotify.com/playlist/xxxx
  const url = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (url) return url[1];
  return null;
}

async function getToken(): Promise<string> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Brak konfiguracji Spotify (SPOTIFY_CLIENT_ID/SECRET).");
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify auth ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  year?: number;
  src: string; // preview_url
  cover?: string;
}

export interface FetchPlaylistResult {
  name: string;
  total: number;
  withPreview: number;
  tracks: SpotifyTrack[];
  error?: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/\b(feat|ft|featuring|prod|remaster(ed)?|radio edit|explicit|clean|single version)\b/g, " ")
    .replace(/[^a-z0-9ąćęłńóśźż]+/gi, " ")
    .trim();
}

function scoreMatch(expectedTitle: string, expectedArtist: string, foundTitle: string, foundArtist: string): number {
  const expected = new Set(`${normalizeText(expectedTitle)} ${normalizeText(expectedArtist)}`.split(/\s+/).filter(Boolean));
  const found = new Set(`${normalizeText(foundTitle)} ${normalizeText(foundArtist)}`.split(/\s+/).filter(Boolean));
  if (!expected.size || !found.size) return 0;
  let hits = 0;
  for (const token of expected) if (found.has(token)) hits += 1;
  return hits / expected.size;
}

async function itunesPreview(title: string, artist: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const r = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=8&country=US`);
    if (!r.ok) return null;
    const json = (await r.json()) as { results?: Array<{ previewUrl?: string; trackName?: string; artistName?: string }> };
    let best: { url: string; score: number } | null = null;
    for (const item of json.results ?? []) {
      if (!item.previewUrl || !item.trackName || !item.artistName) continue;
      const score = scoreMatch(title, artist, item.trackName, item.artistName);
      if (score >= 0.45 && (!best || score > best.score)) best = { url: item.previewUrl, score };
    }
    return best?.url ?? null;
  } catch {
    return null;
  }
}

async function deezerPreview(title: string, artist: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`artist:"${artist}" track:"${title}"`);
    const r = await fetch(`https://api.deezer.com/search?q=${q}&limit=8`);
    if (!r.ok) return null;
    const json = (await r.json()) as { data?: Array<{ preview?: string; title?: string; artist?: { name?: string } }> };
    let best: { url: string; score: number } | null = null;
    for (const item of json.data ?? []) {
      if (!item.preview || !item.title || !item.artist?.name) continue;
      const score = scoreMatch(title, artist, item.title, item.artist.name);
      if (score >= 0.45 && (!best || score > best.score)) best = { url: item.preview, score };
    }
    return best?.url ?? null;
  } catch {
    return null;
  }
}

async function embedPreview(id: string): Promise<string | null> {
  try {
    const r = await fetch(`https://open.spotify.com/embed/track/${id}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/"audioPreview"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
    const m2 = html.match(/https:\\u002F\\u002Fp\.scdn\.co\\u002Fmp3-preview\\u002F[a-f0-9]+/);
    if (m2) return m2[0].replace(/\\u002F/g, "/");
    const m3 = html.match(/https:\/\/p\.scdn\.co\/mp3-preview\/[a-f0-9]+/);
    if (m3) return m3[0];
    return null;
  } catch {
    return null;
  }
}

async function resolvePreview(p: { id: string; title: string; artist: string; preview: string | null }): Promise<string | null> {
  if (p.preview) return p.preview;
  return (await embedPreview(p.id)) ?? (await itunesPreview(p.title, p.artist)) ?? (await deezerPreview(p.title, p.artist));
}

export const fetchSpotifyPlaylist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<FetchPlaylistResult> => {
    const playlistId = extractPlaylistId(data.url);
    if (!playlistId) {
      return { name: "", total: 0, withPreview: 0, tracks: [], error: "Nie rozpoznałem linka. Wklej link do playlisty Spotify." };
    }

    let token: string;
    try {
      token = await getToken();
    } catch (e: any) {
      return { name: "", total: 0, withPreview: 0, tracks: [], error: e?.message ?? "Błąd autoryzacji Spotify." };
    }

    // metadata
    const metaRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metaRes.ok) {
      return { name: "", total: 0, withPreview: 0, tracks: [], error: `Spotify ${metaRes.status}: nie znaleziono playlisty lub jest prywatna.` };
    }
    const meta = (await metaRes.json()) as { name: string };

    // tracks (paginated)
    const tracks: SpotifyTrack[] = [];
    let total = 0;
    type Pending = { id: string; title: string; artist: string; year?: number; cover?: string; preview: string | null };
    const pending: Pending[] = [];
    let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,total,items(track(id,name,preview_url,album(name,release_date,images),artists(name)))`;
    while (url) {
      const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) break;
      const j: any = await r.json();
      total = j.total ?? total;
      for (const it of j.items ?? []) {
        const t = it?.track;
        if (!t || !t.id) continue;
        pending.push({
          id: t.id,
          title: t.name,
          artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
          year: t.album?.release_date ? Number(String(t.album.release_date).slice(0, 4)) : undefined,
          cover: t.album?.images?.[0]?.url,
          preview: t.preview_url ?? null,
        });
      }
      url = j.next ?? null;
    }

    // Spotify często nie oddaje preview_url, więc dobieramy legalne 30s preview po tytule i artyście.
    const BATCH = 5;
    for (let i = 0; i < pending.length; i += BATCH) {
      const batch = pending.slice(i, i + BATCH);
      await Promise.all(batch.map(async (p) => {
        p.preview = await resolvePreview(p);
      }));
    }

    for (const p of pending) {
      if (!p.preview) continue;
      tracks.push({
        id: `sp:${p.id}`,
        title: p.title,
        artist: p.artist,
        year: p.year,
        src: p.preview,
        cover: p.cover,
      });
    }

    return { name: meta.name, total, withPreview: tracks.length, tracks };
  });