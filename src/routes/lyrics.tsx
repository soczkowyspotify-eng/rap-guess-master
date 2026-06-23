import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { LyricsBoard } from "@/components/lyrics/lyrics-board";
import { Quote, Calendar, Infinity as Inf } from "lucide-react";
import { useState } from "react";
import { usePresence } from "@/hooks/use-presence";

export const Route = createFileRoute("/lyrics")({
  head: () => ({ meta: [
    { title: "Zgaduj po wersach — RAP GUESSER" },
    { name: "description", content: "Nowy tryb: pokazujemy fragment tekstu, ty zgadujesz utwór." },
  ] }),
  component: LyricsPage,
});

function LyricsPage() {
  const [variant, setVariant] = useState<"endless" | "daily">("endless");
  usePresence("lyrics");
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-primary mb-3">
            <Quote className="h-3.5 w-3.5" /> Nowy tryb
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">Zgaduj po wersach</h1>
          <p className="text-ink-muted mt-3 text-sm">Czytasz fragment tekstu, zgadujesz utwór. 4 próby — co próbę dorzucamy kolejny wers.</p>
        </header>

        <div className="inline-flex p-1 bg-card border border-hairline rounded-full mb-8 mx-auto block w-fit">
          <button onClick={() => setVariant("endless")} className={`px-4 h-9 rounded-full text-sm inline-flex items-center gap-2 ${variant === "endless" ? "bg-ink text-paper" : "text-ink-muted"}`}>
            <Inf className="h-3.5 w-3.5" /> Nieskończony
          </button>
          <button onClick={() => setVariant("daily")} className={`px-4 h-9 rounded-full text-sm inline-flex items-center gap-2 ${variant === "daily" ? "bg-ink text-paper" : "text-ink-muted"}`}>
            <Calendar className="h-3.5 w-3.5" /> Dzienny
          </button>
        </div>

        <LyricsBoard key={variant} variant={variant} />
      </main>
    </div>
  );
}