export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

// Najnowszy wpis na górze. Po dodaniu nowej wersji userzy zobaczą popup raz.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.1.0",
    date: "2026-05-03",
    title: "Ciemny motyw i mobilki",
    changes: [
      "Nowy ciemny motyw (przełącznik w nagłówku i Ustawieniach)",
      "Pełna optymalizacja pod telefony — chowane menu, lepsze odstępy",
      "Popup z informacjami o aktualizacjach (właśnie go widzisz 👋)",
      "Drobne poprawki odtwarzania sampli",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "0.0.0";