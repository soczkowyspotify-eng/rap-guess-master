import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Pause } from "lucide-react";
import { toast } from "sonner";
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
import { getRoundTrack, submitRoundResult } from "@/server/versus.functions";
import type { VersusMatch, VersusRoundResult } from "@/hooks/use-versus";
import { cn } from "@/lib/utils";

const BLITZ_CONF = { attempts: 5, durations: [1, 2, 4, 7, 10] as number[] };
const BLITZ_TIMER_SEC = 10;

interface Props {
  match: VersusMatch;
  results: VersusRoundResult[];
  playerId: string;
}

type LocalGuess = { trackId: string; correct: boolean; skipped?: boolean };

export function VersusRound({ match, results, playerId }: Props) {
  const isHost = match.host_player_id === playerId;
  const oppId = isHost ? match.guest_player_id : match.host_player_id;

  const isBlitz = match.mode === "blitz";
  const conf = isBlitz ? BLITZ_CONF : DIFFICULTY.normal;
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackErr, setTrackErr] = useState<string | null>(null);
  const [attemptIdx, setAttemptIdx] = useState(0);
  const [guesses, setGuesses] = useState<LocalGuess[]>([]);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);

  const getRoundTrackFn = useServerFn(getRoundTrack);
  const submitFn = useServerFn(submitRoundResult);

  const pool = useMemo(() => allSongs(), []);
  const track: Song | null = useMemo(() => pool.find((s) => s.id === trackId) ?? null, [pool, trackId]);

  // Reset stanu przy zmianie rundy
  useEffect(() => {
    setTrackId(null);
    setAttemptIdx(0);
    setGuesses([]);
    setFinished(false);
    setSubmitted(false);
    setTrackErr(null);
    setTimerStartedAt(null);
    let cancelled = false;
    getRoundTrackFn({ data: { matchId: match.id, playerId, roundIdx: match.current_round } })
      .then((res) => { if (!cancelled) setTrackId(res.trackId); })
      .catch((e) => { if (!cancelled) setTrackErr(e?.message ?? "Błąd"); });
    return () => { cancelled = true; };
  }, [match.id, match.current_round, playerId, getRoundTrackFn]);

  const myResult = results.find((r) => r.player_id === playerId && r.round_idx === match.current_round);
  const oppResult = results.find((r) => r.player_id === oppId && r.round_idx === match.current_round);

  // Zapis wyniku po zakończeniu lokalnym
  useEffect(() => {
    if (!finished || submitted || !track) return;
    setSubmitted(true);
    const correct = guesses.some((g) => g.correct);
    const attemptsUsed = correct ? attemptIdx : conf.attempts;
    submitFn({
      data: {
        matchId: match.id,
        playerId,
        roundIdx: match.current_round,
        attemptsUsed,
        correct,
      },
    }).catch((e) => {
      toast.error(e?.message ?? "Nie udało się zapisać wyniku");
      setSubmitted(false);
    });
  }, [finished, submitted, track, guesses, attemptIdx, conf.attempts, match.id, match.current_round, playerId, submitFn]);

  if (trackErr) {
    return <div className="text-center text-sm text-primary py-10">{trackErr}</div>;
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <ScoreBar
        hostNick={match.host_nick}
        guestNick={match.guest_nick}
        hostScore={match.host_score}
        guestScore={match.guest_score}
        youAreHost={isHost}
        currentRound={match.current_round}
        variant={isBlitz ? "blitz" : "classic"}
      />

      <div className="text-center text-xs font-mono text-ink-muted">
        Przeciwnik: {oppResult ? `gotowe (${oppResult.attempts_used}/${conf.attempts}${oppResult.correct ? " ✓" : " ✗"})` : "jeszcze gra…"}
      </div>

      {finished ? (
        <FinishedView myResult={myResult} oppResult={oppResult} maxAttempts={conf.attempts} track={track} />
      ) : track ? (
        <PlayArea
          track={track}
          pool={pool}
          conf={conf}
          attemptIdx={attemptIdx}
          guesses={guesses}
          onPlayed={() => setTimerStartedAt((t) => t ?? Date.now())}
          timer={isBlitz ? (
            <RoundTimer
              startedAt={timerStartedAt}
              totalSec={BLITZ_TIMER_SEC}
              onExpire={() => setFinished(true)}
            />
          ) : null}
          onGuess={(song) => {
            if (sameSong(song, track)) {
              setGuesses((g) => [...g, { trackId: track.id, correct: true }]);
              setFinished(true);
            } else {
              setGuesses((g) => [...g, { trackId: song.id, correct: false }]);
              if (attemptIdx + 1 >= conf.attempts) setFinished(true);
              else setAttemptIdx((i) => i + 1);
            }
          }}
          onSkip={() => {
            setGuesses((g) => [...g, { trackId: track.id, correct: false, skipped: true }]);
            if (attemptIdx + 1 >= conf.attempts) setFinished(true);
            else setAttemptIdx((i) => i + 1);
          }}
        />
      ) : (
        <div className="text-center text-sm text-ink-muted py-10">Ładowanie utworu…</div>
      )}
    </div>
  );
}

function PlayArea({
  track, pool, conf, attemptIdx, guesses, onGuess, onSkip, onPlayed, timer,
}: {
  track: Song;
  pool: Song[];
  conf: { durations: number[]; attempts: number };
  attemptIdx: number;
  guesses: LocalGuess[];
  onGuess: (s: Song) => void;
  onSkip: () => void;
  onPlayed?: () => void;
  timer?: React.ReactNode;
}) {
  const duration = conf.durations[Math.min(attemptIdx, conf.durations.length - 1)];
  const player = useAudioPlayer({ song: track, durationSec: duration, startSec: track.startSec ?? 0 });
  const playing = player.playing;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Vinyl spinning={playing} />
        {timer && (
          <div className="absolute -top-2 -right-2 sm:-right-6 bg-card border border-hairline rounded-full p-1 shadow-lift z-10">
            {timer}
          </div>
        )}
      </div>
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
  myResult, oppResult, maxAttempts, track,
}: {
  myResult?: VersusRoundResult;
  oppResult?: VersusRoundResult;
  maxAttempts: number;
  track: Song | null;
}) {
  if (!oppResult) {
    return (
      <div className="text-center space-y-3 py-10 border-y border-hairline">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-muted">Czekamy na przeciwnika…</div>
        {myResult && (
          <p className="text-sm text-ink-muted">
            Twój wynik: {myResult.attempts_used}/{maxAttempts} {myResult.correct ? "✓" : "✗"}
          </p>
        )}
      </div>
    );
  }
  if (!myResult) return null;

  let outcome: "win" | "lose" | "draw" = "draw";
  if (myResult.correct && !oppResult.correct) outcome = "win";
  else if (!myResult.correct && oppResult.correct) outcome = "lose";
  else if (myResult.correct && oppResult.correct) {
    outcome = myResult.attempts_used < oppResult.attempts_used ? "win" : myResult.attempts_used > oppResult.attempts_used ? "lose" : "draw";
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
        Ty: {myResult.attempts_used}/{maxAttempts} {myResult.correct ? "✓" : "✗"} · Przeciwnik: {oppResult.attempts_used}/{maxAttempts} {oppResult.correct ? "✓" : "✗"}
      </div>
      {track && (
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted mt-2">Track</div>
          <div className="font-display text-xl">{track.title}</div>
          <div className="text-sm text-ink-muted">{track.artist}{track.year ? ` · ${track.year}` : ""}</div>
        </div>
      )}
      <p className="text-xs text-ink-muted pt-2">Następna runda startuje automatycznie…</p>
    </div>
  );
}