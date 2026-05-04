import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Storage } from "@/lib/storage";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { allSongs, dailyKey } from "@/lib/game-data";
import { Check, Lock, Swords } from "lucide-react";
import { useI18n } from "@/i18n/i18n";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Statystyki — RAP GUESSER" }, { name: "description", content: "Twoje statystyki, heatmapa daily i osiągnięcia." }] }),
  component: StatsPage,
});

function lastNDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

function StatsPage() {
  const { t } = useI18n();
  const stats = Storage.getStats();
  const history = Storage.getDailyHistory();
  const unlocked = new Set(Storage.getAchievements());
  const all = allSongs();
  const winRate = stats.totalPlayed ? Math.round((stats.totalGuessed / stats.totalPlayed) * 100) : 0;
  const avgAttempts = stats.totalGuessed ? (stats.totalAttempts / stats.totalGuessed).toFixed(1) : "—";
  const versus = Storage.getVersusStats();
  const versusWinRate = versus.matchesPlayed ? Math.round((versus.wins / versus.matchesPlayed) * 100) : 0;

  const days = lastNDays(91);
  const todayKey = dailyKey();

  const topMissed = Object.entries(stats.missedTracks)
    .map(([id, c]) => ({ song: all.find(s => s.id === id), count: c }))
    .filter(x => x.song)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const STATS = [
    { label: t("stats.winRate"), v: `${winRate}%` },
    { label: t("stats.endlessBest"), v: stats.endlessBest },
    { label: t("stats.guessed"), v: stats.totalGuessed },
    { label: t("stats.avgAttempts"), v: avgAttempts },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-16">
        <header>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">{t("stats.tag")}</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">{t("stats.title")}</h1>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-card border border-hairline rounded-2xl p-6">
              <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">{s.label}</div>
              <div className="font-display text-4xl mt-2">{s.v}</div>
            </div>
          ))}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5">
            <Swords className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl">Versus 1v1</h2>
            {versus.currentStreak >= 2 && (
              <span className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded-full bg-success/15 text-success">
                seria {versus.currentStreak}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VersusStat label="Mecze" value={versus.matchesPlayed} />
            <VersusStat label="Wygrane" value={versus.wins} accent="success" />
            <VersusStat label="Win rate" value={`${versusWinRate}%`} />
            <VersusStat label="Najlepsza seria" value={versus.bestStreak} />
            <VersusStat label="Porażki" value={versus.losses} />
            <VersusStat label="Remisy" value={versus.draws} />
            <VersusStat label="Wygrane vs Bot" value={versus.vsBotWins} />
            <VersusStat label="Bot Hard" value={versus.vsBotHardWins} accent="primary" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-5">{t("stats.heatmap")}</h2>
          <div className="grid grid-cols-13 gap-1.5" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
            {days.map(k => {
              const e = history.find(h => h.key === k);
              const cls = !e
                ? "bg-hairline"
                : e.won ? "bg-success" : "bg-primary/70";
              const today = k === todayKey ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "";
              return <div key={k} title={k} className={`aspect-square rounded ${cls} ${today}`} />;
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs font-mono text-ink-muted">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-hairline" /> {t("stats.legend.none")}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-success" /> {t("stats.legend.won")}</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary/70" /> {t("stats.legend.lost")}</div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl mb-5">{t("stats.missed")}</h2>
            {topMissed.length === 0 ? (
              <p className="text-ink-muted text-sm">{t("stats.missed.empty")}</p>
            ) : (
              <ul className="space-y-2">
                {topMissed.map((m, i) => (
                  <li key={m.song!.id} className="flex items-center gap-3 px-4 py-3 bg-card border border-hairline rounded-xl">
                    <span className="font-mono text-xs text-ink-muted w-5">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.song!.title}</div>
                      <div className="text-xs text-ink-muted truncate">{m.song!.artist}</div>
                    </div>
                    <span className="text-xs font-mono text-primary">×{m.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="font-display text-2xl mb-5">{t("stats.achievements")} <span className="text-base text-ink-muted">{unlocked.size}/{ACHIEVEMENTS.length}</span></h2>
            <ul className="space-y-2">
              {ACHIEVEMENTS.map(a => {
                const got = unlocked.has(a.id);
                return (
                  <li key={a.id} className={`flex items-center gap-3 px-4 py-3 border rounded-xl ${got ? "bg-card border-success/30" : "bg-muted/40 border-hairline opacity-60"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${got ? "bg-success/15 text-success" : "bg-muted text-ink-muted"}`}>
                      {got ? <Check className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{a.title}</div>
                      <div className="text-xs text-ink-muted">{a.description}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

function VersusStat({ label, value, accent }: { label: string; value: string | number; accent?: "success" | "primary" }) {
  const valueClass = accent === "success" ? "text-success" : accent === "primary" ? "text-primary" : "";
  return (
    <div className="bg-card border border-hairline rounded-2xl p-5">
      <div className="text-xs font-mono uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`font-display text-3xl mt-2 ${valueClass}`}>{value}</div>
    </div>
  );
}
