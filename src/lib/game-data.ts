import { SONGS, type Song } from "@/data/songs";
import { ALBUMS, type Album } from "@/data/albums";

export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTY: Record<Difficulty, { durations: number[]; attempts: number; label: string }> = {
  easy:   { label: "Easy",   attempts: 6, durations: [2, 4, 7, 10, 15, 30] },
  normal: { label: "Normal", attempts: 6, durations: [0.5, 1, 2, 4, 7, 15] },
  hard:   { label: "Hard",   attempts: 4, durations: [0.3, 0.6, 1.2, 3] },
};

export type Mode = "daily" | "endless" | "album";

export function allSongs(): Song[] {
  // Pełna baza = songs.mjs + wszystkie tracki z albumów (zdeduplikowane po id)
  const map = new Map<string, Song>();
  for (const s of SONGS) map.set(s.id, s);
  for (const a of ALBUMS) for (const s of a.songs) if (!map.has(s.id)) map.set(s.id, s);
  return Array.from(map.values());
}

export function albums(): Album[] { return ALBUMS; }
export function albumById(id: string): Album | undefined { return ALBUMS.find(a => a.id === id); }
export function songsForAlbum(id: string): Song[] { return albumById(id)?.songs ?? []; }

// Daily seed — deterministyczny wybór tracku z daty
export function dailyKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function dailySong(d = new Date()): Song {
  const all = allSongs();
  const idx = hashStr(dailyKey(d)) % all.length;
  return all[idx];
}

export function dailyNumber(d = new Date()): number {
  // numer dnia od 2024-01-01
  const epoch = new Date(2024, 0, 1).getTime();
  const day = Math.floor((d.getTime() - epoch) / 86400000);
  return day + 1;
}

export function pickRandom<T>(arr: T[], exclude?: Set<string>, key?: (t: T) => string): T {
  if (exclude && key) {
    const pool = arr.filter(x => !exclude.has(key(x)));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function fuzzyMatch(query: string, song: Song): boolean {
  const q = normalize(query);
  if (!q) return false;
  return normalize(song.title).includes(q) || normalize(song.artist).includes(q);
}
