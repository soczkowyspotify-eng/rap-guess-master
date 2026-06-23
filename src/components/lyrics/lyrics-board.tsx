import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRandomLyric, getDailyLyric, type LyricSnippet } from "@/lib/lyrics.functions";
import { allSongs, sameSong, normalize } from "@/lib/game-data";
import type { Song } from "@/data/songs";
import { GuessSearch } from "@/components/game/guess-search";
import { Quote, RefreshCw, Trophy, Skull, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Storage } from "@/lib/storage";
import { toast } from "sonner";

const MAX_ATTEMPTS = 4;

interface Props { variant: "endless" | "daily"; }

export function LyricsBoard({ variant }: Props) {
  const rand = useServerFn(getRandomLyric);
  const daily = useServerFn(getDailyLyric);
  const [snippet, setSnippet] = useState<LyricSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [guesses, setGuesses] = useState<{ id: string; correct: boolean }[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const pool = useMemo(() => allSongs(), []);

  const load = async () => {
    setLoading(true);
    setAttempt(0); setGuesses([]); setStatus("playing");
    try {
      const fn = variant === "daily" ? daily : rand;
      const r = await fn({});
      setSnippet(r as LyricSnippet | null);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [variant]);

  const matchedSong = useMemo<Song | null>(() => {
    if (!snippet) return null;
    const targetA = normalize(snippet.artist);
    const targetT = normalize(snippet.title);
    return pool.find(s => normalize(s.artist).includes(targetA.split(" ")[0]) && normalize(s.title) === targetT)
      ?? pool.find(s => normalize(s.title) === targetT && normalize(s.artist).includes(targetA))
      ?? pool.find(s => normalize(s.artist) === targetA && normalize(s.title) === targetT)
      ?? null;
  }, [snippet, pool]);

  const submit = (song: Song) => {
    if (!snippet || status !== "playing") return;
    const correct = matchedSong
      ? sameSong(song, matchedSong)
      : normalize(song.title) === normalize(snippet.title);
    setGuesses(g => [...g, { id: song.id, correct }]);
    if (correct) {
      setStatus("won");
      const stats = Storage.getStats();
      stats.totalGuessed += 1; stats.totalPlayed += 1;
      Storage.saveStats(stats);
      if (Storage.unlock("lyrics_first")) toast.success("🏆 Pierwsze wersy");
    } else if (attempt + 1 >= MAX_ATTEMPTS) {
      setStatus("lost");
      const stats = Storage.getStats();
      stats.totalPlayed += 1;
      Storage.saveStats(stats);
    } else {
      setAttempt(a => a + 1);
    }
  };

  const skip = () => {
    if (!snippet || status !== "playing") return;
    setGuesses(g => [...g, { id: "__skip__" + Date.now(), correct: false }]);
    if (attempt + 1 >= MAX_ATTEMPTS) setStatus("lost");
    else setAttempt(a => a + 1);
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-ink-muted">Ładuję wers…</div>;
  }
  if (!snippet) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-muted">Brak wersów w bazie. Admin musi dodać pierwszy.</p>
      </div>
    );
  }

  const visibleLines = snippet.lines.slice(0, Math.min(attempt + 1, snippet.lines.length));
  const yearHint = attempt >= 2;
  const artistHint = attempt >= 3;

  return (
    <div className="space-y-6">
      <div className="relative bg-card border border-hairline rounded-3xl p-8 sm:p-12 overflow-hidden">
        <Quote className="absolute top-4 left-4 h-10 w-10 text-primary/20" />
        <div className="space-y-3 text-center min-h-[140px] flex flex-col justify-center">
          <AnimatePresence mode="popLayout">
            {visibleLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="font-display text-xl sm:text-2xl md:text-3xl italic leading-relaxed"
              >
                „{line}"
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
        {(yearHint || artistHint) && status === "playing" && (
          <div className="mt-6 flex justify-center gap-4 text-xs font-mono text-ink-muted">
            {artistHint && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Wykonawca zaczyna się na „{snippet.artist[0]?.toUpperCase() ?? "?"}"</span>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">Próba {Math.min(attempt + 1, MAX_ATTEMPTS)} / {MAX_ATTEMPTS}</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <span key={i} className={`h-2 w-8 rounded-full ${
              guesses[i]?.correct ? "bg-emerald-500" :
              guesses[i] ? "bg-rose-500" :
              i === attempt && status === "playing" ? "bg-ink/40" : "bg-hairline"
            }`} />
          ))}
        </div>
      </div>

      {status === "playing" ? (
        <GuessSearch pool={pool} onSubmit={submit} onSkip={skip} />
      ) : (
        <div className={`text-center p-8 rounded-3xl border ${status === "won" ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
          {status === "won" ? <Trophy className="h-10 w-10 mx-auto mb-3 text-emerald-500" /> : <Skull className="h-10 w-10 mx-auto mb-3 text-rose-500" />}
          <h3 className="font-display text-2xl mb-1">{status === "won" ? "Trafione!" : "Pudło"}</h3>
          <p className="text-ink-muted mb-4">
            <span className="text-ink font-medium">{snippet.artist}</span> — {snippet.title}
          </p>
          {variant === "endless" && (
            <button onClick={load} className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-ink text-paper text-sm hover:opacity-90">
              <RefreshCw className="h-4 w-4" /> Następny wers
            </button>
          )}
        </div>
      )}
    </div>
  );
}