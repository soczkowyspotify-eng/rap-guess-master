// Wrapper typowany dla bazy z .mjs
import { SONGS_DB as RAW } from "./songs.source.mjs";
import { getLegacyOverrides } from "@/lib/yt-pool";

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

const RAW_SONGS: Song[] = (RAW as Song[]).filter((s) => s && s.id && s.src);

/** Lista legacy songs z zaaplikowanymi overrides (offset + ukryte). */
export const SONGS: Song[] = new Proxy([] as Song[], {
  get(_t, prop) {
    const ovr = getLegacyOverrides();
    const list = RAW_SONGS
      .filter((s) => !ovr[s.id]?.hidden)
      .map((s) => {
        const o = ovr[s.id];
        return o && o.start_sec ? { ...s, startSec: o.start_sec } : s;
      });
    // Forward array operations
    const v = (list as any)[prop];
    return typeof v === "function" ? v.bind(list) : v;
  },
});

/** Surowa, niemodyfikowana lista — dla panelu admina. */
export const RAW_LEGACY_SONGS: Song[] = RAW_SONGS;
