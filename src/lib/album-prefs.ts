const K = "rg2-enabled-albums";

export const AlbumPrefs = {
  get(): Set<string> | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(K);
      if (!raw) return null;
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch { return null; }
  },
  save(ids: string[]) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(K, JSON.stringify(ids)); } catch {}
  },
  clear() {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(K); } catch {}
  },
};