import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ShareDailyModal } from "@/components/game/share-daily-modal";
import { AppHeader } from "@/components/app-header";
import type { GuessResult } from "@/hooks/use-game";

const searchSchema = z.object({
  n: z.coerce.number().int().nonnegative().default(0),
  w: z.coerce.number().int().min(0).max(1).default(0),
  g: z.coerce.number().int().min(0).max(10).default(0),
  m: z.coerce.number().int().min(1).max(10).default(6),
  t: z.string().optional(),
  a: z.string().optional(),
  s: z.string().optional(),
});

export const Route = createFileRoute("/share")({
  validateSearch: (raw) => searchSchema.parse(raw),
  head: ({ match }) => {
    const s = (match.search ?? {}) as z.infer<typeof searchSchema>;
    const won = s.w === 1;
    const songLabel = s.t && s.a ? `${s.a} — ${s.t}` : "dzisiejszy utwór";
    const title = won
      ? `🎧 RAP GUESSER #${s.n} — zgadłem ${songLabel} w ${s.g} ${attemptsWord(s.g)}`
      : `🎧 RAP GUESSER #${s.n} — pudło: ${songLabel}`;
    const desc = won
      ? `Zgadnięte w ${s.g}/${s.m}. Spróbujesz lepiej?`
      : `Nie zgadłem dziś. A Ty dasz radę?`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
  component: SharePage,
});

function SharePage() {
  const s = Route.useSearch();
  const won = s.w === 1;
  const maxAttempts = s.m;

  // Zrekonstruuj guesses z patternu (np. "🟥🟥🟢")
  const guesses: GuessResult[] = squaresToGuesses(s.s ?? "", s.g, won);

  const track = s.t && s.a ? { id: "share", title: s.t, artist: s.a, type: "url" as const, src: "" } : null;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-10 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Wynik znajomego</p>
        <h1 className="font-display text-3xl md:text-4xl mt-2">RAP GUESSER #{s.n}</h1>
        <p className="mt-3 text-ink-muted">Zobacz wynik i spróbuj swoich sił w dzisiejszym wyzwaniu.</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link to="/daily" className="px-6 h-11 inline-flex items-center justify-center rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
            Zagraj Daily
          </Link>
          <Link to="/" className="text-sm text-ink-muted hover:text-ink underline underline-offset-4">Strona główna</Link>
        </div>
      </main>
      <ShareDailyModal
        number={s.n}
        won={won}
        guesses={guesses}
        maxAttempts={maxAttempts}
        track={track as any}
        readOnly
        onClose={() => { /* nie pozwalamy zamknąć — to jest cel wejścia */ }}
      />
    </div>
  );
}

function squaresToGuesses(s: string, used: number, won: boolean): GuessResult[] {
  // Rozbij na "graphemes" (emoji = 1 znak logiczny)
  const arr = Array.from(s);
  const out: GuessResult[] = [];
  for (const ch of arr) {
    if (ch === "🟢") out.push({ trackId: "x", correct: true });
    else if (ch === "⏭️" || ch === "⏭") out.push({ trackId: "x", correct: false, skipped: true });
    else if (ch === "🟥") out.push({ trackId: "x", correct: false });
  }
  if (out.length === 0 && used > 0) {
    for (let i = 0; i < used - 1; i++) out.push({ trackId: "x", correct: false });
    out.push({ trackId: "x", correct: won });
  }
  return out;
}

function attemptsWord(n: number): string {
  return n === 1 ? "próbie" : "próbach";
}