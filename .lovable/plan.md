
# Tryb Versus 1v1 — best of 5 (na efektywność, nie na czas)

Nowy tryb gry, w którym dwóch graczy słucha **tych samych** track-ów w tej samej kolejności i rywalizuje o to, kto odgadnie utwór z **mniejszą liczbą prób** (czyli z krótszym samplem). Mecz toczy się do 3 wygranych rund (best of 5). Bez logowania — tożsamość gracza opiera się na losowym `playerId` w localStorage + nicku ustawianym per mecz.

## Zasady rundy (kluczowe — tu była zmiana)

W rundzie nie liczy się kto **szybciej** kliknie, tylko kto zużył mniej prób.

- Każdy gracz gra rundę **niezależnie** w swoim tempie, używając standardowego `GameBoard` i siatki sampli z `DIFFICULTY.normal` (0.5s → 1s → 2s → 4s → 7s → 15s, 6 prób).
- Po każdej próbie (trafienie / pudło / skip) wynik gracza jest wysyłany do bazy. Przeciwnik widzi tylko liczbę zużytych prób, **nie** to, czy trafił, ani jaki track wybrał.
- Runda kończy się, gdy **oboje** mają wynik (trafili lub wyczerpali 6 prób).
- Wynik rundy:
  - kto trafił przy mniejszym `attemptIdx` (mniej prób) — **wygrywa** rundę,
  - obaj trafili przy tej samej liczbie prób — **remis** rundy (po 0.5 pkt każdy),
  - tylko jeden trafił — wygrywa ten, który trafił,
  - obaj nie trafili — remis (po 0.5 pkt).
