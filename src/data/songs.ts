// Wrapper typowany dla bazy z .mjs
import { SONGS_DB as RAW } from "./songs.source.mjs";

export interface Song {
  id: string;
  title: string;
  artist: string;
  year?: number;
  type: "url" | "file" | "youtube";
  /** dla "youtube" trzymamy tu videoId (11 znaków), dla pozostałych URL pliku audio */
  src: string;
  /** Sekunda od której startuje odtwarzanie sample'a (np. dla albumów). */
  startSec?: number;
}

export const SONGS: Song[] = (RAW as Song[]).filter((s) => s && s.id && s.src);
