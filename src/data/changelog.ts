export interface ChangelogEntry {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

// Najnowszy wpis na górze. Po dodaniu nowej wersji userzy zobaczą popup raz.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.3.0",
    date: "2026-05-04",
    title: "Versus Blitz, rewanże i lepszy share daily",
    changes: [
      "Nowy tryb Versus 1v1 ze znajomym — link, lobby i realtime",
      "Versus vs Bot z 3 poziomami trudności: Mata, Białas i Peja",
      "Versus Blitz — 5 rund, max 10 s sampla, 10 s na odpowiedź",
      "Dogrywka w klasycznym Versusie przy remisie po 5 rundzie (do 8 rund)",
      "Rewanż w PvP z popupem zaproszenia — przyjmij lub odrzuć",
      "Po zgadnięciu utwór gra dalej w pełnej wersji",
      "Statystyki Versus i nowe osiągnięcia",
      "Lepsze wyszukiwanie utworów (np. „white 2115 balmain” już działa)",
      "Ładniejszy share wyniku Daily — z tytułem utworu i przyciskiem Udostępnij",
      "Płyta winylowa w trybie ciemnym ma teraz wyraźną krawędź i nie zlewa się z tłem",
      "Drobny refresh UI/UX i poprawki bezpieczeństwa",
    ],
  },
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