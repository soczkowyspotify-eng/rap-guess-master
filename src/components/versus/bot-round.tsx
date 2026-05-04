import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { allSongs, DIFFICULTY, sameSong } from "@/lib/game-data";
import type { Song } from "@/data/songs";
import { Vinyl } from "@/components/game/vinyl";
import { Waveform } from "@/components/game/waveform";
import { DurationStepper } from "@/components/game/duration-stepper";
import { GuessSearch } from "@/components/game/guess-search";
import { GuessList } from "@/components/game/guess-list";
import { useAudioPlayer } from "@/components/game/audio-player";
import { ScoreBar } from "./score-bar";
import { RoundTimer } from "./round-timer";
import { planBotRound, type BotDifficulty, BOT_PROFILES } from "@/lib/versus-bot";
import { cn } from "@/lib/utils";

const BLITZ_CONF = { attempts: 5, durations: [1, 2, 4, 7, 10] as number[] };
const BLITZ_TIMER_SEC = 10;

type LocalGuess = { trackId: string; correct: boolean; skipped?: boolean };

interface RoundResult {
  attemptsUsed: number;
  correct: boolean;
}

interface Props {
  difficulty: BotDifficulty;
  myNick: string;
  totalRounds: number;
  variant?: "classic" | "blitz";
  /** Wywoływane gdy mecz się kończy: zwraca finalny wynik */
  onMatchEnd: (myScore: number, botScore: number, myRoundsWon: number, botRoundsWon: number) => void;
}

export function VersusBotMatch({ difficulty, myNick, totalRounds, variant = "classic", onMatchEnd }: Props) {
  const isBlitz = variant === "blitz";
  const conf = isBlitz ? BLITZ_CONF : DIFFICULTY.normal;
  const effectiveTotal = isBlitz ? 5 : totalRounds;
  const pool = useMemo(() => allSongs(), []);

  // Wybieramy tracki na cały mecz na starcie
  const tracks = useMemo<Song[]>(() => {
    const out: Song[] = [];
    const used = new Set<string>();
    let guard = 0;
    while (out.length < effectiveTotal && guard < effectiveTotal * 50) {
      const s = pool[Math.floor(Math.random() * pool.length)];
      if (!used.has(s.id)) { out.push(s); used.add(s.id); }
      guard++;
    }
    return out;
  }, [pool, effectiveTotal]);

  const bot = BOT_PROFILES[difficulty];
  const [round, setRound] = useState(1);
  const [myScore, setMyScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [myRoundsWon, setMyRoundsWon] = useState(0);
  const [botRoundsWon, setBotRoundsWon] = useState(0);
  const [matchOver, setMatchOver] = useState(false);

  const track = tracks[round - 1] ?? null;

  const [attemptIdx, setAttemptIdx] = useState(0);
  const [guesses, setGuesses] = useState<LocalGuess[]>([]);
  const [myResult, setMyResult] = useState<RoundResult | null>(null);
  const [botResult, setBotResult] = useState<RoundResult | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const botPlanRef = useRef<ReturnType<typeof planBotRound> | null>(null);
  const botTimeoutRef = useRef<number | null>(null);

  // Reset stanu przy zmianie rundy + zaplanuj bota
  useEffect(() => {
    if (matchOver) return;
    setAttemptIdx(0);
    setGuesses([]);
    setMyResult(null);
    setBotResult(null);
    setTimerStartedAt(null);
    const plan = planBotRound(conf.attempts, difficulty);
    botPlanRef.current = plan;
    if (botTimeoutRef.current) window.clearTimeout(botTimeoutRef.current);
    const botDelay = isBlitz ? Math.min(plan.thinkMs, BLITZ_TIMER_SEC * 1000 - 500) : plan.thinkMs;
    botTimeoutRef.current = window.setTimeout(() => {
      setBotResult({ attemptsUsed: plan.attemptsUsed, correct: plan.correct });
    }, botDelay);
    return () => {
      if (botTimeoutRef.current) window.clearTimeout(botTimeoutRef.current);
    };
  }, [round, difficulty, conf.attempts, matchOver, isBlitz]);

  // Po obu wynikach — rozstrzygnij rundę i (po 3.5s) przejdź dalej
  useEffect(() => {
    if (!myResult || !botResult || matchOver) return;
    let mPts = 0, bPts = 0;
    if (myResult.correct && botResult.correct) {
      if (myResult.attemptsUsed < botResult.attemptsUsed) mPts = 1;
      else if (botResult.attemptsUsed < myResult.attemptsUsed) bPts = 1;
      else { mPts = 0.5; bPts = 0.5; }
    } else if (myResult.correct) mPts = 1;
    else if (botResult.correct) bPts = 1;
    else { mPts = 0.5; bPts = 0.5; }

    const newMy = myScore + mPts;
    const newBot = botScore + bPts;
    const newMyRW = myRoundsWon + (mPts === 1 ? 1 : 0);
    const newBotRW = botRoundsWon + (bPts === 1 ? 1 : 0);

    setMyScore(newMy);
    setBotScore(newBot);
    setMyRoundsWon(newMyRW);
    setBotRoundsWon(newBotRW);

    const t = window.setTimeout(() => {
      let isOver = false;
      if (isBlitz) {
        isOver = round >= 5;
      } else {
        const REGULAR = 5;
        if (round < REGULAR) {
          isOver = newMy >= 3 || newBot >= 3;
        } else {
          if (newMy !== newBot) isOver = true;
          else if (round >= totalRounds) isOver = true;
        }
      }
      if (isOver) {
        setMatchOver(true);
        onMatchEnd(newMy, newBot, newMyRW, newBotRW);
      } else {
        setRound((r) => r + 1);
      }
    }, 3500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myResult, botResult]);

  const finishedThisRound = !!myResult;

  const onExpire = () => {
    if (!myResult) setMyResult({ attemptsUsed: conf.attempts, correct: false });
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <ScoreBar
        hostNick={myNick}
        guestNick={`${bot.emoji} ${bot.name}`}
        hostScore={myScore}
        guestScore={botScore}
        youAreHost={true}
        currentRound={Math.min(round, effectiveTotal)}
        variant={variant}
        timer={isBlitz && !finishedThisRound ? (
          <RoundTimer startedAt={timerStartedAt} totalSec={BLITZ_TIMER_SEC} onExpire={onExpire} />
        ) : undefined}
      />

      <div className="text-center text-xs font-mono text-ink-muted">
        Bot: {botResult ? `gotowe (${botResult.attemptsUsed}/${conf.attempts}${botResult.correct ? " ✓" : " ✗"})` : "myśli…"}
      </div>

      {finishedThisRound ? (
        <FinishedView my={myResult} bot={botResult} maxAttempts={conf.attempts} track={track} />
      ) : track ? (
        <PlayArea
          track={track}
          pool={pool}
          conf={conf}
          attemptIdx={attemptIdx}
          guesses={guesses}
          onPlayed={() => setTimerStartedAt((t) => t ?? Date.now())}
          onGuess={(song) => {
            if (sameSong(song, track)) {
              setGuesses((g) => [...g, { trackId: track.id, correct: true }]);
              setMyResult({ attemptsUsed: attemptIdx + 1, correct: true });
            } else {
              setGuesses((g) => [...g, { trackId: song.id, correct: false }]);
              if (attemptIdx + 1 >= conf.attempts) {
                setMyResult({ attemptsUsed: conf.attempts, correct: false });
              } else setAttemptIdx((i) => i + 1);
            }
          }}
          onSkip={() => {
            setGuesses((g) => [...g, { trackId: track.id, correct: false, skipped: true }]);
            if (attemptIdx + 1 >= conf.attempts) {
              setMyResult({ attemptsUsed: conf.attempts, correct: false });
            } else setAttemptIdx((i) => i + 1);
          }}
        />
      ) : (
        <div className="text-center text-sm text-ink-muted py-10">Ładowanie utworu…</div>
      )}
    </div>
  );
}

function PlayArea({
  track, pool, conf, attemptIdx, guesses, onGuess, onSkip, onPlayed,
}: {
  track: Song;
  pool: Song[];
  conf: { durations: number[]; attempts: number };
  attemptIdx: number;
  guesses: LocalGuess[];
  onGuess: (s: Song) => void;
  onSkip: () => void;
  onPlayed?: () => void;
}) {
  const duration = conf.durations[Math.min(attemptIdx, conf.durations.length - 1)];
  const player = useAudioPlayer({ song: track, durationSec: duration, startSec: track.startSec ?? 0 });
  const playing = player.playing;

  return (
    <div className="flex flex-col items-center gap-6">
      <Vinyl spinning={playing} />
      <div className="w-full space-y-4">
        <DurationStepper durations={conf.durations} currentIdx={attemptIdx} guesses={guesses} />
        <Waveform progress={player.progress} playing={playing} />
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              if (playing) player.stop();
              else { player.play(); onPlayed?.(); }
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center bg-ink text-paper hover:scale-105 active:scale-95 shadow-lift",
            )}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>
        </div>
        <p className="text-center text-xs font-mono text-ink-muted">
          Próba {attemptIdx + 1} / {conf.attempts} · {duration}s sample
        </p>
      </div>
      <GuessSearch pool={pool} onSubmit={onGuess} onSkip={onSkip} />
      <GuessList guesses={guesses} pool={pool} />
    </div>
  );
}

