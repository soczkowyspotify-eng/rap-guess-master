import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, RotateCcw, Home } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rematch } from "@/server/versus.functions";
import type { VersusMatch } from "@/hooks/use-versus";

interface Props {
  match: VersusMatch;
  playerId: string;
}

export function VersusResult({ match, playerId }: Props) {
  const navigate = useNavigate();
  const rematchFn = useServerFn(rematch);
  const [busy, setBusy] = useState(false);

  const isHost = match.host_player_id === playerId;
  const myScore = isHost ? match.host_score : match.guest_score;
  const oppScore = isHost ? match.guest_score : match.host_score;
  const myNick = isHost ? match.host_nick : match.guest_nick ?? "";
  const oppNick = isHost ? match.guest_nick ?? "—" : match.host_nick;

  const outcome = myScore > oppScore ? "win" : myScore < oppScore ? "lose" : "draw";

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