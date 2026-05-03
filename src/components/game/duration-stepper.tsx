export function DurationStepper({ durations, currentIdx, guesses }: {
  durations: number[];
  currentIdx: number;
  guesses: { correct: boolean; skipped?: boolean }[];
}) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      {durations.map((d, i) => {
        const guess = guesses[i];
        const isPast = i < guesses.length;
        const isCurrent = i === currentIdx && guesses.length === currentIdx;
        const isFuture = i > currentIdx || (i === currentIdx && guesses.length > currentIdx);
        let bg = "bg-hairline";
        if (isPast) bg = guess?.correct ? "bg-success" : "bg-foreground/30";
        if (isCurrent) bg = "bg-primary";
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`h-1.5 w-full rounded-full transition-colors ${bg} ${isFuture ? "opacity-40" : ""}`} />
            <span className="font-mono text-[10px] text-ink-muted tracking-wider">{d}s</span>
          </div>
        );
      })}
    </div>
  );
}
