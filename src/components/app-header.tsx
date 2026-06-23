import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, LogIn, User as UserIcon, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/i18n/i18n";
import logoUrl from "@/assets/logo.png";
import { Clock } from "@/components/clock";
import { ActivePlayers } from "@/components/active-players";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", key: "nav.start" },
  { to: "/daily", key: "nav.daily" },
  { to: "/endless", key: "nav.endless" },
  { to: "/lyrics", key: "nav.lyrics" },
  { to: "/albums", key: "nav.albums" },
  { to: "/versus", key: "nav.versus" },
  { to: "/suggest", key: "nav.suggest" },
  { to: "/stats", key: "nav.stats" },
  { to: "/settings", key: "nav.settings" },
] as const;

export function AppHeader() {
  const path = useRouterState({ select: r => r.location.pathname });
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { t } = useI18n();
  const { user, profile, signOut } = useAuth();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { setAccountOpen(false); }, [path]);

  return (
    <header className="border-b border-hairline bg-paper/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
          <img
            src={logoUrl}
            alt="RAP GUESSER"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain group-hover:rotate-12 transition-transform duration-500"
          />
          <span className="font-display text-lg sm:text-xl tracking-tight truncate">
            <span className="text-primary">RAP</span>GUESSER
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.slice(0, -1).map(item => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-2.5 py-1.5 text-sm rounded-full transition-colors",
                  active ? "bg-ink text-paper" : "text-ink-muted hover:text-ink",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
          <Link to="/settings" className="ml-1 px-2.5 py-1.5 text-sm text-ink-muted hover:text-ink">
            {t("nav.settings")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block"><Clock /></div>
          <ActivePlayers compact />
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setAccountOpen(o => !o)}
                  className="h-8 w-8 rounded-full bg-ink text-paper text-xs font-semibold inline-flex items-center justify-center hover:opacity-90"
                  aria-label="Konto"
                >
                  {(profile?.nick ?? user.email ?? "?")[0]?.toUpperCase()}
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-hairline rounded-2xl shadow-lift p-2 z-50">
                    <div className="px-3 py-2 border-b border-hairline mb-1">
                      <div className="text-sm font-medium truncate">{profile?.nick ?? user.email}</div>
                      {profile?.nick && <div className="text-xs text-ink-muted truncate">{user.email}</div>}
                    </div>
                    <button
                      onClick={() => { signOut(); setAccountOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-muted text-sm inline-flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Wyloguj
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:inline-flex h-8 px-3 rounded-full border border-hairline hover:border-ink items-center gap-1.5 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" /> Zaloguj
              </Link>
            )}
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? t("menu.close") : t("menu.open")}
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
                  {t(item.key)}
                </Link>
              );
            })}
            {!user && (
              <Link to="/auth" className="px-4 py-2.5 text-sm rounded-2xl text-ink hover:bg-muted inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Zaloguj się
              </Link>
            )}
            <div className="px-4 pt-3 pb-1 border-t border-hairline mt-1"><Clock /></div>
          </div>
        </nav>
      )}
    </header>
  );
}
