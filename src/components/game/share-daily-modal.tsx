import { useEffect, useState } from "react";
import { X, Copy, Check } from "lucide-react";
import type { GuessResult } from "@/hooks/use-game";

interface Props {
  number: number;
  won: boolean;
  guesses: GuessResult[];
  maxAttempts: number;
  onClose: () => void;
}

export function ShareDailyModal({ number, won, guesses, maxAttempts, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const squares = Array.from({ length: maxAttempts }, (_, i) => {
    const g = guesses[i];
    if (!g) return "⬜";
    if (g.correct) return "🟢";
    if (g.skipped) return "⏭️";
    return "🟥";
  }).join("");

  const text = `RAP GUESSER #${number} ${won ? `${guesses.length}/${maxAttempts}` : "X/" + maxAttempts}\n${squares}\nrap-guesser.lovable.app`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-paper border border-hairline rounded-3xl max-w-md w-full p-8 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Wynik daily</p>
        <h2 className="font-display text-3xl mt-2 mb-6">RAP GUESSER #{number}</h2>
        <pre className="bg-muted rounded-2xl p-5 font-mono text-sm whitespace-pre-wrap leading-relaxed">{text}</pre>
        <button
          onClick={copy}
          className="mt-5 w-full h-12 rounded-full bg-ink text-paper font-medium flex items-center justify-center gap-2 hover:opacity-90"
        >
          {copied ? <><Check className="h-4 w-4" /> Skopiowano</> : <><Copy className="h-4 w-4" /> Skopiuj wynik</>}
        </button>
      </div>
    </div>
  );
}
