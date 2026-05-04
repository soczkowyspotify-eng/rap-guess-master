import { useEffect, useState } from "react";
import { X, Copy, Check, Share2 } from "lucide-react";
import type { GuessResult } from "@/hooks/use-game";
import type { Song } from "@/data/songs";
import { Vinyl } from "./vinyl";

interface Props {
  number: number;
  won: boolean;
  guesses: GuessResult[];
  maxAttempts: number;
  onClose: () => void;
  track?: Song | null;
}

export function ShareDailyModal({ number, won, guesses, maxAttempts, onClose, track }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const squares = Array.from({ length: maxAttempts }, (_, i) => {
    const g = guesses[i];
    if (!g) return "⬜";
    if (g.correct) return "🟢";
    if (g.skipped) return "⏭️";
    return "🟥";
  }).join("");

  const url = typeof window !== "undefined" ? `${window.location.origin}/daily` : "https://rapguesser.pl/daily";
  const attempts = guesses.length;
  const songLabel = track ? `${track.artist} — ${track.title}` : "dzisiejszy utwór";
  const headline = won
    ? `🎧 RAP GUESSER #${number} — zgadłem ${songLabel} w ${attempts} ${attemptsWord(attempts)}. Spróbujesz?`
    : `🎧 RAP GUESSER #${number} — nie zgadłem dziś (${songLabel}). A Ty?`;
  const text = `${headline}\n${squares}\n${url}`;

  const copyText = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500); } catch {}
  };
  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: `RAP GUESSER #${number}`, text: headline, url });
        return;
      } catch { /* anulowane */ }
    }
    copyText();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card border border-hairline rounded-3xl max-w-md w-full p-7 relative shadow-lift animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <Vinyl spinning={false} cover={(track as any)?.cover} size={128} />
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-ink-muted">Wynik daily · #{number}</p>
            <h2 className="font-display text-3xl mt-1.5 leading-tight">
              {won ? `Zgadłem w ${attempts} ${attemptsWord(attempts)}` : "Nie zgadłem dziś"}
            </h2>
            {track && (
              <p className="text-sm text-ink-muted mt-1">
                <span className="font-medium text-ink">{track.title}</span> · {track.artist}
              </p>
            )}
          </div>

          <div className="bg-muted/60 rounded-2xl px-5 py-4 font-mono text-2xl tracking-[0.25em] select-none">
            {squares}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={share}
            className="w-full h-12 rounded-full bg-ink text-paper font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[.98] transition"
          >
            <Share2 className="h-4 w-4" /> Udostępnij
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copyText}
              className="h-11 rounded-full border border-hairline text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition"
            >
              {copied ? <><Check className="h-4 w-4 text-success" /> Skopiowano</> : <><Copy className="h-4 w-4" /> Tekst</>}
            </button>
            <button
              onClick={copyLink}
              className="h-11 rounded-full border border-hairline text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition"
            >
              {linkCopied ? <><Check className="h-4 w-4 text-success" /> Skopiowano</> : <><Copy className="h-4 w-4" /> Link</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function attemptsWord(n: number): string {
  if (n === 1) return "próbie";
  // 2,3,4 → próbach (genitive plural in Polish; using locative singular form is fine for "w X próbach")
  return "próbach";
}
