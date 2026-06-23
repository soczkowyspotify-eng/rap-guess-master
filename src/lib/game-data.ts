import { SONGS, type Song } from "@/data/songs";
import { ALBUMS, type Album } from "@/data/albums";
import { getYtPool, getYtAlbums } from "./yt-pool";
import { AlbumPrefs } from "./album-prefs";

export type Difficulty = "easy" | "normal" | "hard";

export const DIFFICULTY: Record<Difficulty, { durations: number[]; attempts: number; label: string }> = {
  easy:   { label: "Easy",   attempts: 6, durations: [2, 4, 7, 10, 15, 30] },
  normal: { label: "Normal", attempts: 6, durations: [0.5, 1, 2, 4, 7, 15] },
  hard:   { label: "Hard",   attempts: 4, durations: [0.3, 0.6, 1.2, 3] },
};

export type Mode = "daily" | "endless" | "album";

export function allSongs(): Song[] {
  const byId = new Map<string, Song>();
  const push = (s: Song) => { if (!byId.has(s.id)) byId.set(s.id, s); };

  const enabled = AlbumPrefs.get();
  const useFilter = enabled && enabled.size > 0;

  // Singles zawsze wchodzą — to nie albumy
  for (const s of SONGS) push(s);
  for (const s of getYtPool()) push(s);

  for (const a of ALBUMS) {
    if (useFilter && !enabled.has(a.id)) continue;
    for (const s of a.songs) push(s);
  }
  for (const a of getYtAlbums()) {
    if (useFilter && !enabled.has(a.id)) continue;
    for (const s of a.songs) push(s);
  }

  const result = dedupeSongs(Array.from(byId.values()));
  // Fallback: gdy pula < 10, ignoruj filtr i wróć do pełnej
  if (useFilter && result.length < 10) {
    const fallback = new Map<string, Song>();
    for (const s of SONGS) fallback.set(s.id, s);
    for (const s of getYtPool()) fallback.set(s.id, s);
    for (const a of ALBUMS) for (const s of a.songs) fallback.set(s.id, s);
    for (const a of getYtAlbums()) for (const s of a.songs) fallback.set(s.id, s);
    return dedupeSongs(Array.from(fallback.values()));
  }

  return result;
}

export function albums(): Album[] { return [...getYtAlbums(), ...ALBUMS]; }
export function albumById(id: string): Album | undefined { return albums().find(a => a.id === id); }
export function songsForAlbum(id: string): Song[] { return dedupeSongs(albumById(id)?.songs ?? []); }

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

function titleKey(title: string): string {
  return normalize(title.replace(/\s*[\[(].*?(?:feat|ft|featuring|prod|remix|edit|version|slowed|sped).*?[\])]/gi, ""));
}

function artistParts(artist: string): string[] {
  return artist
    .replace(/\b(?:feat\.?|ft\.?|featuring|prod\.?|produced by)\b/gi, ",")
    .split(/,|&|\/|\+|;|\s+x\s+|\s+and\s+|\s+i\s+/i)
    .map((part) => normalize(part))
    .filter(Boolean);
}

export function fuzzyMatch(query: string, song: Song): boolean {
  const q = normalize(query);
  if (!q) return false;
  const hay = `${normalize(song.title)} ${normalize(song.artist)}${song.year ? ` ${song.year}` : ""}`;
  if (hay.includes(q)) return true;
  // tokenowy AND — każdy fragment zapytania musi wystąpić w title+artist (w dowolnej kolejności)
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length <= 1) return false;
  return tokens.every((tok) => hay.includes(tok));
}

/** Klucz "ten sam utwór" — normalizowany artysta + tytuł. */
export function songKey(s: Song): string {
  return `${artistParts(s.artist)[0] ?? normalize(s.artist)}|${titleKey(s.title)}`;
}

export function sameSong(a: Song, b: Song): boolean {
  if (a.id === b.id) return true;
  if (titleKey(a.title) !== titleKey(b.title)) return false;
  const aArtists = artistParts(a.artist);
  const bArtists = new Set(artistParts(b.artist));
  return aArtists.some((artist) => bArtists.has(artist));
}

export function dedupeSongs(list: Song[]): Song[] {
  const unique: Song[] = [];
  for (const song of list) {
    if (!unique.some((existing) => sameSong(existing, song))) unique.push(song);
  }
  return unique;
}
