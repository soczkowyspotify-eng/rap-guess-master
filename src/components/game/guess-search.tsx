import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Song } from "@/data/songs";
import { dedupeSongs, fuzzyMatch } from "@/lib/game-data";
import { useI18n } from "@/i18n/i18n";

interface Props {
  pool: Song[];
  onSubmit: (song: Song) => void;
  onSkip: () => void;
  disabled?: boolean;
}

export function GuessSearch({ pool, onSubmit, onSkip, disabled }: Props) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    if (!q.trim()) return [];
    return dedupeSongs(pool.filter(s => fuzzyMatch(q, s))).slice(0, 8);
  }, [q, pool]);

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <input
          value={q}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          placeholder={t("game.search")}
          className="w-full h-14 pl-12 pr-4 bg-card border border-hairline rounded-2xl text-base outline-none focus:border-primary transition-colors disabled:opacity-50"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="mt-2 bg-card border border-hairline rounded-2xl overflow-hidden shadow-soft animate-scale-in origin-top">
          {matches.map(s => (
            <button
              key={s.id}
              onMouseDown={() => { onSubmit(s); setQ(""); setOpen(false); }}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between gap-3 border-b border-hairline last:border-0"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-sm text-ink-muted truncate">{s.artist}</div>
              </div>
              {s.year && <div className="text-xs text-ink-muted font-mono shrink-0">{s.year}</div>}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-ink-muted">{pool.length} {t("game.poolSize")}</span>
        <button
          onClick={onSkip}
          disabled={disabled}
          className="text-sm text-ink-muted hover:text-ink underline underline-offset-4 disabled:opacity-50"
        >
          {t("game.skip")}
        </button>
      </div>
    </div>
  );
}
