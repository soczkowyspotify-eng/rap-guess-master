import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getActivePlayers } from "@/lib/presence.functions";
import { Circle } from "lucide-react";

export function ActivePlayers({ compact = false }: { compact?: boolean }) {
  const fn = useServerFn(getActivePlayers);
  const [data, setData] = useState<{ count: number; players: { nick: string; current_view: string }[] }>({ count: 0, players: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => fn({}).then(r => { if (!cancelled) setData(r); }).catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [fn]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card hover:border-ink/40 transition ${compact ? "px-2.5 h-7 text-xs" : "px-3 h-8 text-sm"}`}
      >
        <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
        <span className="font-medium">{data.count}</span>
        <span className="text-ink-muted">online</span>
      </button>
      {open && data.players.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-hairline rounded-2xl shadow-lift p-3 z-50">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted mb-2">Online ({data.count})</p>
          <ul className="space-y-1.5">
            {data.players.map((p, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.nick}</span>
                <span className="text-xs text-ink-muted ml-2 shrink-0">{viewLabel(p.current_view)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function viewLabel(v: string): string {
  const map: Record<string, string> = {
    home: "🏠", daily: "📅", endless: "♾️", versus: "⚔️", lyrics: "🎤", albums: "💿", stats: "📊",
  };
  return map[v] ?? "•";
}