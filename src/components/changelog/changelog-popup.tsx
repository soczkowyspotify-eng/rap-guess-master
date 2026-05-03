import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { CHANGELOG, CURRENT_VERSION } from "@/data/changelog";

const LS_KEY = "rg2-seen-changelog-version";

export function ChangelogPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(LS_KEY);
      if (seen !== CURRENT_VERSION) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(LS_KEY, CURRENT_VERSION); } catch {}
  };

  if (!open) return null;

  const latest = CHANGELOG[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />
      <div className="relative w-full sm:max-w-md bg-card border border-hairline sm:rounded-3xl rounded-t-3xl shadow-lift p-6 sm:p-8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <button
          onClick={close}
          aria-label="Zamknij"
          className="absolute top-4 right-4 h-8 w-8 inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-muted transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Nowości · v{latest.version}
        </div>
        <h2 className="font-display text-2xl sm:text-3xl leading-tight">{latest.title}</h2>
        <p className="text-xs font-mono text-ink-muted mt-1">{latest.date}</p>

        <ul className="mt-6 space-y-3">
          {latest.changes.map((c, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
              <span className="text-ink">{c}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={close}
          className="mt-8 w-full h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 transition"
        >
          Zaczynam grać
        </button>
      </div>
    </div>
  );
}