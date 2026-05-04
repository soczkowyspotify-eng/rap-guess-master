import { Languages } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useI18n, LANGS, type Lang } from "@/i18n/i18n";
import type { LangPref } from "@/i18n/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, pref, setPref, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = LANGS.find(l => l.code === lang);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={t("lang.label")}
        className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-full border border-hairline text-ink-muted hover:text-ink hover:border-ink/50 transition"
      >
        <Languages className="h-4 w-4" />
        <span className="text-xs font-mono uppercase">{current?.code}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[180px] bg-card border border-hairline rounded-2xl shadow-lift overflow-hidden z-50 animate-scale-in origin-top-right">
          <button
            onClick={() => { setPref("auto"); setOpen(false); }}
            className={cn(
              "w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition flex items-center justify-between",
              pref === "auto" && "bg-muted",
            )}
          >
            <span>🌐 {t("settings.lang.auto")}</span>
            {pref === "auto" && <span className="text-xs font-mono text-primary">●</span>}
          </button>
          <div className="h-px bg-hairline" />
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => { setPref(l.code as LangPref); setOpen(false); }}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition flex items-center justify-between",
                pref === l.code && "bg-muted",
              )}
            >
              <span>{l.flag} {l.label}</span>
              {pref === l.code && <span className="text-xs font-mono text-primary">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}