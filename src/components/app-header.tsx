import { Link, useRouterState } from "@tanstack/react-router";
import { Disc3, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV = [
  { to: "/", label: "Start" },
  { to: "/daily", label: "Daily" },
  { to: "/endless", label: "Endless" },
  { to: "/albums", label: "Albumy" },
  { to: "/stats", label: "Statystyki" },
  { to: "/settings", label: "Ustawienia" },
] as const;

export function AppHeader() {
  const path = useRouterState({ select: r => r.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <header className="border-b border-hairline bg-paper/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
          <Disc3 className="h-5 w-5 text-primary group-hover:rotate-180 transition-transform duration-700" />
          <span className="font-display text-lg sm:text-xl tracking-tight truncate">RAP GUESSER</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.slice(0, -1).map(item => {
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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-hairline text-ink hover:border-ink/50 transition"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-hairline bg-paper/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV.map(item => {
              const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-4 py-2.5 text-sm rounded-2xl transition-colors",
                    active ? "bg-ink text-paper" : "text-ink hover:bg-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
