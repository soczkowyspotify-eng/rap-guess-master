import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function checkPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Brak skonfigurowanego hasła admina");
  if (pw !== expected) throw new Error("Złe hasło");
}

function extractVideoId(input: string): string | null {
  const t = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;
  const m = t.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || t.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) || t.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractPlaylistId(input: string): string | null {
  const m = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^(PL|OLAK5uy_|RD|UU|FL|LL)[a-zA-Z0-9_-]+$/.test(input.trim())) return input.trim();
  return null;
}

function ytKey() {
  const k = process.env.YOUTUBE_API_KEY;
  if (!k) throw new Error("Brak YOUTUBE_API_KEY");
  return k;
}

function pickThumb(thumbs: any): string {
  if (!thumbs) return "";
  return thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || "";
}

/** "Artist - Title (Official Video)" → { artist, title } — heurystyka, można poprawić ręcznie */
function splitArtistTitle(videoTitle: string, channelTitle: string): { artist: string; title: string } {
  const cleaned = videoTitle.replace(/\s*[\(\[][^\)\]]*(official|video|audio|lyric|visualizer|prod\.|prod by)[^\)\]]*[\)\]]/gi, "").trim();
  const idx = cleaned.indexOf(" - ");
  if (idx > 0) {
    return { artist: cleaned.slice(0, idx).trim(), title: cleaned.slice(idx + 3).trim() };
  }
  // Kanał typu "Artist - Topic" (YouTube Music)
  const ch = channelTitle.replace(/\s*-\s*Topic\s*$/i, "").trim();
  return { artist: ch, title: cleaned };
}

const PwSchema = z.object({ password: z.string().min(1).max(200) });

const FetchSchema = PwSchema.extend({
  link: z.string().min(1).max(500),
});

export interface YtFetchedTrack {
  video_id: string;
  title: string;          // surowy tytuł filmu
  channel: string;        // surowa nazwa kanału
  artist: string;         // wstępna propozycja (po splicie)
  parsedTitle: string;    // wstępna propozycja (po splicie)
  thumbnail: string;
  duration_sec?: number;
}

export interface YtFetchResult {
  type: "video" | "playlist";
  // Dla video: 1 element. Dla playlist: lista. Pierwszy element ma też `albumMeta`.
  tracks: YtFetchedTrack[];
  // Tylko dla playlist
  albumMeta?: {
    title: string;
    artist: string;
    cover_url: string;
    year?: number | null;
  };
}

/** Pobiera info o jednym video lub całej playliście (album) z YouTube Data API v3. */
export const fetchFromYoutube = createServerFn({ method: "POST" })
  .inputValidator((d) => FetchSchema.parse(d))
  .handler(async ({ data }): Promise<YtFetchResult> => {
    checkPassword(data.password);
    const key = ytKey();

    const playlistId = extractPlaylistId(data.link);
    if (playlistId) {
      // ===== PLAYLIST / ALBUM =====
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${key}`
      );
      if (!plRes.ok) throw new Error(`YouTube API: ${plRes.status} ${await plRes.text()}`);
      const plJson = await plRes.json();
      const plSnip = plJson.items?.[0]?.snippet;
      if (!plSnip) throw new Error("Nie znaleziono playlisty");

      // Wszystkie itemy (paginacja)
      const items: any[] = [];
      let pageToken: string | undefined = undefined;
      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${key}${pageToken ? `&pageToken=${pageToken}` : ""}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`YouTube API: ${r.status} ${await r.text()}`);
        const j = await r.json();
        items.push(...(j.items ?? []));
        pageToken = j.nextPageToken;
      } while (pageToken && items.length < 100);

      // Pobierz duration + lepsze thumby przez videos.list (batch po 50)
      const videoIds = items.map((it) => it.contentDetails?.videoId).filter(Boolean) as string[];
      const videoMap = new Map<string, any>();
      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50).join(",");
        const vr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${chunk}&key=${key}`);
        if (!vr.ok) continue;
        const vj = await vr.json();
        for (const v of vj.items ?? []) videoMap.set(v.id, v);
      }

      const tracks: YtFetchedTrack[] = items
        .map((it) => {
          const vid = it.contentDetails?.videoId as string | undefined;
          if (!vid) return null;
          const v = videoMap.get(vid);
          const sn = v?.snippet ?? it.snippet;
          const rawTitle = sn?.title ?? "";
          const channel = sn?.videoOwnerChannelTitle ?? sn?.channelTitle ?? "";
          if (!rawTitle || rawTitle === "Deleted video" || rawTitle === "Private video") return null;
          const split = splitArtistTitle(rawTitle, channel);
          return {
            video_id: vid,
            title: rawTitle,
            channel,
            artist: split.artist,
            parsedTitle: split.title,
            thumbnail: pickThumb(sn?.thumbnails),
            duration_sec: parseIsoDuration(v?.contentDetails?.duration),
          } as YtFetchedTrack;
        })
        .filter(Boolean) as YtFetchedTrack[];

      // Album meta — wykorzystaj też pierwszy track jako fallback okładki
      const channelClean = (plSnip.channelTitle ?? "").replace(/\s*-\s*Topic\s*$/i, "").trim();
      const cover = pickThumb(plSnip.thumbnails) || tracks[0]?.thumbnail || "";
      const yearGuess = plSnip.publishedAt ? new Date(plSnip.publishedAt).getFullYear() : null;

      return {
        type: "playlist",
        tracks,
        albumMeta: {
          title: plSnip.title ?? "",
          artist: channelClean,
          cover_url: cover,
          year: yearGuess,
        },
      };
    }

    // ===== POJEDYNCZY VIDEO =====
    const videoId = extractVideoId(data.link);
    if (!videoId) throw new Error("Niepoprawny link YouTube (ani video ani playlista)");

    const vr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${key}`);
    if (!vr.ok) throw new Error(`YouTube API: ${vr.status} ${await vr.text()}`);
    const vj = await vr.json();
    const item = vj.items?.[0];
    if (!item) throw new Error("Nie znaleziono filmu");
    const sn = item.snippet;
    const split = splitArtistTitle(sn.title, sn.channelTitle);
    return {
      type: "video",
      tracks: [{
        video_id: videoId,
        title: sn.title,
        channel: sn.channelTitle,
        artist: split.artist,
        parsedTitle: split.title,
        thumbnail: pickThumb(sn.thumbnails),
        duration_sec: parseIsoDuration(item.contentDetails?.duration),
      }],
    };
  });

function parseIsoDuration(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}