- Limit czasu rundy 90 s — jeśli ktoś nie zdążył oddać żadnej próby, traktujemy go jak "wyczerpał wszystkie próby".
- Anty-cheat: drugi gracz **nie widzi** którego utworu szuka przeciwnik (nie pokazujemy guess'ów), żeby nie można było ściągać. Widoczny jest tylko licznik prób przeciwnika ("Próba 3/6") i czy już zakończył rundę.

Mecz: best of 5 — pierwszy do 3 wygranych rund. Przy 2.5–2.5 po 5 rundach gramy 6. rundę-dogrywkę.

## Jak to wygląda dla gracza

```text
/versus                       → ekran startowy: nick + [Stwórz mecz] / [Wklej kod]
/versus/$matchId              → lobby → mecz → wynik
```

Flow:
1. Gracz A wpisuje nick (1–24 znaki, edytowalny zawsze; sugestia z localStorage), klika "Stwórz mecz" → `/versus/$matchId`, kopiuje link.
2. Gracz B otwiera link, wpisuje swój nick, dołącza.
3. W lobby każdy gracz może zmienić **swój** nick przyciskiem "Zmień nick"; po starcie pierwszej rundy nicki są zablokowane do końca meczu.
4. Host startuje rundę → obaj dostają ten sam track, każdy gra niezależnie.
5. Po zakończeniu obu graczy w rundzie pokazujemy podsumowanie ("Ty: 3 próby / Przeciwnik: 5 prób → wygrałeś rundę") i przycisk "Następna runda" (host).
6. Po meczu — ekran wyniku z opcją rewanżu.

## Architektura

Bez auth. Tożsamość = `playerId` (uuid v4 w localStorage `rg.playerId`) + per-match nick.

### Baza (nowe tabele)

`versus_matches`:
- `id` uuid PK
- `host_player_id` text, `host_nick` text
- `guest_player_id` text nullable, `guest_nick` text nullable
- `status` text: `lobby` | `playing` | `finished`
- `current_round` int default 0
- `host_score` numeric(3,1) default 0  ← numeric bo dopuszczamy 0.5 za remis
- `guest_score` numeric(3,1) default 0
- `track_ids` text[] (5–6 trackId; niewystawiane do publicznego selectu)
- `created_at`, `updated_at`

`versus_round_results`:
- `id` uuid PK
- `match_id` uuid FK
- `round_idx` int
- `player_id` text
- `attempts_used` int  (0–6; ile prób zużył; 6 = nie trafił)
- `correct` boolean
- `finished_at` timestamptz default now()
- unique (match_id, round_idx, player_id)

Widok `versus_matches_public` — wszystko **oprócz `track_ids`**. RLS publicznie SELECT na widoku. Cały INSERT/UPDATE realnej tabeli idzie przez server functions z `supabaseAdmin`. RLS na `versus_round_results`: SELECT publiczny, INSERT przez serwer.

### Realtime

`ALTER PUBLICATION supabase_realtime ADD TABLE versus_matches, versus_round_results;` Klient subskrybuje po `match_id`.

### Server functions (`src/server/versus.functions.ts`)

- `createMatch({ playerId, nick })` — waliduje nick (trim, 1–24), losuje 6 trackId, wstawia mecz, zwraca `{ id }`.
- `joinMatch({ matchId, playerId, nick })` — waliduje, sadza guesta lub puszcza powracającego playerId.
- `updateNick({ matchId, playerId, nick })` — działa tylko w `lobby`.
- `startMatch({ matchId, playerId })` — host, lobby pełne → status `playing`, `current_round = 1`.
- `getRoundTrack({ matchId, playerId, roundIdx })` — zwraca `trackId` dla bieżącej rundy (autoryzacja po playerId; poprzednie rundy też dostępne dla "rerun preview").
- `submitRoundResult({ matchId, playerId, roundIdx, attemptsUsed, correct })` — wstawia wynik gracza. Jeśli oboje mają wynik dla tej rundy:
  - liczy zwycięzcę rundy (mniej `attempts_used`; tie-break przez `correct`; obaj `correct=false` → remis),
  - inkrementuje `host_score`/`guest_score` (1 / 0 / 0.5–0.5),
  - jeśli ktoś osiągnął 3 → `status='finished'`,
  - inaczej `current_round += 1`.
- `rematch({ matchId, playerId })` — tworzy nowy mecz z tymi samymi nickami (każdy może je dalej zmieniać w nowym lobby).

Wszystkie funkcje przez `supabaseAdmin`, z jawną walidacją że `playerId` należy do meczu.

### Frontend

Nowe pliki:
- `src/routes/versus.tsx` — ekran startowy.
- `src/routes/versus.$matchId.tsx` — kontener; subskrybuje realtime; renderuje `<VersusLobby>` / `<VersusRound>` / `<VersusResult>` zależnie od `status`.
- `src/components/versus/{lobby,round,result,score-bar,opponent-progress,nick-input,nick-edit-dialog}.tsx`.
- `src/hooks/use-versus.ts` — stan meczu + realtime + lokalny `playerId`/`nick`.

`<VersusRound>` reużywa `GameBoard` z `useGame`, z trybem `"versus"`:
- mode `"versus"` w `useGame`/`game-data.ts` przyjmuje pojedynczy track z zewnątrz (z `getRoundTrack`),
- po `won` lub `lost` woła `submitRoundResult({ attemptsUsed: attemptIdx, correct: status==='won' })` zamiast lokalnej logiki ranking/streak,
- obok planszy renderujemy `<OpponentProgress>` z licznikiem prób przeciwnika (z realtime: ostatni event w tej rundzie po jego stronie — derywujemy z `versus_round_results` po zakończeniu, a w trakcie z lekkiego beaconu — patrz niżej),
- dopóki przeciwnik nie skończył rundy, gracz po swoim zakończeniu czeka na ekranie "Czekamy na przeciwnika…".

#### Opcjonalny live-progress przeciwnika

Żeby przeciwnik widział "Próba 3/6" u rywala w trakcie rundy bez ujawniania guess'ów, dodajemy lekki kanał:
- Supabase Realtime **broadcast** (nie postgres_changes) na kanale `versus:<matchId>`. Klient po każdej zmianie `attemptIdx` emituje `{ playerId, roundIdx, attemptIdx }`.
- Brak persystencji, brak kosztu DB. To tylko ozdobnik UX, autorytatywny wynik idzie i tak przez `submitRoundResult`.

### Ekran startowy / NickInput

`<NickInput>` — placeholder "Twój nick na ten mecz", maxLength 24, trim, licznik znaków. Domyślna wartość z `localStorage["rg.versusNick"]`, ale to tylko sugestia. Po każdej zmianie zapisujemy do localStorage jako sugestię na przyszłość; źródłem prawdy w meczu są `host_nick`/`guest_nick` w bazie.

Używany w 3 miejscach: `/versus`, ekran "Dołącz" w `/versus/$matchId` (gdy guest pierwszy raz wchodzi), dialog "Zmień nick" w lobby.

### Nawigacja i SEO

- Dodaj `/versus` do `NAV` w `src/components/app-header.tsx`.
- Dodaj 4. kafelek na `index.tsx` (ikona `Swords` z lucide).
- `head()` z własnym title/description na obu route'ach.
- Tłumaczenia w `src/i18n/translations.ts`: `versus.tag`, `versus.create`, `versus.join`, `versus.copyLink`, `versus.nick.{label,placeholder,change,tooLong,empty}`, `versus.you`, `versus.opponent`, `versus.bo5`, `versus.round`, `versus.waiting.opponent`, `versus.round.youWon`, `versus.round.youLost`, `versus.round.draw`, `versus.attemptsUsed`, `versus.win`, `versus.lose`, `versus.draw`, `versus.rematch`.

## Edge cases

- Pusty/whitespace nick → odrzucamy w server fn i UI.
- Próba zmiany nicku po starcie → server fn `nick_locked`, UI ukrywa przycisk.
- Reload w trakcie rundy: gracz, który już wysłał `submitRoundResult` dla aktualnej rundy, wraca na ekran "czekamy"; ten, który nie zdążył — kontynuuje od początku rundy z tym samym `trackId` (atrybuty rundy są deterministyczne, `attemptIdx` jednak liczymy od 0 — wpis o przerwanej próbie nie istnieje, bo wysyłamy wynik dopiero przy finiszu).
- Dwóch graczy z tym samym nickiem → dozwolone, w UI dopisujemy "(Ty)" po `playerId`.
- Brak gracza B przez >10 min → mecz oznaczony jako wygasły w UI (filtr po `created_at`).
- Cheat: nie pokazujemy track-id ani guess'ów przeciwnika do końca rundy; do końca meczu nie pokazujemy też przyszłych track-ów.

## Pliki

Nowe:
- `supabase/migrations/<ts>_versus.sql` (tabele, widok publiczny, RLS, realtime publication)
- `src/server/versus.functions.ts`, `src/server/versus.server.ts`
- `src/routes/versus.tsx`, `src/routes/versus.$matchId.tsx`
- `src/components/versus/{lobby,round,result,score-bar,opponent-progress,nick-input,nick-edit-dialog}.tsx`
- `src/hooks/use-versus.ts`

Edytowane:
- `src/components/app-header.tsx`
- `src/routes/index.tsx`
- `src/i18n/translations.ts`
- `src/lib/storage.ts` (`getOrCreatePlayerId()`, `getSuggestedVersusNick()`, `saveSuggestedVersusNick()`)
- `src/hooks/use-game.ts` / `src/lib/game-data.ts` (dodanie mode `"versus"` przyjmującego track z zewnątrz, bez Storage stats)

## Co dostaniesz po wdrożeniu

- Tryb 1v1 pod `/versus`, link-zaproszenie, **rywalizacja na efektywność** (mniej prób = wygrana rundy), best of 5, rewanż.
- Każdy gracz ustawia własny nick na czas konkretnej rozgrywki (edytowalny w lobby, zablokowany po starcie meczu, zapamiętywany jako sugestia).
- Bez logowania, bez nowych sekretów — wszystko na istniejącym Lovable Cloud + Realtime.
