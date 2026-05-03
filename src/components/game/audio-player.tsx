import { useEffect, useRef, useState } from "react";
import type { Song } from "@/data/songs";

interface Props {
  song: Song;
  durationSec: number;
  onEnd?: () => void;
  onPlayingChange?: (p: boolean) => void;
  startSec?: number;
}

export function useAudioPlayer({ song, durationSec, onEnd, onPlayingChange, startSec = 0 }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const stopTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = new Audio(song.src);
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    ref.current = el;
    return () => {
      el.pause();
      ref.current = null;
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [song.src]);

  const stop = () => {
    const el = ref.current; if (!el) return;
    el.pause();
    if (stopTimer.current) { window.clearTimeout(stopTimer.current); stopTimer.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setPlaying(false); onPlayingChange?.(false); setProgress(1);
    onEnd?.();
  };

  const play = () => {
    const el = ref.current; if (!el) return;
    el.currentTime = startSec;
    el.play().then(() => {
      setPlaying(true); onPlayingChange?.(true); setProgress(0);
      const start = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000;
        const pct = Math.min(1, elapsed / durationSec);
        setProgress(pct);
        if (pct < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      stopTimer.current = window.setTimeout(stop, durationSec * 1000);
    }).catch(() => {
      setPlaying(false); onPlayingChange?.(false);
    });
  };

  return { play, stop, playing, progress };
}
