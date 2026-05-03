import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DIFFICULTY, allSongs, dailySong, dailyKey, dailyNumber, songsForAlbum,
  pickRandom, fuzzyMatch, type Mode, type Difficulty,
} from "@/lib/game-data";
import { Storage, type DailyHistoryEntry } from "@/lib/storage";
import type { Song } from "@/data/songs";
import { toast } from "sonner";

export type GuessResult = { trackId: string; correct: boolean; skipped?: boolean };
export type Status = "playing" | "won" | "lost";

interface Options {
  mode: Mode;
  difficulty?: Difficulty;
  albumId?: string;
}

export function useGame({ mode, difficulty, albumId }: Options) {
  // Daily zawsze normal — żeby ranking był uczciwy
  const effDiff: Difficulty = mode === "daily" ? "normal" : (difficulty ?? "normal");
  const conf = DIFFICULTY[effDiff];

  const pool: Song[] = useMemo(() => {
    if (mode === "album" && albumId) return songsForAlbum(albumId);
    return allSongs();
  }, [mode, albumId]);

  // Album playthrough — kolejność
  const [albumQueue, setAlbumQueue] = useState<Song[]>(() => {
    if (mode === "album" && albumId) {
      const done = new Set(Storage.getAlbumProgress()[albumId]?.guessed ?? []);
      return pool.filter(s => !done.has(s.id));
    }
    return [];
  });

  const initial = useMemo<Song | null>(() => {
    if (mode === "daily") return dailySong();
    if (mode === "album") {
      const remaining = albumQueue.length ? albumQueue : pool;
      return remaining[0] ?? null;
    }
    return pickRandom(pool);
  }, [mode, pool, albumQueue]);

  const [track, setTrack] = useState<Song | null>(initial);
  const [attemptIdx, setAttemptIdx] = useState(0);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const initOnce = useRef(false);

  // Daily — załaduj zapisany stan jeśli dziś już grał
  useEffect(() => {
    if (initOnce.current) return; initOnce.current = true;
    if (mode === "daily") {
      const today = Storage.getDailyToday(dailyKey());
      if (today) {
        setStatus(today.won ? "won" : "lost");
        setAttemptIdx(today.attempts >= 0 ? today.attempts : conf.attempts - 1);
      }
    }
  }, [mode, conf.attempts]);

  const finishDaily = useCallback((won: boolean, attempts: number) => {
    if (mode !== "daily" || !track) return;
    const entry: DailyHistoryEntry = {
      key: dailyKey(), number: dailyNumber(), songId: track.id,
      attempts: won ? attempts : -1, won,
    };
    Storage.saveDailyEntry(entry);
  }, [mode, track]);

  const updateStats = useCallback((won: boolean, attempts: number, missedSongIds: string[]) => {
    const s = Storage.getStats();
    s.totalPlayed += 1;
    s.totalAttempts += attempts + 1;
    if (won) s.totalGuessed += 1;
    if (mode === "endless") {
      if (won) {
        s.endlessCurrent += 1;
        if (s.endlessCurrent > s.endlessBest) s.endlessBest = s.endlessCurrent;
      } else {
        s.endlessCurrent = 0;
      }
    }
    for (const id of missedSongIds) s.missedTracks[id] = (s.missedTracks[id] ?? 0) + 1;
    Storage.saveStats(s);

    // Achievements
    if (won) {
      if (Storage.unlock("first_win")) toast.success("🏆 Pierwsza krew");
      if (attempts === 0 && conf.durations[0] <= 0.5 && Storage.unlock("snap")) toast.success("🏆 Snap");
      if (mode === "endless") {
        if (s.endlessCurrent >= 5 && Storage.unlock("streak_5")) toast.success("🏆 Seria 5");
        if (s.endlessCurrent >= 10 && Storage.unlock("streak_10")) toast.success("🏆 Seria 10");
        if (s.endlessCurrent >= 25 && Storage.unlock("streak_25")) toast.success("🏆 Seria 25");
      }
      if (effDiff === "hard" && Storage.unlock("hard_win")) toast.success("🏆 Hardcore");
    }
  }, [mode, conf.durations, effDiff]);

  const updateAlbumProgress = useCallback((won: boolean, missCount: number) => {
    if (mode !== "album" || !albumId || !track) return;
    const all = Storage.getAlbumProgress();
    const cur = all[albumId] ?? { guessed: [], best: { score: 0, perfect: true } };
    if (won && !cur.guessed.includes(track.id)) cur.guessed.push(track.id);
    if (!won || missCount > 0) cur.best.perfect = false;
    cur.best.score = cur.guessed.length;
    all[albumId] = cur;
    Storage.saveAlbumProgress(all);

    const total = pool.length;
    if (cur.guessed.length === total) {
      if (Storage.unlock("album_complete")) toast.success("🏆 Pełna płyta");
      if (cur.best.perfect && Storage.unlock("perfect_album")) toast.success("🏆 Bez pomyłki");
    }
  }, [mode, albumId, track, pool.length]);

  const onCorrect = useCallback(() => {
    if (!track) return;
    setGuesses(g => [...g, { trackId: track.id, correct: true }]);
    setStatus("won");
    finishDaily(true, attemptIdx);
    updateStats(true, attemptIdx, []);
    updateAlbumProgress(true, guesses.filter(g => !g.correct).length);
  }, [track, attemptIdx, guesses, finishDaily, updateStats, updateAlbumProgress]);

  const onWrong = useCallback((wrongId: string) => {
    setGuesses(g => [...g, { trackId: wrongId, correct: false }]);
    if (attemptIdx + 1 >= conf.attempts) {
      setStatus("lost");
      if (track) {
        finishDaily(false, attemptIdx);
        updateStats(false, attemptIdx, [track.id]);
        updateAlbumProgress(false, guesses.filter(g => !g.correct).length + 1);
      }
    } else {
      setAttemptIdx(i => i + 1);
    }
  }, [attemptIdx, conf.attempts, track, finishDaily, updateStats, updateAlbumProgress, guesses]);

  const skip = useCallback(() => {
    if (!track) return;
    setGuesses(g => [...g, { trackId: track.id, correct: false, skipped: true }]);
    if (attemptIdx + 1 >= conf.attempts) {
      setStatus("lost");
      finishDaily(false, attemptIdx);
      updateStats(false, attemptIdx, [track.id]);
      updateAlbumProgress(false, guesses.filter(g => !g.correct).length + 1);
    } else {
      setAttemptIdx(i => i + 1);
    }
  }, [track, attemptIdx, conf.attempts, finishDaily, updateStats, updateAlbumProgress, guesses]);

  const submitGuess = useCallback((song: Song) => {
    if (!track || status !== "playing") return;
    if (song.id === track.id) onCorrect();
    else onWrong(song.id);
  }, [track, status, onCorrect, onWrong]);

  const next = useCallback(() => {
    if (mode === "endless") {
      const newSong = pickRandom(pool);
      setTrack(newSong); setAttemptIdx(0); setGuesses([]); setStatus("playing");
    } else if (mode === "album" && albumId) {
      const queue = albumQueue.filter(s => s.id !== track?.id);
      setAlbumQueue(queue);
      const nxt = queue[0];
      if (nxt) { setTrack(nxt); setAttemptIdx(0); setGuesses([]); setStatus("playing"); }
      else { setTrack(null); }
    }
  }, [mode, pool, albumId, albumQueue, track]);

  return {
    track, status, attemptIdx, guesses,
    durations: conf.durations,
    maxAttempts: conf.attempts,
    currentDuration: conf.durations[Math.min(attemptIdx, conf.durations.length - 1)],
    submitGuess, skip, next,
    pool, mode, difficulty: effDiff,
    fuzzyMatch,
  };
}
