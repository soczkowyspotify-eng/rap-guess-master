import { supabase } from "@/integrations/supabase/client";
import type { Song } from "@/data/songs";

const LS_KEY = "rg.yt.cache.v1";

let cache: Song[] = [];
const listeners = new Set<() => void>();

function seedFromLocal() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) cache = parsed;
  } catch {}
}
seedFromLocal();

function emit() { listeners.forEach((l) => l()); }

export function getYtPool(): Song[] {
  return cache;
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