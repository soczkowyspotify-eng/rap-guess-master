import { useEffect, useState } from "react";
import { Clock as ClockIcon } from "lucide-react";

function format(d: Date): string {
  const date = d.toLocaleDateString("pl-PL", {
    weekday: "short", day: "numeric", month: "long", timeZone: "Europe/Warsaw",
  });
  const time = d.toLocaleTimeString("pl-PL", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw",
  });
  return `${date} · ${time}`;
}

export function Clock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted ${compact ? "" : "tabular-nums"}`}>
      <ClockIcon className="h-3 w-3" />
      {format(now)}
    </span>
  );
}