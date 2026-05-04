## Cel

Pięć powiązanych zmian:

1. **Versus Blitz** — szybki wariant 1v1 (PvP i vs Bot)
2. **Popup rewanżu** w PvP (przyjmij/odrzuć)
3. **Aktualizacja popupu changelogu** o nowe rzeczy
4. **Ładny share wyniku Daily** + drobny refresh tekstu
5. **UI/UX polish + naprawa winylu w dark mode**

---

## 1. Versus Blitz

Nowy wariant Versusa obok klasycznego (best of 5 + dogrywka).

**Reguły:**
- 5 rund (bez dogrywki — przy remisie po 5 rundach wynik = remis)
- W każdej rundzie 5 prób, max długość sampla **10 s** (`durations: [1, 2, 4, 7, 10]`)
- Po pierwszym kliknięciu Play w rundzie startuje **10-sekundowy licznik**
- Po upływie 10 s runda automatycznie liczona jako przegrana (`correct=false`, użyte wszystkie próby)
- Punktacja jak w klasyku: kto trafił z mniejszą liczbą prób bierze rundę

**UX:**
- W lobby `/versus` (PvP) i `/versus/bot` dodaję wybór trybu: **Klasyczny** / **Blitz**
- Pasek wyniku pokazuje pływający timer (kółko z odliczaniem) gdy uruchomiony
- Po wyzerowaniu timera wynik leci do bazy (PvP) lub lokalnie (bot)

**Backend (PvP):**
- Migracja: `ALTER TABLE versus_matches ADD COLUMN mode text NOT NULL DEFAULT 'classic'`
- `createMatch` przyjmuje `mode`, dla blitz losuje 5 tracków zamiast 8
- `submitRoundResult` uwzględnia tryb: blitz = sztywno 5 rund, brak dogrywki, brak warunku „pierwszy do 3”

**Frontend:**
- `versus/round.tsx` (PvP) i `versus/bot-round.tsx` przyjmują `variant: "classic" | "blitz"` i konfigurację prób
- Nowy komponent `versus/round-timer.tsx` — okrągłe odliczanie 10 s
- `score-bar.tsx` ma slot na timer

---

## 2. Popup rewanżu (PvP)

**Backend:**
- Migracja: w `versus_matches` dodać:
  - `rematch_requested_by text` (nullable)
  - `rematch_match_id uuid` (nullable)
- Nowe server functions:
  - `requestRematch({matchId, playerId})` — ustawia `rematch_requested_by`
  - `respondRematch({matchId, playerId, accept})` — jeśli akceptuje, woła wewnętrznie `rematch()` (przepisując `mode`), zapisuje nowe id w `rematch_match_id`. Odrzucenie czyści flagę.

**Frontend (`VersusResult`):**
- Klik „Rewanż" → `requestRematch`. Przycisk zmienia się w „Czekam na zgodę…"
- Przeciwnik (przez Realtime na `versus_matches`) widzi modal: „{nick} proponuje rewanż" + Przyjmij / Odrzuć
- Akceptacja → obie strony nawigują na `/versus/$rematch_match_id`
- Odrzucenie → modal znika, requester dostaje toast „Rewanż odrzucony"
- W `versus/bot` rewanż zostaje natychmiastowy (bez popupu)

---

## 3. Popup changelogu

Nowy wpis na początek `src/data/changelog.ts` (`2.3.0`, dzisiejsza data):

