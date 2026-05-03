import type { GuessResult } from "@/hooks/use-game";
import type { Song } from "@/data/songs";
import { Check, X, SkipForward } from "lucide-react";

export function GuessList({ guesses, pool }: { guesses: GuessResult[]; pool: Song[] }) {
  if (!guesses.length) return null;
  return (
    <ul className="space-y-2 w-full">
      {guesses.map((g, i) => {
        const t = pool.find(p => p.id === g.trackId);
        return (
          <li key={i} className="flex items-center gap-3 px-4 py-3 bg-card border border-hairline rounded-xl animate-slide-down">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              g.correct ? "bg-success/15 text-success" : "bg-muted text-ink-muted"
            }`}>
              {g.correct ? <Check className="h-4 w-4" /> : g.skipped ? <SkipForward className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              {g.skipped ? (
                <div className="text-sm italic text-ink-muted">Pominięto</div>
              ) : (
                <>
                  <div className="font-medium text-sm truncate">{t?.title ?? "—"}</div>
                  <div className="text-xs text-ink-muted truncate">{t?.artist}</div>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