function FinishedView({
  my, bot, maxAttempts, track,
}: {
  my: RoundResult;
  bot: RoundResult | null;
  maxAttempts: number;
  track: Song | null;
}) {
  if (!bot) {
    return (
      <div className="text-center space-y-3 py-10 border-y border-hairline">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-muted">Bot jeszcze myśli…</div>
        <p className="text-sm text-ink-muted">
          Twój wynik: {my.attemptsUsed}/{maxAttempts} {my.correct ? "✓" : "✗"}
        </p>
      </div>
    );
  }
  let outcome: "win" | "lose" | "draw" = "draw";
  if (my.correct && !bot.correct) outcome = "win";
  else if (!my.correct && bot.correct) outcome = "lose";
  else if (my.correct && bot.correct) {
    outcome = my.attemptsUsed < bot.attemptsUsed ? "win" : my.attemptsUsed > bot.attemptsUsed ? "lose" : "draw";
  }
  return (
    <div className="text-center space-y-3 py-8 border-y border-hairline animate-fade-in-up">
      <div className={cn(
        "text-xs uppercase tracking-[0.2em]",
        outcome === "win" ? "text-success" : outcome === "lose" ? "text-primary" : "text-ink-muted",
      )}>
        {outcome === "win" ? "Wygrałeś rundę" : outcome === "lose" ? "Przegrałeś rundę" : "Remis"}
      </div>
      <div className="font-mono text-sm">
        Ty: {my.attemptsUsed}/{maxAttempts} {my.correct ? "✓" : "✗"} · Bot: {bot.attemptsUsed}/{maxAttempts} {bot.correct ? "✓" : "✗"}
      </div>
      {track && (
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted mt-2">Track</div>
          <div className="font-display text-xl">{track.title}</div>
          <div className="text-sm text-ink-muted">{track.artist}{track.year ? ` · ${track.year}` : ""}</div>
        </div>
      )}
      <p className="text-xs text-ink-muted pt-2">Następna runda za chwilę…</p>
    </div>
  );
}
