import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VersusMatch {
  id: string;
  host_player_id: string;
  host_nick: string;
  guest_player_id: string | null;
  guest_nick: string | null;
  status: "lobby" | "playing" | "finished";
  current_round: number;
  host_score: number;
  guest_score: number;
  created_at: string;
  updated_at: string;
}

export interface VersusRoundResult {
  match_id: string;
  round_idx: number;
  player_id: string;
  attempts_used: number;
  correct: boolean;
}

/** Subskrybuje stan meczu + wyniki rund w realtime. */
export function useVersusMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<VersusMatch | null>(null);
  const [results, setResults] = useState<VersusRoundResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    const fetchAll = async () => {
      const [{ data: m, error: mErr }, { data: r, error: rErr }] = await Promise.all([
        supabase
          .from("versus_matches")
          .select("id, host_player_id, host_nick, guest_player_id, guest_nick, status, current_round, host_score, guest_score, created_at, updated_at")
          .eq("id", matchId)
          .maybeSingle(),
        supabase
          .from("versus_round_results")
          .select("match_id, round_idx, player_id, attempts_used, correct")
          .eq("match_id", matchId),
      ]);
      if (cancelled) return;
      if (mErr) setError(mErr.message);
      if (rErr) setError(rErr.message);
      setMatch((m as VersusMatch) ?? null);
      setResults((r as VersusRoundResult[]) ?? []);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`versus:${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "versus_matches", filter: `id=eq.${matchId}` },
        () => fetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "versus_round_results", filter: `match_id=eq.${matchId}` },
        () => fetchAll(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [matchId, version]);

  return { match, results, loading, error, refresh: () => setVersion((v) => v + 1) };
}