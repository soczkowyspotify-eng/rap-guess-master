import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  hostNick: string;
  guestNick: string | null;
  hostScore: number;
  guestScore: number;
  youAreHost: boolean;
  currentRound: number;
  variant?: "classic" | "blitz";
  timer?: ReactNode;
}

export function ScoreBar({ hostNick, guestNick, hostScore, guestScore, youAreHost, currentRound, variant = "classic", timer }: Props) {
  const totalRounds = variant === "blitz" ? 5 : 5;
  return (
    <div className="relative flex items-center justify-between gap-4 bg-card border border-hairline rounded-2xl p-4">
      <Side nick={hostNick} score={hostScore} isYou={youAreHost} align="left" />
      <div className="text-center">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Runda</div>
        <div className="font-display text-2xl">
          {variant === "blitz"
            ? `${currentRound} / 5`
            : currentRound > 5 ? `${currentRound} / 8` : `${currentRound} / 5`}
        </div>
        {variant === "blitz" ? (
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mt-0.5">Blitz</div>
        ) : currentRound > 5 ? (
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mt-0.5">Dogrywka</div>
        ) : null}
      </div>
      <Side nick={guestNick ?? "—"} score={guestScore} isYou={!youAreHost} align="right" />
      {timer && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          {timer}
        </div>
      )}
      {totalRounds /* keep */ && null}
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