export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

// Najnowszy wpis na górze. Po dodaniu nowej wersji userzy zobaczą popup raz.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.2.0",
    date: "2026-05-04",
    title: "Świeża paczka utworów i lepsza gra",
    changes: [
      "Dodano sporo nowych utworów i albumów do puli",
      "Albumy można teraz oznaczać jako Polecane ⭐ — wyróżniają się w katalogu",
      "Tryby zwykłe ciągną też muzykę z albumów — większa pula bez duplikowania",
      "Inteligentna deduplikacja: ten sam kawałek nie pojawi się dwa razy, a zgadnięcie dowolnej wersji zalicza punkt",
      "Odświeżony ciemny motyw + płynne animacje na całej stronie",
      "Offset startu utworu w albumach (np. od 0:08) — pomijamy długie intra",
    ],
  },
];

export const CURRENT_VERSION = CHANGELOG[0]?.version ?? "0.0.0";