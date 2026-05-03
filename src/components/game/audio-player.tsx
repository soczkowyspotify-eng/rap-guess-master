import { useEffect, useRef, useState } from "react";
import type { Song } from "@/data/songs";

interface Props {
  song: Song;
  durationSec: number;
  onEnd?: () => void;
  onPlayingChange?: (p: boolean) => void;
  startSec?: number;
}

// ---- YT IFrame API singleton loader ----
let ytReady: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (w.YT?.Player) { resolve(); return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
  });
  return ytReady;
}

export function useAudioPlayer({ song, durationSec, onEnd, onPlayingChange, startSec = 0 }: Props) {
  const isYT = song.type === "youtube";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<any>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const stopTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Setup HTML5 audio
  useEffect(() => {
    if (isYT) return;
    const el = new Audio(song.src);
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [song.src, isYT]);

  // Setup YT player
  useEffect(() => {
    if (!isYT) return;
    if (typeof window === "undefined") return;
    let cancelled = false;
    // Create container
    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.opacity = "0";
    host.style.pointerEvents = "none";
    host.style.left = "-9999px";
    host.style.width = "1px";
    host.style.height = "1px";
    document.body.appendChild(host);
    ytHostRef.current = host;

    loadYT().then(() => {
      if (cancelled) return;
      ytRef.current = new (window as any).YT.Player(host, {
        height: "1", width: "1",
        videoId: song.src,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.ENDED) {
              setPlaying(false); onPlayingChange?.(false);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { ytRef.current?.destroy?.(); } catch {}
      ytRef.current = null;
      try { host.remove(); } catch {}
    };
  }, [song.src, isYT, onPlayingChange]);

  const stop = () => {
    if (stopTimer.current) { window.clearTimeout(stopTimer.current); stopTimer.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (isYT) {
      try { ytRef.current?.pauseVideo?.(); } catch {}
    } else {
      audioRef.current?.pause();
    }
    setPlaying(false); onPlayingChange?.(false); setProgress(1);
    onEnd?.();
  };

  const beginTimers = () => {
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
  };

  const play = () => {
    if (isYT) {
      const p = ytRef.current;
      if (!p?.seekTo) return;
      try {
        p.seekTo(startSec, true);
        p.unMute?.();
        p.playVideo();
        beginTimers();
      } catch {}
      return;
    }
    const el = audioRef.current; if (!el) return;
    el.currentTime = startSec;
    el.play().then(() => {
      beginTimers();
    }).catch(() => {
      setPlaying(false); onPlayingChange?.(false);
    });
  };

  return { play, stop, playing, progress };
}
