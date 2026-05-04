import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { GameBoard } from "@/components/game/game-board";
import { useGame } from "@/hooks/use-game";
import { Storage } from "@/lib/storage";
import { DIFFICULTY, type Difficulty } from "@/lib/game-data";
import { useI18n } from "@/i18n/i18n";

export const Route = createFileRoute("/endless")({
  head: () => ({ meta: [{ title: "Endless — RAP GUESSER" }, { name: "description", content: "Zgaduj bez końca. Buduj streak." }] }),
  component: EndlessPage,
});

function EndlessPage() {
  const { t } = useI18n();
  const [diff, setDiff] = useState<Difficulty>(() => Storage.getSettings().difficulty);
  const [seed, setSeed] = useState(0);
  const game = useGame({ mode: "endless", difficulty: diff });
  const stats = Storage.getStats();
  const ended = game.status !== "playing";

  const changeDiff = (d: Difficulty) => {
    setDiff(d);
    const s = Storage.getSettings(); s.difficulty = d; Storage.saveSettings(s);
    setSeed(x => x + 1);
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-10" key={seed}>
        <div className="text-center mb-8 space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">{t("endless.tag")}</p>
          <h1 className="font-display text-4xl md:text-5xl">{t("endless.streak")}: {stats.endlessCurrent} <span className="text-ink-muted">· {t("endless.best")} {stats.endlessBest}</span></h1>
          <div className="inline-flex p-1 bg-muted rounded-full">
            {(Object.keys(DIFFICULTY) as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => changeDiff(d)}
                className={`px-4 h-8 text-xs uppercase tracking-wider rounded-full transition ${
                  diff === d ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                }`}
              >
                {DIFFICULTY[d].label}
              </button>
            ))}
          </div>
        </div>
        <GameBoard game={game} />
        {ended && (
          <div className="mt-10 flex justify-center">
            <button onClick={game.next} className="px-6 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
              {t("endless.next")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
