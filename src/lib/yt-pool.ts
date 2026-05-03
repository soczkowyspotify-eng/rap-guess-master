import { supabase } from "@/integrations/supabase/client";
import type { Song } from "@/data/songs";
import type { Album } from "@/data/albums";

const LS_KEY = "rg.yt.cache.v1";
const LS_ALBUMS_KEY = "rg.yt.albums.cache.v1";

let cache: Song[] = [];
let albumsCache: Album[] = [];
const listeners = new Set<() => void>();

function seedFromLocal() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) cache = parsed;
    }
  } catch {}
  try {
    const raw = localStorage.getItem(LS_ALBUMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) albumsCache = parsed;
    }
  } catch {}
}
seedFromLocal();

function emit() { listeners.forEach((l) => l()); }

export function getYtPool(): Song[] {
  return cache;
}

export function getYtAlbums(): Album[] {
  return albumsCache;
}

export function subscribeYt(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function loadYtTracks(): Promise<void> {
  if (typeof window === "undefined") return;
  const { data, error } = await supabase
    .from("yt_tracks")
    .select("id, video_id, artist, title")
    .order("created_at", { ascending: false });
  if (error || !data) return;
  const next: Song[] = data.map((r) => ({
    id: `yt_${r.video_id}`,
    title: r.title,
    artist: r.artist,
    type: "youtube",
    src: r.video_id,
  }));
  cache = next;
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  emit();
}

export async function loadYtAlbums(): Promise<void> {
  if (typeof window === "undefined") return;
  const { data, error } = await supabase
    .from("yt_albums")
    .select("id, cover_url, artist, title, year, recommended, yt_album_tracks(id, video_id, artist, title, position, start_sec)")
    .order("created_at", { ascending: false });
  if (error || !data) return;
  const next: Album[] = data.map((a: any) => {
    const tracks = (a.yt_album_tracks ?? [])
      .slice()
      .sort((x: any, y: any) => (x.position ?? 0) - (y.position ?? 0))
      .map((t: any) => ({
        id: `yt_${t.video_id}`,
        title: t.title,
        artist: t.artist,
        year: a.year ?? undefined,
        type: "youtube" as const,
        src: t.video_id,
        startSec: t.start_sec ?? 0,
      }));
    return {
      id: `ytalb_${a.id}`,
      title: a.title,
      artist: a.artist,
      year: a.year ?? 0,
      cover: a.cover_url,
      songs: tracks,
      recommended: !!a.recommended,
    };
  });
  albumsCache = next;
  try { localStorage.setItem(LS_ALBUMS_KEY, JSON.stringify(next)); } catch {}
  emit();
}