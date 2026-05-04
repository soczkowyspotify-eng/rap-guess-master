import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { allSongs } from "@/lib/game-data";

const PlayerSchema = z.object({
  playerId: z.string().min(8).max(64),
  nick: z.string().trim().min(1).max(24),
  mode: z.enum(["classic", "blitz"]).optional(),
});

const MatchIdSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().min(8).max(64),
});

function pickRandomTrackIds(n: number): string[] {
  const all = allSongs();
  if (all.length === 0) throw new Error("Brak utworów w bazie");
  const ids = new Set<string>();
  // Jeśli jest mniej tracków niż n, dopuszczamy powtórki jako fallback
  let guard = 0;
  while (ids.size < n && guard < n * 50) {
    ids.add(all[Math.floor(Math.random() * all.length)].id);
    guard++;
  }
  if (ids.size < n) {
    // dopełniamy powtórkami
    while (ids.size < n) ids.add(all[Math.floor(Math.random() * all.length)].id + "#" + ids.size);
  }
  return Array.from(ids).slice(0, n);
}

/** Tworzy nowy mecz, gracz zostaje hostem. */
export const createMatch = createServerFn({ method: "POST" })
  .inputValidator((d) => PlayerSchema.parse(d))
  .handler(async ({ data }) => {
    const mode = data.mode ?? "classic";
    const trackIds = pickRandomTrackIds(mode === "blitz" ? 5 : 8);
    const { data: row, error } = await supabaseAdmin
      .from("versus_matches")
      .insert({
        host_player_id: data.playerId,
        host_nick: data.nick.trim(),
        track_ids: trackIds,
        mode,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row!.id as string };
  });

/** Dołączenie do meczu jako gość (lub powrót na swój slot). */
export const joinMatch = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        matchId: z.string().uuid(),
        playerId: z.string().min(8).max(64),
        nick: z.string().trim().min(1).max(24),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("id, host_player_id, guest_player_id, status")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");

    // Host wraca → nic nie robimy
    if (m.host_player_id === data.playerId) return { ok: true, role: "host" as const };

    // Już gość — to ten sam playerId? OK.
    if (m.guest_player_id && m.guest_player_id !== data.playerId) {
      throw new Error("Mecz jest już pełny");
    }

    if (m.status !== "lobby" && !m.guest_player_id) {
      throw new Error("Mecz wystartował");
    }

    if (!m.guest_player_id) {
      const { error: uErr } = await supabaseAdmin
        .from("versus_matches")
        .update({ guest_player_id: data.playerId, guest_nick: data.nick.trim() })
        .eq("id", data.matchId);
      if (uErr) throw new Error(uErr.message);
    }
    return { ok: true, role: "guest" as const };
  });

/** Zmiana własnego nicku — tylko w lobby. */
export const updateNick = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        matchId: z.string().uuid(),
        playerId: z.string().min(8).max(64),
        nick: z.string().trim().min(1).max(24),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, guest_player_id, status")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.status !== "lobby") throw new Error("Nicku nie można już zmienić");
    const patch =
      m.host_player_id === data.playerId
        ? { host_nick: data.nick.trim() }
        : m.guest_player_id === data.playerId
        ? { guest_nick: data.nick.trim() }
        : null;
    if (!patch) throw new Error("Nie jesteś w tym meczu");
    const { error: uErr } = await supabaseAdmin
      .from("versus_matches")
      .update(patch)
      .eq("id", data.matchId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

/** Start meczu — tylko host, lobby pełne. */
export const startMatch = createServerFn({ method: "POST" })
  .inputValidator((d) => MatchIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, guest_player_id, status")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.host_player_id !== data.playerId) throw new Error("Tylko host może rozpocząć");
    if (!m.guest_player_id) throw new Error("Brak drugiego gracza");
    if (m.status !== "lobby") throw new Error("Mecz już wystartował");
    const { error: uErr } = await supabaseAdmin
      .from("versus_matches")
      .update({ status: "playing", current_round: 1 })
      .eq("id", data.matchId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

/** Zwraca trackId dla danej rundy — autoryzacja po playerId. */
export const getRoundTrack = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        matchId: z.string().uuid(),
        playerId: z.string().min(8).max(64),
        roundIdx: z.number().int().min(1).max(8),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, guest_player_id, track_ids, status")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.host_player_id !== data.playerId && m.guest_player_id !== data.playerId) {
      throw new Error("Nie jesteś w tym meczu");
    }
    if (m.status === "lobby") throw new Error("Mecz jeszcze nie wystartował");
    const list = (m.track_ids ?? []) as string[];
    const trackId = list[data.roundIdx - 1];
    if (!trackId) throw new Error("Brak utworu dla tej rundy");
    return { trackId };
  });

