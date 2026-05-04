import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { GameBoard } from "@/components/game/game-board";
import { useGame } from "@/hooks/use-game";
import { dailyKey, dailyNumber } from "@/lib/game-data";
import { Storage } from "@/lib/storage";
import { ShareDailyModal } from "@/components/game/share-daily-modal";
import { useI18n } from "@/i18n/i18n";

export const Route = createFileRoute("/daily")({
  head: () => ({ meta: [{ title: "Daily — RAP GUESSER" }, { name: "description", content: "Codzienne wyzwanie. Jeden track dla wszystkich." }] }),
  component: DailyPage,
});

function DailyPage() {
  const { t } = useI18n();
  const game = useGame({ mode: "daily" });
  const [shareOpen, setShareOpen] = useState(false);
  const today = Storage.getDailyToday(dailyKey());
  const ended = game.status !== "playing";

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">{t("daily.tag")} #{dailyNumber()}</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">{dailyKey()}</h1>
        </div>

        {today && !game.track ? (
          <div className="text-center py-12">
            <p className="text-ink-muted">{t("daily.played")}</p>
          </div>
        ) : (
          <GameBoard game={game} />
        )}

        {ended && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={() => setShareOpen(true)}
              className="px-6 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90"
            >
              {t("daily.share")}
            </button>
            <Link to="/endless" className="text-sm text-ink-muted hover:text-ink underline underline-offset-4">
              {t("daily.toEndless")}
            </Link>
          </div>
        )}
      </main>
      {ended && shareOpen && game.track && (
        <ShareDailyModal
          onClose={() => setShareOpen(false)}
          number={dailyNumber()}
          won={game.status === "won"}
          guesses={game.guesses}
          maxAttempts={game.maxAttempts}
        />
      )}
    </div>
  );
}