- Nowy tryb **Versus 1v1** ze znajomym (link + QR, lobby, rewanż z popupem)
- **Versus vs Bot** — 3 poziomy: Mata, Białas, Peja
- **Versus Blitz** — szybkie rundy, 10 s na odpowiedź, max 10 s sampla
- Dogrywka w Versus przy remisie po 5 rundzie (do max 8)
- Statystyki Versus + nowe osiągnięcia
- Po zgadnięciu utwór gra dalej w pełnej wersji
- Lepsze wyszukiwanie utworów (np. „white 2115 balmain" już działa)
- Ładniejszy share wyniku Daily
- Lekki refresh UI/UX, poprawiona płyta winylowa w trybie ciemnym
- Drobne poprawki bezpieczeństwa i wydajności

`CURRENT_VERSION` aktualizuje się automatycznie i popup pokaże się każdemu raz.

---

## 4. Ładny share wyniku Daily

Aktualnie `ShareDailyModal` kopiuje suchy tekst z kwadracikami. Zmiana:

- Przycisk „Udostępnij" generuje **link do `/daily?share=<id>`** (lub po prostu z fragmentem) i krótki, ludzki tekst, np.:
  > „🎧 RAP GUESSER #142 — zgadłem **Białas — Balmain** w 2 próbach. Spróbujesz?
  > 🟥🟢⬜⬜⬜⬜
  > https://rapguesser.pl/daily"
- Przegrana: „Nie zgadłem dziś (RAP GUESSER #142 — *Białas — Balmain*). A Ty spróbujesz?"
- W modalu ładniejszy layout: hero z winylem mini, tytuł utworu, liczba prób, kafelki z kwadracikami, dwie akcje: **Skopiuj link** i **Udostępnij** (`navigator.share` na mobile, fallback = clipboard).
- Tekst i URL nie eksponują rozwiązania w samym linku — title/artist są tylko w treści, link prowadzi po prostu do dzisiejszego daily (każdy gra ten sam track).

---

## 5. UI/UX polish + winyl w dark mode

**Płyta winylowa:**
- W `dark` `--vinyl: oklch(0.05 0.002 270)` jest niemal identyczne z `--background` (0.11) — krawędź się zlewa.
- Zmieniam `--vinyl` w dark na ciemniejszy ale wyraźnie różny ton z lekkim chłodem (`oklch(0.18 0.01 280)`), dodaję w `Vinyl` widoczny rim (cienki ring `border` w kolorze `--ink-muted/30` lub subtelny outer glow), poprawiam gradient, żeby groove rings były bardziej widoczne (jasność `oklch(1 0 0 / 0.07)` w dark zamiast 0.04).
- Dodaję subtelny outer drop-shadow z odrobiną primary, żeby winyl „odklejał się" od tła w obu motywach.

**Lekki refresh UI/UX (przy okazji):**
- Subtelne wyciszenie `--hairline` w light mode i lekkie wzmocnienie w dark.
- Drobne wyrównanie spacingu w `AppHeader` (większy padding na desktop, lepsze focus state na linki nawigacji).
- W kartach lobby Versus: spójne `rounded-3xl + shadow-soft`, hover-lift na klikalnych kafelkach.
- W ekranie wyniku: większy trofeum + kontrast nicku vs wynik.
- Drobne poprawki czcionki w nagłówkach (`tracking-[-0.03em]` na display, lepsza hierarchia).

Bez globalnej zmiany palety — tylko polish.

---

## Zmiany w plikach (skrót techniczny)

**Migracje (jedna):**
- `versus_matches`: dodać `mode text not null default 'classic'`, `rematch_requested_by text`, `rematch_match_id uuid`

**Server (`src/server/versus.functions.ts`):**
- `createMatch`: przyjmuje `mode`, dobiera 5/8 tracków
- `submitRoundResult`: rozróżnia tryb przy decyzji o końcu meczu
- Nowe: `requestRematch`, `respondRematch`
- `rematch`: zachowuje `mode` z poprzedniego meczu

**Hook (`src/hooks/use-versus.ts`):**
- W typie `VersusMatch` i SELECT dodać `mode`, `rematch_requested_by`, `rematch_match_id`

**Komponenty:**
- `versus/round.tsx` — variant blitz + timer
- `versus/bot-round.tsx` — to samo lokalnie
- `versus/result.tsx` — flow request/respond rewanżu, dialog dla zaproszonego
- `versus/round-timer.tsx` (nowy)
- `versus/score-bar.tsx` — slot na timer
- `routes/versus.index.tsx`, `routes/versus.bot.tsx` — wybór Klasyczny / Blitz w lobby
- `components/game/share-daily-modal.tsx` — nowy layout, tytuł utworu, share link/clipboard, `navigator.share`
- `components/game/vinyl.tsx` — wyraźny rim + lepszy gradient
- `src/styles.css` — dark `--vinyl`, drobne hairline poprawki
- `src/data/changelog.ts` — nowy wpis 2.3.0
