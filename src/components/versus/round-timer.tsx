import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** ms timestamp (Date.now) kiedy uruchomiono timer; null = nie uruchomiony */
  startedAt: number | null;
  /** sekundy */
  totalSec: number;
  /** wywołane raz po upłynięciu czasu */
  onExpire?: () => void;
}

export function RoundTimer({ startedAt, totalSec, onExpire }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const i = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(i);
  }, [startedAt]);

  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const remaining = Math.max(0, totalSec - elapsed);
  const pct = startedAt ? Math.min(1, elapsed / totalSec) : 0;
  const expired = startedAt && remaining <= 0;

  useEffect(() => {
    if (expired) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - pct);
  const danger = remaining <= 3 && startedAt;

  return (
    <div className={cn("relative w-14 h-14 grid place-items-center", danger && "animate-pulse")}>
      <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" className="text-hairline" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke="currentColor"
          className={cn(danger ? "text-primary" : "text-ink")}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dash}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <span className={cn("relative font-mono text-sm font-semibold", danger && "text-primary")}>
        {startedAt ? Math.ceil(remaining) : totalSec}
      </span>
    </div>
  );
}