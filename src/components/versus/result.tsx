import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, RotateCcw, Home, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rematch } from "@/server/versus.functions";
import type { VersusMatch, VersusRoundResult } from "@/hooks/use-versus";
import { recordVersusMatch } from "@/lib/versus-stats";
import { ACHIEVEMENTS } from "@/lib/achievements";

interface Props {
  match: VersusMatch;
  results: VersusRoundResult[];
  playerId: string;
}

export function VersusResult({ match, results, playerId }: Props) {
  const navigate = useNavigate();
  const rematchFn = useServerFn(rematch);
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const isHost = match.host_player_id === playerId;
  const myScore = isHost ? match.host_score : match.guest_score;
  const oppScore = isHost ? match.guest_score : match.host_score;
  const myNick = isHost ? match.host_nick : match.guest_nick ?? "";
  const oppNick = isHost ? match.guest_nick ?? "—" : match.host_nick;
  const oppId = isHost ? match.guest_player_id : match.host_player_id;

  const outcome = myScore > oppScore ? "win" : myScore < oppScore ? "lose" : "draw";

  // Zapisz statystyki przy pierwszym wyświetleniu wyniku tego meczu
  useEffect(() => {
    const flagKey = `rg2-versus-recorded:${match.id}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(flagKey)) return;
    localStorage.setItem(flagKey, "1");
    let myRoundsWon = 0;
    let oppRoundsWon = 0;
    const byRound = new Map<number, VersusRoundResult[]>();
    for (const r of results) {
      if (!byRound.has(r.round_idx)) byRound.set(r.round_idx, []);
      byRound.get(r.round_idx)!.push(r);
    }
    for (const [, rows] of byRound) {
      const me = rows.find((r) => r.player_id === playerId);
      const op = rows.find((r) => r.player_id === oppId);
      if (!me || !op) continue;
      if (me.correct && op.correct) {
        if (me.attempts_used < op.attempts_used) myRoundsWon++;
        else if (op.attempts_used < me.attempts_used) oppRoundsWon++;
      } else if (me.correct) myRoundsWon++;
      else if (op.correct) oppRoundsWon++;
    }
    const u = recordVersusMatch({ myScore, oppScore, myRoundsWon, oppRoundsWon });
    setUnlocked(u);
  }, [match.id, myScore, oppScore, playerId, oppId, results]);

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id));

  const handleRematch = async () => {
    setBusy(true);
    try {
      const r = await rematchFn({ data: { matchId: match.id, playerId } });
      navigate({ to: "/versus/$matchId", params: { matchId: r.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl mx-auto text-center space-y-8 py-10">
      <Trophy className={`h-16 w-16 mx-auto ${outcome === "win" ? "text-success" : outcome === "lose" ? "text-primary" : "text-ink-muted"}`} />
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Koniec meczu</p>
        <h1 className="font-display text-5xl mt-2">
          {outcome === "win" ? "Wygrana!" : outcome === "lose" ? "Porażka" : "Remis"}
        </h1>
      </div>
      <div className="flex justify-center gap-8 items-end">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Ty · {myNick}</div>
          <div className="font-display text-6xl">{myScore}</div>
        </div>
        <div className="font-display text-3xl text-ink-muted pb-2">:</div>
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">{oppNick}</div>
          <div className="font-display text-6xl">{oppScore}</div>
        </div>
      </div>

      {unlockedAchievements.length > 0 && (
        <div className="bg-card border border-success/30 rounded-2xl p-5 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 text-success">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-[0.2em]">Nowe osiągnięcia</span>
          </div>
          <ul className="space-y-2">
            {unlockedAchievements.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="font-display text-base">{a.title}</div>
                <div className="text-xs text-ink-muted">{a.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={handleRematch} disabled={busy} className="rounded-full h-11">
          <RotateCcw className="h-4 w-4" /> Rewanż
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/versus" })} className="rounded-full h-11">
          <Home className="h-4 w-4" /> Nowy mecz
        </Button>
      </div>
    </div>
  );
}