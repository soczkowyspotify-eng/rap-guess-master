import { Play, Pause } from "lucide-react";
import { useEffect, useState } from "react";
import { Vinyl } from "./vinyl";
import { Waveform } from "./waveform";
import { DurationStepper } from "./duration-stepper";
import { GuessSearch } from "./guess-search";
import { GuessList } from "./guess-list";
import { useAudioPlayer } from "./audio-player";
import type { useGame } from "@/hooks/use-game";
import { cn } from "@/lib/utils";

interface Props {
  game: ReturnType<typeof useGame>;
  cover?: string; // pokazuj okładkę albumu na winylu jeśli mode=album
  hideAnswerOnLoss?: boolean;
}

export function GameBoard({ game, cover, hideAnswerOnLoss = false }: Props) {
  const [muted, setMuted] = useState(false);
  const player = useAudioPlayer({
    song: game.track!,
    durationSec: game.currentDuration,
    startSec: game.track?.startSec ?? 0,
  });

  // Reset playera gdy zmienia się track
  useEffect(() => { player.stop(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [game.track?.id]);

  // Po zakończeniu rundy odtwórz pełny utwór dopóki użytkownik nie kliknie dalej
  const ended = game.status !== "playing";
  useEffect(() => {
    if (ended) player.playFull();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [ended, game.track?.id]);

  if (!game.track) return null;

  const playing = player.playing;
  const won = game.status === "won";

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 sm:gap-8 px-1">
      <Vinyl spinning={playing} cover={ended || cover ? (cover ?? undefined) : undefined} />

      <div className="w-full space-y-4">
        <DurationStepper
          durations={game.durations}
          currentIdx={game.attemptIdx}
          guesses={game.guesses}
        />
        <Waveform progress={player.progress} playing={playing} />

        <div className="flex justify-center pt-2">
          <button
            onClick={() => playing ? player.stop() : player.play()}
            onClick={() => {
              if (playing) player.stop();
              else if (ended) player.playFull();
              else player.play();
            }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              "bg-ink text-paper hover:scale-105 active:scale-95 shadow-lift disabled:opacity-30 disabled:hover:scale-100",
            )}
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>
        </div>
        <p className="text-center text-xs font-mono text-ink-muted">
          Próba {Math.min(game.attemptIdx + 1, game.maxAttempts)} / {game.maxAttempts} · {game.currentDuration}s sample
        </p>
      </div>

      {!ended && (
        <GuessSearch
          pool={game.pool}
          onSubmit={game.submitGuess}
          onSkip={game.skip}
        />
      )}

      {ended && (
        <div className="w-full text-center space-y-2 py-6 border-y border-hairline animate-fade-in-up">
          <div className={cn("text-xs uppercase tracking-[0.2em]", won ? "text-success" : "text-primary")}>
            {won ? "Trafione" : "Pudło"}
          </div>
          {!hideAnswerOnLoss || won ? (
            <>
              <h2 className="text-3xl font-display">{game.track.title}</h2>
              <p className="text-ink-muted">{game.track.artist}{game.track.year ? ` · ${game.track.year}` : ""}</p>
            </>
          ) : null}
        </div>
      )}

      <GuessList guesses={game.guesses} pool={game.pool} />
    </div>
  );
}
