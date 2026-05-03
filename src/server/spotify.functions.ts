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
    let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,total,items(track(id,name,preview_url,album(name,release_date,images),artists(name)))`;
    while (url) {
      const r: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) break;
      const j: any = await r.json();
      total = j.total ?? total;
      for (const it of j.items ?? []) {
        const t = it?.track;
        if (!t || !t.id) continue;
        if (!t.preview_url) continue;
        tracks.push({
          id: `sp:${t.id}`,
          title: t.name,
          artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
          year: t.album?.release_date ? Number(String(t.album.release_date).slice(0, 4)) : undefined,
          src: t.preview_url,
          cover: t.album?.images?.[0]?.url,
        });
      }
      url = j.next ?? null;
    }

    return { name: meta.name, total, withPreview: tracks.length, tracks };
  });