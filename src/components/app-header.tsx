import { Link, useRouterState } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Start" },
  { to: "/daily", label: "Daily" },
  { to: "/endless", label: "Endless" },
  { to: "/albums", label: "Albumy" },
  { to: "/stats", label: "Statystyki" },
] as const;

export function AppHeader() {
  const path = useRouterState({ select: r => r.location.pathname });
  return (
    <header className="border-b border-hairline bg-paper/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <Disc3 className="h-5 w-5 text-primary group-hover:rotate-180 transition-transform duration-700" />
          <span className="font-display text-xl tracking-tight">RAP GUESSER</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(item => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  active ? "bg-ink text-paper" : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link to="/settings" className="ml-2 px-3 py-1.5 text-sm text-ink-muted hover:text-ink">
            Ustawienia
          </Link>
        </nav>
      </div>
    </header>
  );
}
