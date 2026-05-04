import { useEffect, useRef, useState } from "react";
import { X, Copy, Check, Share2, Download, Link2 } from "lucide-react";
import { toPng } from "html-to-image";
import type { GuessResult } from "@/hooks/use-game";
import type { Song } from "@/data/songs";

interface Props {
  number: number;
  won: boolean;
  guesses: GuessResult[];
  maxAttempts: number;
  onClose: () => void;
  track?: Song | null;
  /** Tryb "tylko podgląd" — np. gdy ktoś wszedł z linku /share */
  readOnly?: boolean;
}

export function ShareDailyModal({ number, won, guesses, maxAttempts, onClose, track, readOnly = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const squares = Array.from({ length: maxAttempts }, (_, i) => {
    const g = guesses[i];
    if (!g) return "⬜";
    if (g.correct) return "🟢";
    if (g.skipped) return "⏭️";
    return "🟥";
  }).join("");

  const attempts = guesses.length;
  const squaresPlain = Array.from({ length: maxAttempts }, (_, i) => {
    const g = guesses[i];
    if (!g) return "";
    if (g.correct) return "🟢";
    if (g.skipped) return "⏭";
    return "🟥";
  }).join("");
  // Link, który po otwarciu pokaże TEN SAM popup u znajomego (z OG preview na messengerach)
  const origin = typeof window !== "undefined" ? window.location.origin : "https://rapguesser.pl";
  const params = new URLSearchParams({
    n: String(number),
    w: won ? "1" : "0",
    g: String(attempts),
    m: String(maxAttempts),
    s: squaresPlain,
  });
  if (track) { params.set("t", track.title); params.set("a", track.artist); }
  const url = `${origin}/share?${params.toString()}`;
  const songLabel = track ? `${track.artist} — ${track.title}` : "dzisiejszy utwór";
  const headline = won
    ? `🎧 RAP GUESSER #${number} — zgadłem ${songLabel} w ${attempts} ${attemptsWord(attempts)}. Spróbujesz?`
    : `🎧 RAP GUESSER #${number} — nie zgadłem dziś (${songLabel}). A Ty?`;
  const text = `${headline}\n${squares}\n${url}`;

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "transparent" });
      const a = document.createElement("a");
      a.download = `rap-guesser-${number}.png`;
      a.href = dataUrl;
      a.click();
    } catch {} finally { setDownloading(false); }
  };

  const copyText = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500); } catch {}
  };
  const share = async () => {
    // Spróbuj udostępnić jako grafikę (Web Share API z plikami)
    try {
      if (cardRef.current && typeof navigator !== "undefined" && (navigator as any).canShare) {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `rap-guesser-${number}.png`, { type: "image/png" });
        if ((navigator as any).canShare({ files: [file] })) {
          await (navigator as any).share({ files: [file], title: `RAP GUESSER #${number}`, text: headline, url });
          return;
        }
      }
      if ((navigator as any).share) {
        await (navigator as any).share({ title: `RAP GUESSER #${number}`, text: headline, url });
        return;
      }
    } catch { /* anulowane */ }
    copyText();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-ink/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto" onClick={readOnly ? undefined : onClose}>
      <div className="relative max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
        {!readOnly && (
          <button onClick={onClose} className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-card border border-hairline flex items-center justify-center text-ink-muted hover:text-ink shadow-lift transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Karta do udostępnienia — eksportowana jako PNG */}
        <div
          ref={cardRef}
          className="rounded-3xl overflow-hidden shadow-lift relative"
          style={{
            background: "linear-gradient(140deg, color-mix(in oklab, var(--primary) 22%, var(--card)) 0%, var(--card) 55%, color-mix(in oklab, var(--ink) 8%, var(--card)) 100%)",
          }}
        >
          {/* dekoracyjne winylowe pierścienie w tle */}
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-[0.07] pointer-events-none"
               style={{ background: "repeating-radial-gradient(circle, var(--ink) 0 1px, transparent 1px 8px)" }} />

          <div className="relative p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ink text-paper grid place-items-center font-display text-sm">R</div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted leading-none">Rap Guesser</div>
                  <div className="text-xs font-mono text-ink leading-tight">Daily #{number}</div>
                </div>
              </div>
              <div className={`text-[10px] font-mono uppercase tracking-[0.25em] px-2.5 py-1 rounded-full ${won ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
                {won ? "Zgadnięte" : "Pudło"}
              </div>
            </div>

            <div className="text-center pt-2">
              <h2 className="font-display text-3xl leading-tight">
                {won ? <>Zgadłem w <span className="text-primary">{attempts}</span> {attemptsWord(attempts)}</> : "Nie zgadłem dziś"}
              </h2>
              {track && (
                <p className="mt-2 text-sm">
                  <span className="font-display text-base text-ink">{track.title}</span>
                  <span className="text-ink-muted"> · {track.artist}</span>
                </p>
              )}
            </div>

            <div className="flex justify-center gap-1.5 py-1">
              {Array.from({ length: maxAttempts }, (_, i) => {
                const g = guesses[i];
                const cls = !g ? "bg-muted border-hairline"
                  : g.correct ? "bg-success border-success"
                  : g.skipped ? "bg-ink-muted/30 border-ink-muted/40"
                  : "bg-primary border-primary";
                return <div key={i} className={`w-7 h-7 rounded-md border ${cls}`} />;
              })}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-hairline/60">
              <p className="text-[11px] font-mono text-ink-muted">Spróbujesz?</p>
              <p className="text-[11px] font-mono text-ink">rapguesser.pl</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 bg-card border border-hairline rounded-2xl p-3 shadow-lift">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={share}
              className="h-11 rounded-full bg-ink text-paper text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 active:scale-[.98] transition"
            >
              <Share2 className="h-4 w-4" /> Udostępnij
            </button>
            <button
              onClick={downloadImage}
              disabled={downloading}
              className="h-11 rounded-full border border-hairline text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted transition disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {downloading ? "Generuję…" : "Pobierz PNG"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copyText}
              className="h-10 rounded-full border border-hairline text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition"
            >
              {copied ? <><Check className="h-3.5 w-3.5 text-success" /> Skopiowano</> : <><Copy className="h-3.5 w-3.5" /> Kopiuj tekst</>}
            </button>
            <button
              onClick={copyLink}
              className="h-10 rounded-full border border-hairline text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition"
            >
              {linkCopied ? <><Check className="h-3.5 w-3.5 text-success" /> Skopiowano</> : <><Link2 className="h-3.5 w-3.5" /> Kopiuj link</>}
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
