import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Storage } from "@/lib/storage";
import { DIFFICULTY, type Difficulty } from "@/lib/game-data";
import { toast } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, LANGS, type LangPref } from "@/i18n/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Ustawienia — RAP GUESSER" }, { name: "description", content: "Trudność, motyw, reset postępu." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [diff, setDiff] = useState<Difficulty>(() => Storage.getSettings().difficulty);
  const { theme, setTheme } = useTheme();
  const { t, pref, setPref } = useI18n();

  const change = (d: Difficulty) => {
    setDiff(d);
    const s = Storage.getSettings(); s.difficulty = d; Storage.saveSettings(s);
  };

  const reset = () => {
    if (!confirm(t("settings.danger.confirm"))) return;
    Storage.resetAll();
    toast.success(t("settings.danger.toast"));
    setTimeout(() => location.reload(), 500);
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10 sm:space-y-12">
        <header>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">{t("settings.tag")}</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mt-2">{t("settings.title")}</h1>
        </header>

        <section>
          <h2 className="font-display text-xl mb-4">{t("settings.theme")}</h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: "light", label: t("settings.theme.light"), icon: Sun },
              { id: "dark", label: t("settings.theme.dark"), icon: Moon },
              { id: "system", label: t("settings.theme.system"), icon: Monitor },
            ] as const).map(opt => {
              const active = theme === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border transition",
                    active ? "border-ink bg-card shadow-soft" : "border-hairline hover:border-ink/40",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-4">{t("settings.lang")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setPref("auto")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition",
                pref === "auto" ? "border-ink bg-card shadow-soft" : "border-hairline hover:border-ink/40",
              )}
            >
              <span className="text-2xl">🌐</span>
              <span className="text-sm">{t("settings.lang.auto")}</span>
            </button>
            {LANGS.map(l => {
              const active = pref === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setPref(l.code as LangPref)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border transition",
                    active ? "border-ink bg-card shadow-soft" : "border-hairline hover:border-ink/40",
                  )}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <span className="text-sm">{l.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-4">{t("settings.diff")}</h2>
          <p className="text-sm text-ink-muted mb-4">{t("settings.diff.note")}</p>
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
                  <div className="text-xs font-mono text-ink-muted mt-2">{conf.attempts} {t("settings.diff.attempts")}</div>
                  <div className="text-xs font-mono text-ink-muted">{t("settings.diff.start")} {conf.durations[0]}s</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border-t border-hairline pt-8">
          <h2 className="font-display text-xl mb-3 text-primary">{t("settings.danger")}</h2>
          <p className="text-sm text-ink-muted mb-4">{t("settings.danger.desc")}</p>
          <button onClick={reset} className="px-5 h-10 rounded-full border border-primary text-primary text-sm hover:bg-primary hover:text-paper transition">
            {t("settings.danger.cta")}
          </button>
        </section>
      </main>
    </div>
  );
}
