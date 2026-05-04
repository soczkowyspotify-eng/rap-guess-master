import type { Difficulty } from "./game-data";

export interface DailyHistoryEntry {
  key: string; // YYYY-MM-DD
  number: number;
  songId: string;
  attempts: number; // ile pudeł zanim trafił (0 = od razu); jeśli przegrał = -1
  won: boolean;
}

export interface Stats {
  endlessBest: number;
  endlessCurrent: number;
  totalGuessed: number;
  totalPlayed: number;
  totalAttempts: number;
  missedTracks: Record<string, number>; // songId -> count pudeł
}

export interface AlbumProgress {
  guessed: string[]; // ids
  best: { score: number; perfect: boolean };
}

export interface Settings {
  difficulty: Difficulty;
  theme: "light" | "dark" | "system";
}

const K = {
  daily: "rg2-daily-history",
  stats: "rg2-stats",
  album: "rg2-album-progress",
  settings: "rg2-settings",
  achievements: "rg2-achievements",
};

const VERSUS_K = {
  playerId: "rg.playerId",
  nick: "rg.versusNick",
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const VersusLocal = {
  getOrCreatePlayerId(): string {
    if (!isClient()) return "";
    let id = localStorage.getItem(VERSUS_K.playerId);
    if (!id) { id = uuid(); localStorage.setItem(VERSUS_K.playerId, id); }
    return id;
  },
  getSuggestedNick(): string {
    if (!isClient()) return "";
    return localStorage.getItem(VERSUS_K.nick) ?? "";
  },
  saveSuggestedNick(nick: string) {
    if (!isClient()) return;
    try { localStorage.setItem(VERSUS_K.nick, nick); } catch {}
  },
};

const isClient = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}
function write<T>(key: string, val: T) {
  if (!isClient()) return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const Storage = {
  getDailyHistory: (): DailyHistoryEntry[] => read(K.daily, []),
  saveDailyEntry: (e: DailyHistoryEntry) => {
    const all = Storage.getDailyHistory().filter(x => x.key !== e.key);
    all.push(e);
    write(K.daily, all);
  },
  getDailyToday: (key: string): DailyHistoryEntry | undefined =>
    Storage.getDailyHistory().find(e => e.key === key),

  getStats: (): Stats => read(K.stats, {
    endlessBest: 0, endlessCurrent: 0, totalGuessed: 0, totalPlayed: 0,
    totalAttempts: 0, missedTracks: {},
  }),
  saveStats: (s: Stats) => write(K.stats, s),

  getAlbumProgress: (): Record<string, AlbumProgress> => read(K.album, {}),
  saveAlbumProgress: (p: Record<string, AlbumProgress>) => write(K.album, p),

  getSettings: (): Settings => read(K.settings, { difficulty: "normal", theme: "system" }),
  saveSettings: (s: Settings) => write(K.settings, s),

  getAchievements: (): string[] => read(K.achievements, []),
  unlock: (id: string): boolean => {
    const list = Storage.getAchievements();
    if (list.includes(id)) return false;
    list.push(id);
    write(K.achievements, list);
    return true;
  },

  resetAll: () => {
    if (!isClient()) return;
    Object.values(K).forEach(k => localStorage.removeItem(k));
  },
};
