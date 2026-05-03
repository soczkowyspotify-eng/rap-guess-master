import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Storage } from "@/lib/storage";
import { DIFFICULTY, type Difficulty } from "@/lib/game-data";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ustawienia — RAP GUESSER" }, { name: "description", content: "Trudność, motyw, reset postępu." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [diff, setDiff] = useState<Difficulty>(() => Storage.getSettings().difficulty);

  const change = (d: Difficulty) => {
    setDiff(d);
    const s = Storage.getSettings(); s.difficulty = d; Storage.saveSettings(s);
  };

  const reset = () => {
    if (!confirm("Skasować cały postęp? Tej akcji nie można cofnąć.")) return;
    Storage.resetAll();
    toast.success("Postęp skasowany");
    setTimeout(() => location.reload(), 500);
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        <header>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Ustawienia</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Konfiguracja</h1>
        </header>

        <section>
          <h2 className="font-display text-xl mb-4">Trudność (Endless · Album)</h2>
          <p className="text-sm text-ink-muted mb-4">Daily zawsze gra na Normal — żeby wynik był uczciwy dla wszystkich.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(DIFFICULTY) as Difficulty[]).map(d => {
              const conf = DIFFICULTY[d];
              const active = diff === d;
              return (
                <button
                  key={d}
                  onClick={() => change(d)}
                  className={`text-left p-5 rounded-2xl border transition ${active ? "border-ink bg-card shadow-soft" : "border-hairline hover:border-ink/40"}`}
                >
                  <div className="font-display text-xl">{conf.label}</div>
                  <div className="text-xs font-mono text-ink-muted mt-2">{conf.attempts} prób</div>
                  <div className="text-xs font-mono text-ink-muted">start {conf.durations[0]}s</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-t border-hairline pt-8">
          <h2 className="font-display text-xl mb-3 text-primary">Strefa zagrożenia</h2>
          <p className="text-sm text-ink-muted mb-4">Skasuje wszystkie statystyki, daily, postęp albumów i osiągnięcia.</p>
          <button onClick={reset} className="px-5 h-10 rounded-full border border-primary text-primary text-sm hover:bg-primary hover:text-paper transition">
            Reset całego postępu
          </button>
        </section>
      </main>
    </div>
  );
}
