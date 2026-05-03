import { ALBUMS_DB as RAW } from "./albums.source.mjs";
import type { Song } from "./songs";

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  cover: string;
  songs: Song[];
}

export const ALBUMS: Album[] = (RAW as Album[]).filter((a) => a && a.id && a.songs?.length);
