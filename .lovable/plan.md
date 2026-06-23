## Zakres

Sześć powiązanych funkcji + lekkie odświeżenie UI. Wszystko działa bez logowania — konto jest opcjonalne.

---

### 1. Logowanie opcjonalne (Lovable Cloud Auth)

- E-mail/hasło + Google (przez brokera Lovable).
- Nowa trasa `/auth` z popupem zachęcającym.
- W nagłówku przycisk **Konto / Zaloguj** z inicjałem awatara.
- Tabela `profiles` (nick, avatar). Po zalogowaniu nick z profilu wchodzi automatycznie do Versus.
- Statystyki Daily/Endless/Versus z zalogowanym kontem synchronizują się do `user_stats` (scalanie z localStorage).
- Gra bez konta działa tak jak teraz (localStorage).

### 2. Panel ogłoszeń / popup aktualizacji w adminie

- W `/admin` nowa sekcja **Ogłoszenia**:
  - lista wpisów z `announcements`,
  - dodaj/edytuj (tytuł, treść, obrazek URL, aktywne tak/nie),
  - switch **Aktywne** wyłącza popup u wszystkich,
  - przycisk **Pokaż ponownie wszystkim** (zmiana id resetuje localStorage „seen").
- Popup `changelog-popup.tsx` honoruje flagę aktywne.

### 3. Data i godzina na stronie

- Mały zegar w headerze (desktop) i na home: `pon, 12 maja · 14:32`, strefa `Europe/Warsaw`, odświeżany co minutę.

### 4. System aktywnych graczy

- Tabela `presence_pings` (player_id, nick, current_view, last_seen).
- Hook `usePresence()` co 30s woła server-fn `pingPresence`.
- Server-fn `getActivePlayers()` zwraca licznik (last_seen > now - 2 min) + listę nicków.
- Widget **🟢 X graczy online** na home + w lobby Versus.

### 5. Wybór albumów do Daily/Endless

- Nowa trasa `/settings/albums` z listą wszystkich albumów + checkboxami.
- Skróty: zaznacz wszystkie / odznacz / tylko polecane.
- Zapis w `localStorage` (`rg2-enabled-albums`); dla zalogowanych sync do `user_settings`.
- `use-game.ts` filtruje pulę utworów po wybranych albumach; jeśli pula < 10 — toast + fallback do pełnej puli.
- Daily zostaje globalnie deterministyczne; jeśli utwór dnia jest poza wyborem — info „dziś gramy z pełnej puli".

### 6. NOWY TRYB: Zgadywanie po wersach (Lyric Guess)

Tryb tekstowy zamiast audio: pokazujemy fragment tekstu utworu, gracz zgaduje.

**Gameplay:**
- Trasa `/lyrics` + kafelek na home.
- Runda: pokazujemy 1 wers (z bazy), 4 próby. Po każdej błędnej dorzucamy kolejny wers (max 4 wersy).
- Pomocniczo: po 2 błędach odsłaniamy rok wydania, po 3 — pierwszą literę wykonawcy.
- Search/guess identyczny jak w endless.
- Codzienne wyzwanie z wersów (`/lyrics/daily`) + tryb nieskończony (`/lyrics`).

**Dane:**
- Nowa tabela `lyric_snippets`: `track_id`, `lines` (text[] — 4 wersy), `difficulty` (easy/normal/hard), `active`.
- Link do istniejących utworów (`track_id` matchowane po `artist+title` z `src/data/songs.ts`).
- Public SELECT dla anon na `active=true`.

**Panel admina — pełne CRUD dla wersów:**
- Nowa zakładka **Wersy** w `/admin`:
  - lista wszystkich snippetów (filtr po wykonawcy/tytule, status aktywny),
  - formularz dodawania: wybór utworu (autocomplete po `songs.ts`), 4 pola tekstowe na kolejne wersy, dropdown trudności, toggle aktywne,
  - edycja inline / usuwanie / masowe aktywuj-dezaktywuj,
  - **import zbiorczy z JSON/CSV** (`[{artist, title, lines:[...]}]`) — przycisk „Wklej JSON" + walidacja,
  - **auto-fetch** (opcjonalnie): przycisk „Pobierz tekst z genius.com" — server-fn `fetchLyricsFromGenius(trackId)` używająca sekretu `GENIUS_API_KEY` (poproszę userka tylko jeśli zechce użyć),
  - podgląd jak runda wygląda dla gracza.
- Server-fn: `listLyricSnippets`, `upsertLyricSnippet`, `deleteLyricSnippet`, `bulkImportLyricSnippets` — wszystkie z `requireSupabaseAuth` + `has_role('admin')`.

**Statystyki:** osobny blok w `/stats` (rozegrane, średnia liczba prób, najlepsza seria).

### 7. Lekkie odświeżenie UI/UX

- Spójniejszy header (logo / nav / zegar / online / konto).
- Karty na home z badge „🟢 X online".
- Drobne poprawki spacingu i hierarchii.

---

## Szczegóły techniczne

**Migracje DB:**
- `app_role` enum + `user_roles` + `has_role()` (security definer).
- `profiles` (id=auth.uid, nick, avatar_url).
- `user_stats` (user_id, daily jsonb, endless jsonb, versus jsonb).
- `user_settings` (user_id, enabled_album_ids text[]).
- `presence_pings` (player_id pk, nick, current_view, last_seen).
- `lyric_snippets` (track_id, lines text[], difficulty, active, created_by).
- Rozszerzenie polityk na `announcements` o INSERT/UPDATE dla admina.
- GRANTy zgodnie z polityką; RLS wszędzie.

**Server functions (`src/lib/*.functions.ts`):**
- `pingPresence`, `getActivePlayers` (public).
- `getMyStats`, `saveMyStats`, `getMySettings`, `saveMySettings` (auth).
- `getAnnouncements` (public), `upsertAnnouncement`, `deleteAnnouncement` (admin).
- `getLyricSnippetForToday`, `getRandomLyricSnippet` (public).
- `listLyricSnippets`, `upsertLyricSnippet`, `deleteLyricSnippet`, `bulkImportLyricSnippets` (admin).

**Pliki nowe:**
- Trasy: `routes/auth.tsx`, `routes/settings.albums.tsx`, `routes/lyrics.tsx`, `routes/lyrics.daily.tsx`.
- Komponenty: `components/clock.tsx`, `components/active-players.tsx`, `components/admin/announcements-panel.tsx`, `components/admin/lyrics-panel.tsx`, `components/lyrics/lyrics-board.tsx`.
- Hooki: `hooks/use-presence.ts`, `hooks/use-auth.ts`, `hooks/use-lyrics-game.ts`.
- Lib: `lib/presence.functions.ts`, `lib/user-stats.functions.ts`, `lib/announcements.functions.ts`, `lib/lyrics.functions.ts`.

**Edytowane:** `app-header.tsx`, `admin.tsx`, `settings.tsx`, `routes/index.tsx`, `use-game.ts`, `versus.index.tsx`, `changelog-popup.tsx`, `start.ts`, `changelog.ts`.

**Auth:** e-mail+hasło bez confirm, Google przez `lovable.auth.signInWithOAuth("google")`. `attachSupabaseAuth` w `src/start.ts`.

---

## Kolejność wdrożenia

1. Migracja DB (wszystkie tabele + role + grants + RLS).
2. Auth (route, hook, header).
3. Presence + zegar + widget online.
4. Wybór albumów + integracja z use-game.
5. Tryb wersów (gra + admin CRUD + import + opcjonalny fetch z Genius).
6. Panel ogłoszeń w adminie.
7. Sync statystyk dla zalogowanych.
8. Pass UI/UX i changelog.

Duża zmiana — daj zielone światło i lecę. Jeśli chcesz Genius API do auto-fetchowania tekstów, dorzuć klucz, ale to opcja.