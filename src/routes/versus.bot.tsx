import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Trophy, RotateCcw, Home, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { NickInput } from "@/components/versus/nick-input";
import { VersusBotMatch } from "@/components/versus/bot-round";
import { VersusLocal } from "@/lib/storage";
import { BOT_PROFILES, type BotDifficulty } from "@/lib/versus-bot";
import { recordVersusMatch } from "@/lib/versus-stats";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/versus/bot")({
  head: () => ({
    meta: [
      { title: "Versus vs Bot — RAP GUESSER" },
      { name: "description", content: "Zagraj Versus 1v1 przeciwko botowi. Trzy poziomy trudności." },
    ],
  }),
  component: VersusBotPage,
});

interface FinalResult {
  myScore: number;
  botScore: number;
  myRoundsWon: number;
  botRoundsWon: number;
  unlocked: string[];
  difficulty: BotDifficulty;
}

function VersusBotPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"lobby" | "playing" | "result">("lobby");
  const [nick, setNick] = useState("");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("normal");
  const [result, setResult] = useState<FinalResult | null>(null);
  const [matchKey, setMatchKey] = useState(0);

  useEffect(() => {
    setNick(VersusLocal.getSuggestedNick() || "Ty");
  }, []);

  const start = () => {
    const v = nick.trim();
    if (!v) { toast.error("Wpisz nick"); return; }
    VersusLocal.saveSuggestedNick(v);
    setMatchKey((k) => k + 1);
    setPhase("playing");
  };

  const handleEnd = (myScore: number, botScore: number, myRW: number, botRW: number) => {
    const unlocked = recordVersusMatch({
      myScore, oppScore: botScore,
      myRoundsWon: myRW, oppRoundsWon: botRW,
      vsBot: difficulty,
    });
    setResult({ myScore, botScore, myRoundsWon: myRW, botRoundsWon: botRW, unlocked, difficulty });
    setPhase("result");
  };

  const playAgain = () => {
    setMatchKey((k) => k + 1);
    setResult(null);
    setPhase("playing");
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {phase === "lobby" && (
          <Lobby
            nick={nick}
            onNickChange={setNick}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onStart={start}
            onBack={() => navigate({ to: "/versus" })}
          />
        )}

        {phase === "playing" && (
          <VersusBotMatch
            key={matchKey}
            difficulty={difficulty}
            myNick={nick.trim() || "Ty"}
            totalRounds={5}
            onMatchEnd={handleEnd}
          />
        )}

        {phase === "result" && result && (
          <Result
            result={result}
            onPlayAgain={playAgain}
            onLobby={() => setPhase("lobby")}
            onHome={() => navigate({ to: "/versus" })}
          />
        )}
      </main>
    </div>
  );
}

function Lobby({
  nick, onNickChange, difficulty, onDifficultyChange, onStart, onBack,
}: {
  nick: string;
  onNickChange: (v: string) => void;
  difficulty: BotDifficulty;
  onDifficultyChange: (d: BotDifficulty) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <Bot className="h-12 w-12 mx-auto text-primary" />
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Versus · vs Bot</p>
        <h1 className="font-display text-4xl">Zagraj z botem</h1>
        <p className="text-sm text-ink-muted">Best of 5. Bot gra równolegle, wygrywa kto trafi z mniejszą liczbą prób.</p>
      </div>

      <div className="bg-card border border-hairline rounded-3xl p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Twój nick</label>
          <NickInput value={nick} onChange={onNickChange} />
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Wybierz przeciwnika</div>
          <div className="grid gap-2">
            {(["easy", "normal", "hard"] as BotDifficulty[]).map((d) => {
              const p = BOT_PROFILES[d];
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => onDifficultyChange(d)}
                  className={cn(
                    "text-left px-4 py-3 rounded-2xl border transition-all flex items-center gap-3",
                    active
                      ? "border-primary bg-primary/5 shadow-lift"
                      : "border-hairline bg-card hover:border-ink-muted",
                  )}
                >
                  <div className="text-2xl">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg leading-tight">{p.name}</div>
                    <div className="text-xs text-ink-muted truncate">{p.description}</div>
                  </div>
                  <div className={cn(
                    "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full",
                    d === "easy" && "bg-success/15 text-success",
                    d === "normal" && "bg-muted text-ink",
                    d === "hard" && "bg-primary/15 text-primary",
                  )}>{d}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={onStart} className="w-full rounded-full h-12 text-base">
          Rozpocznij mecz
        </Button>
        <button onClick={onBack} className="w-full text-xs font-mono text-ink-muted hover:text-ink underline-offset-4 hover:underline">
          ← wróć do trybu Versus
        </button>
      </div>
    </div>
  );
}

function Result({
  result, onPlayAgain, onLobby, onHome,
}: {
  result: FinalResult;
  onPlayAgain: () => void;
  onLobby: () => void;
  onHome: () => void;
}) {
  const outcome = result.myScore > result.botScore ? "win" : result.myScore < result.botScore ? "lose" : "draw";
  const bot = BOT_PROFILES[result.difficulty];
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => result.unlocked.includes(a.id));

  return (
    <div className="max-w-xl mx-auto text-center space-y-8 py-10">
      <Trophy className={`h-16 w-16 mx-auto ${outcome === "win" ? "text-success" : outcome === "lose" ? "text-primary" : "text-ink-muted"}`} />
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Koniec meczu · vs {bot.emoji} {bot.name}</p>
        <h1 className="font-display text-5xl mt-2">
          {outcome === "win" ? "Wygrana!" : outcome === "lose" ? "Porażka" : "Remis"}
        </h1>
      </div>
      <div className="flex justify-center gap-8 items-end">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Ty</div>
          <div className="font-display text-6xl">{result.myScore}</div>
        </div>
        <div className="font-display text-3xl text-ink-muted pb-2">:</div>
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Bot</div>
          <div className="font-display text-6xl">{result.botScore}</div>
        </div>
      </div>

      {unlockedAchievements.length > 0 && (
        <div className="bg-card border border-success/30 rounded-2xl p-5 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 text-success">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-[0.2em]">Nowe osiągnięcia</span>
          </div>
          <ul className="space-y-2">
            {unlockedAchievements.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="font-display text-base">{a.title}</div>
                <div className="text-xs text-ink-muted">{a.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Button onClick={onPlayAgain} className="rounded-full h-11">
          <RotateCcw className="h-4 w-4" /> Rewanż
        </Button>
        <Button variant="outline" onClick={onLobby} className="rounded-full h-11">
          Zmień bota
        </Button>
        <Button variant="outline" onClick={onHome} className="rounded-full h-11">
          <Home className="h-4 w-4" /> Versus
        </Button>
      </div>
    </div>
  );
}
