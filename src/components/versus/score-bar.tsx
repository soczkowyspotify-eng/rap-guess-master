import { cn } from "@/lib/utils";

interface Props {
  hostNick: string;
  guestNick: string | null;
  hostScore: number;
  guestScore: number;
  youAreHost: boolean;
  currentRound: number;
}

export function ScoreBar({ hostNick, guestNick, hostScore, guestScore, youAreHost, currentRound }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 bg-card border border-hairline rounded-2xl p-4">
      <Side nick={hostNick} score={hostScore} isYou={youAreHost} align="left" />
      <div className="text-center">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Runda</div>
        <div className="font-display text-2xl">{currentRound} / 5</div>
      </div>
      <Side nick={guestNick ?? "—"} score={guestScore} isYou={!youAreHost} align="right" />
    </div>
  );
}

function Side({ nick, score, isYou, align }: { nick: string; score: number; isYou: boolean; align: "left" | "right" }) {
  return (
    <div className={cn("flex-1 min-w-0", align === "right" && "text-right")}>
      <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">
        {isYou ? "Ty" : "Przeciwnik"}
      </div>
      <div className="font-display text-lg truncate">{nick}</div>
      <div className="font-display text-3xl text-primary">{score}</div>
    </div>
  );
}