/** Wysłanie wyniku rundy. Po wpisie obu graczy rozstrzyga rundę i mecz. */
export const submitRoundResult = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        matchId: z.string().uuid(),
        playerId: z.string().min(8).max(64),
        roundIdx: z.number().int().min(1).max(8),
        attemptsUsed: z.number().int().min(0).max(6),
        correct: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, guest_player_id, status, current_round, host_score, guest_score, track_ids, mode")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.status === "finished") throw new Error("Mecz zakończony");
    if (m.host_player_id !== data.playerId && m.guest_player_id !== data.playerId) {
      throw new Error("Nie jesteś w tym meczu");
    }
    if (m.current_round !== data.roundIdx) throw new Error("To nie jest aktualna runda");

    // Wstaw wynik (idempotentnie po unique)
    const { error: insErr } = await supabaseAdmin.from("versus_round_results").insert({
      match_id: data.matchId,
      round_idx: data.roundIdx,
      player_id: data.playerId,
      attempts_used: data.attemptsUsed,
      correct: data.correct,
    });
    if (insErr && insErr.code !== "23505") throw new Error(insErr.message);

    // Czy obaj gracze już wysłali?
    const { data: results, error: rErr } = await supabaseAdmin
      .from("versus_round_results")
      .select("player_id, attempts_used, correct")
      .eq("match_id", data.matchId)
      .eq("round_idx", data.roundIdx);
    if (rErr) throw new Error(rErr.message);

    if (!results || results.length < 2) return { ok: true, roundDone: false };

    const host = results.find((r) => r.player_id === m.host_player_id);
    const guest = results.find((r) => r.player_id === m.guest_player_id);
    if (!host || !guest) return { ok: true, roundDone: false };

    // Rozstrzygnięcie: kto trafił z mniejszą liczbą prób.
    let hostPts = 0;
    let guestPts = 0;
    if (host.correct && !guest.correct) hostPts = 1;
    else if (!host.correct && guest.correct) guestPts = 1;
    else if (host.correct && guest.correct) {
      if (host.attempts_used < guest.attempts_used) hostPts = 1;
      else if (guest.attempts_used < host.attempts_used) guestPts = 1;
      else { hostPts = 0.5; guestPts = 0.5; }
    } else {
      hostPts = 0.5; guestPts = 0.5;
    }

    const newHost = Number(m.host_score) + hostPts;
    const newGuest = Number(m.guest_score) + guestPts;
    const completedRound = m.current_round;
    const isBlitz = (m as any).mode === "blitz";
    const REGULAR = 5;
    const MAX = isBlitz ? 5 : 8;

    let nextStatus: "playing" | "finished" = "playing";
    let nextRound = completedRound + 1;

    if (isBlitz) {
      if (completedRound >= REGULAR) nextStatus = "finished";
    } else if (completedRound < REGULAR) {
      // Normalna faza: pierwszy do 3 wygrywa wcześniej.
      if (newHost >= 3 || newGuest >= 3) nextStatus = "finished";
    } else {
      // Po 5. rundzie: koniec jeśli ktoś prowadzi, inaczej dogrywka do max 8.
      if (newHost !== newGuest) nextStatus = "finished";
      else if (completedRound >= MAX) nextStatus = "finished";
    }

    const { error: uErr } = await supabaseAdmin
      .from("versus_matches")
      .update({
        host_score: newHost,
        guest_score: newGuest,
        status: nextStatus,
        current_round: nextStatus === "finished" ? m.current_round : nextRound,
      })
      .eq("id", data.matchId);
    if (uErr) throw new Error(uErr.message);

    return { ok: true, roundDone: true };
  });

