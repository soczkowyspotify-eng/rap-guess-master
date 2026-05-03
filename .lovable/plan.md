## RAP GUESSER v2 — kompletny remake

Cel: ta sama gra co stara, ta sama baza audio (`songs.mjs` + `albums.mjs` 1:1), ale całkowicie nowe UI/UX w stylu editorial-minimal premium (Apple Music vibe), nowe tryby i ulepszony system gry. Bez backendu — wszystko w `localStorage`. Po skończeniu podłączysz nowe repo na GitHubie przez Connectors → GitHub.

---

## Tryby gry

**1. Daily**
- Jeden track dziennie, ten sam dla wszystkich (deterministyczny seed z daty)
- Po przegraniu/wygraniu blokada do północy
- Historia wszystkich daily (kalendarz-heatmapa: zielone/czerwone/szare)
- Generator share — obrazek + tekst do skopiowania (jak Wordle: "RG #128 ▶▶✅ 3/6 0.5s")

**2. Endless (nieskończoność)**
- Losowanie z pełnej bazy `songs.mjs`
- Liczy się streak (najdłuższa seria)
- Po pudle: streak reset, leci następny

**3. Album**
- Lista wszystkich albumów z `albums.mjs` z okładkami
- Wybierasz album → grasz tylko tracki z niego po kolei (lub losowo, do wyboru)
- Pasek progresu: "5/12 trafionych" per album
- Ranking lokalny: najlepszy wynik per album, % ukończenia
- Po ukończeniu albumu — ekran podsumowania z całą tracklistą

---

## System trudności (nowy)

Trzy poziomy wpływają na: długość pierwszego sample'a, liczbę prób, dostępność hintów.

| Poziom | Start | Liczba prób | Sample'y |
|---|---|---|---|
| Easy | 2s | 6 | 2 → 4 → 7 → 10 → 15 → 30s |
| Normal (default) | 0.5s | 6 | 0.5 → 1 → 2 → 4 → 7 → 15s |
| Hard | 0.3s | 4 | 0.3 → 0.6 → 1.2 → 3s |

Wybór trudności zapisany w localStorage. Daily zawsze Normal (żeby ranking był uczciwy).

---

## Statystyki i achievements

- **Win rate** ogólny i per tryb
- **Heatmapa daily** (ostatnie 90 dni — kafelki kalendarza)
- **Najdłuższy streak** w Endless
- **Top 5 najczęściej mylonych tracków**
- **Średnia liczba prób do trafienia**
- **Postęp albumów** (np. "8/15 albumów ukończonych w 100%")
- Achievements 2.0: rozbudowane, z progress barem (np. "Ukończ 10 albumów na Hard")
- Wszystko w jednej zakładce **Statystyki**, czyste editorial layout

---

## Architektura nawigacji (TanStack routes)

```
/                  Landing — wybór trybu, hero z winylem, stats glance
/daily             Tryb daily + share modal
/endless           Tryb endless
/albums            Lista albumów (siatka okładek)
/albums/$albumId   Rozgrywka konkretnego albumu
/stats             Statystyki + heatmapa + achievements
/admin             Panel zarządzania bazą (jak w starym repo, lifted 1:1)
/settings          Trudność, motyw, reset postępu
```

Każda strona z własnym `head()` (title/description) — SSR-friendly.

---

## UI / Design system (editorial minimal premium)

Kierunek: dużo białej przestrzeni, eleganckie typo, subtelne motion. Apple Music × New York Times.

- **Typografia**: display serif (np. Fraunces lub Instrument Serif) na nagłówki, geometryczny sans (Inter Tight / Geist) na body. Bardzo duże nagłówki, oddychają.
- **Kolor**: bardzo jasne off-white tło (`oklch(0.98 0.005 90)`), głęboka grafitowa typografia, jeden mocny akcent (głęboka czerwień winyla `oklch(0.55 0.22 25)`). Dark mode jako pełnoprawny wariant: deep charcoal + ten sam akcent.
- **Komponenty kluczowe**:
  - `<Vinyl />` — animowany winyl, obraca się gdy gra (framer-motion)
  - `<Waveform />` — minimalistyczny pasek postępu sample'a, zamiast okrągłego progress
  - `<TrackCard />` — karta tracku w wynikach, okładka + tytuł + artist
  - `<AlbumCover />` — kafelek z okładką, hover lift + overlay z progressem
  - `<DailyHeatmap />` — siatka 7×13, kolor = wynik
  - `<DurationStepper />` — minimal segmented progress (kropki, nie liczby)
  - `<GuessSearch />` — combobox z fuzzy search (cmdk), pokazuje okładkę przy wpisie
- **Motion**: framer-motion, jeden mocny accent (np. winyl wjeżdża spinem na hero), reszta subtelna.

---

## Co trzymamy 1:1 ze starego repo

- `src/data/songs.source.mjs` — kopia bit-w-bit (cała baza SoundCloud + R2)
- `src/data/albums.source.mjs` — kopia bit-w-bit (Sentino ZL5 itd.)
- Logika daily seed (deterministyczne losowanie z daty)
- Panel `/admin` z `localStorage` (zarządzanie własnymi dodatkami do bazy)
- Format `{ id, title, artist, year, type: 'sc'|'url'|'file', src }`
- Obsługa SoundCloud iframe + zwykłego `<audio>` dla R2

Dorzucę typowane wrappery (`src/lib/songs.ts`, `src/lib/albums.ts`) dla autocompletion, ale źródłowy `.mjs` zostaje edytowalny.

---

## Co budujemy w tej iteracji

1. Design system: tokeny editorial-minimal w `src/styles.css`, fonty z Google Fonts.
2. Skopiowanie bazy `songs.source.mjs` i `albums.source.mjs` 1:1 do `src/data/`.
3. Core gry: `useGame` hook z obsługą 3 trybów + 3 poziomów trudności.
4. Routes: `/`, `/daily`, `/endless`, `/albums`, `/albums/$id`, `/stats`, `/admin`, `/settings`.
5. Komponenty: Vinyl, Waveform, TrackCard, AlbumCover, DailyHeatmap, GuessSearch, DurationStepper.
6. System statystyk + achievements w localStorage.
7. Share daily — generator obrazka (canvas) + tekst do schowka.
8. Panel admina przeniesiony i odświeżony.

---

## Podłączenie do GitHuba (po skończeniu)

Po zaakceptowaniu i zbudowaniu: kliknij **Connectors → GitHub → Connect project**, autoryzuj Lovable GitHub App, wybierz nazwę nowego repo (np. `rapguesser-v2`). Lovable utworzy świeże repo i będzie sync 1:1 dwukierunkowo.

⚠️ Uwaga: ten projekt to TanStack Start (SSR), więc **nie zadziała na GitHub Pages** jak stara wersja. Hostujesz przez Lovable (Publish — jeden klik, własna domena `*.lovable.app`, możesz podpiąć custom domain). Jeśli koniecznie chcesz GH Pages, daj znać — wtedy musimy zmienić stack na czysty Vite SPA (stracimy SSR/SEO).

---

## Otwarte pytanie do potwierdzenia w trakcie

Po zbudowaniu szkieletu pokażę Ci hero/landing — jeśli editorial-minimal nie zagra wizualnie, mogę szybko przełączyć na brutalist/streetwear bez przepisywania logiki (cały design jest w tokenach).