/** Rewanż — nowy mecz z tymi samymi nickami. Każdy gracz potem może je zmienić. */
export const rematch = createServerFn({ method: "POST" })
  .inputValidator((d) => MatchIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, host_nick, guest_player_id, guest_nick, status, mode")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.status !== "finished") throw new Error("Mecz jeszcze trwa");
    if (m.host_player_id !== data.playerId && m.guest_player_id !== data.playerId) {
      throw new Error("Nie jesteś w tym meczu");
    }
    const mode = (m as any).mode ?? "classic";
    const trackIds = pickRandomTrackIds(mode === "blitz" ? 5 : 8);
    const { data: row, error: insErr } = await supabaseAdmin
      .from("versus_matches")
      .insert({
        host_player_id: m.host_player_id,
        host_nick: m.host_nick,
        guest_player_id: m.guest_player_id,
        guest_nick: m.guest_nick,
        track_ids: trackIds,
        mode,
        status: "playing",
        current_round: 1,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return { id: row!.id as string };
  });

/** Gracz prosi o rewanż — ustawia flagę. Drugi gracz zobaczy popup. */
export const requestRematch = createServerFn({ method: "POST" })
  .inputValidator((d) => MatchIdSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, guest_player_id, status, rematch_requested_by, rematch_match_id")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.status !== "finished") throw new Error("Mecz jeszcze trwa");
    if (m.host_player_id !== data.playerId && m.guest_player_id !== data.playerId) {
      throw new Error("Nie jesteś w tym meczu");
    }
    if ((m as any).rematch_match_id) {
      return { ok: true, rematchId: (m as any).rematch_match_id as string };
    }
    const { error: uErr } = await supabaseAdmin
      .from("versus_matches")
      .update({ rematch_requested_by: data.playerId })
      .eq("id", data.matchId);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

/** Odpowiedź na rewanż — accept tworzy nowy mecz, decline czyści flagę. */
export const respondRematch = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      matchId: z.string().uuid(),
      playerId: z.string().min(8).max(64),
      accept: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: m, error } = await supabaseAdmin
      .from("versus_matches")
      .select("host_player_id, host_nick, guest_player_id, guest_nick, status, mode, rematch_requested_by, rematch_match_id")
      .eq("id", data.matchId)
      .single();
    if (error || !m) throw new Error("Nie ma takiego meczu");
    if (m.host_player_id !== data.playerId && m.guest_player_id !== data.playerId) {
      throw new Error("Nie jesteś w tym meczu");
    }
    const requester = (m as any).rematch_requested_by as string | null;
    if (!requester || requester === data.playerId) throw new Error("Brak zaproszenia");
    if (!data.accept) {
      await supabaseAdmin
        .from("versus_matches")
        .update({ rematch_requested_by: null })
        .eq("id", data.matchId);
      return { ok: true, accepted: false };
    }
    if ((m as any).rematch_match_id) {
      return { ok: true, accepted: true, rematchId: (m as any).rematch_match_id as string };
    }
    const mode = (m as any).mode ?? "classic";
    const trackIds = pickRandomTrackIds(mode === "blitz" ? 5 : 8);
    const { data: row, error: insErr } = await supabaseAdmin
      .from("versus_matches")
      .insert({
        host_player_id: m.host_player_id,
        host_nick: m.host_nick,
        guest_player_id: m.guest_player_id,
        guest_nick: m.guest_nick,
        track_ids: trackIds,
        mode,
        status: "playing",
        current_round: 1,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    await supabaseAdmin
      .from("versus_matches")
      .update({ rematch_match_id: row!.id, rematch_requested_by: null })
      .eq("id", data.matchId);
    return { ok: true, accepted: true, rematchId: row!.id as string };
  });