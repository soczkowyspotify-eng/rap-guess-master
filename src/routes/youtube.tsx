import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DurationStepper } from "@/components/game/duration-stepper";
import { DIFFICULTY, type Difficulty } from "@/lib/game-data";
import { Storage } from "@/lib/storage";
import { Play, Pause, RotateCcw, ListMusic, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/youtube")({
  head: () => ({ meta: [
    { title: "YouTube Music — RAP GUESSER" },
    { name: "description", content: "Zgaduj kawałki z linków YouTube Music. Wklejasz playlistę, gra losuje fragmenty." },
  ] }),
  component: YouTubePage,
});

const STORAGE_KEY = "rg.youtube.tracks.v1";

interface YTTrack { videoId: string; title: string; artist: string; }

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function parseInput(text: string): YTTrack[] {
  const out: YTTrack[] = [];
  const seen = new Set<string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [linkPart, metaPart] = line.split("|").map(s => s?.trim() ?? "");
    const videoId = extractVideoId(linkPart);
    if (!videoId || seen.has(videoId)) continue;
    let artist = "?", title = "?";
    if (metaPart) {
      const dash = metaPart.indexOf(" - ");
      if (dash > 0) { artist = metaPart.slice(0, dash).trim(); title = metaPart.slice(dash + 3).trim(); }
      else { title = metaPart; }
    }
    seen.add(videoId);
    out.push({ videoId, title, artist });
  }
  return out;
}

// YT IFrame API loader (singleton)
let ytReady: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if ((window as any).YT?.Player) { resolve(); return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    (window as any).onYouTubeIframeAPIReady = () => resolve();
  });
  return ytReady;
}

function pickRandom<T>(arr: T[], n: number, exclude?: T): T[] {
  const pool = arr.filter(x => x !== exclude);
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

function YouTubePage() {
  const [tracks, setTracks] = useState<YTTrack[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
  });
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState("");
  const [diff, setDiff] = useState<Difficulty>(() => Storage.getSettings().difficulty);
  const conf = DIFFICULTY[diff];

  // Game state
  const [current, setCurrent] = useState<YTTrack | null>(null);
  const [choices, setChoices] = useState<YTTrack[]>([]);
  const [attemptIdx, setAttemptIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [streak, setStreak] = useState(0);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const duration = conf.durations[Math.min(attemptIdx, conf.durations.length - 1)];

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks)); } catch {}
  }, [tracks]);

  // Pick first track once we have enough
  useEffect(() => {
    if (!current && tracks.length >= 4) nextRound(tracks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  // Load YT player once
  useEffect(() => {
    let cancelled = false;
    loadYT().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        height: "1", width: "1",
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            setPlaying(e.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      try { playerRef.current?.destroy?.(); } catch {}
    };
  }, []);

  const stopPlayback = () => {
    if (stopTimerRef.current) { window.clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    try { playerRef.current?.pauseVideo?.(); } catch {}
    setPlaying(false);
  };

  const playSnippet = () => {
    if (!current || !playerReady) return;
    try {
      playerRef.current.loadVideoById({ videoId: current.videoId, startSeconds: 0 });
      playerRef.current.playVideo();
    } catch {}
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = window.setTimeout(() => { stopPlayback(); }, Math.max(300, duration * 1000));
  };

  function nextRound(pool: YTTrack[]) {
    stopPlayback();
    if (pool.length < 4) { setCurrent(null); return; }
    const target = pool[Math.floor(Math.random() * pool.length)];
    const distractors = pickRandom(pool, 3, target);
    const all = [target, ...distractors].sort(() => Math.random() - 0.5);
    setCurrent(target); setChoices(all);
    setAttemptIdx(0); setPicked(null); setStatus("playing");
  }

  const onPick = (t: YTTrack) => {
    if (status !== "playing" || !current) return;
    setPicked(t.videoId);
    if (t.videoId === current.videoId) {
      stopPlayback();
      setStatus("won"); setStreak(s => s + 1);
    } else {
      if (attemptIdx + 1 >= conf.attempts) {
        stopPlayback();
        setStatus("lost"); setStreak(0);
      } else {
        setAttemptIdx(i => i + 1);
        setPicked(null);
        toast.error("Pudło — masz jeszcze szansę");
      }
    }
  };

  const skip = () => {
    if (status !== "playing") return;
    if (attemptIdx + 1 >= conf.attempts) {
      stopPlayback(); setStatus("lost"); setStreak(0);
    } else { setAttemptIdx(i => i + 1); }
  };

  const saveDraft = () => {
    const parsed = parseInput(draft);
    if (!parsed.length) { toast.error("Nie znalazłem żadnych poprawnych linków"); return; }
    setTracks(parsed);
    setShowEditor(false);
    setCurrent(null);
    toast.success(`Dodano ${parsed.length} tracków`);
  };

  const openEditor = () => {
    const text = tracks.map(t => `https://music.youtube.com/watch?v=${t.videoId} | ${t.artist} - ${t.title}`).join("\n");
    setDraft(text);
    setShowEditor(true);
  };

  const changeDiff = (d: Difficulty) => {
    setDiff(d);
    const s = Storage.getSettings(); s.difficulty = d; Storage.saveSettings(s);
    if (current) nextRound(tracks);
  };

  // ---- UI ----
  if (!tracks.length) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader />
        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-8 space-y-3">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">YouTube Music</p>
            <h1 className="font-display text-4xl md:text-5xl">Wklej swoją playlistę</h1>
            <p className="text-ink-muted max-w-xl mx-auto">
              Każda linijka: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">link | Artysta - Tytuł</code>.
              Najlepiej linki z <strong>music.youtube.com</strong> (bez intra teledysku).
              Minimum 4 tracki.
            </p>
          </div>
          <Editor draft={draft} setDraft={setDraft} onSave={saveDraft} />
        </main>
      </div>
    );
  }

  const ended = status !== "playing";

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="text-center mb-6 space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">YouTube Music</p>
          <h1 className="font-display text-3xl md:text-4xl">Streak: {streak} <span className="text-ink-muted">· {tracks.length} tracków</span></h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex p-1 bg-muted rounded-full">
              {(Object.keys(DIFFICULTY) as Difficulty[]).map(d => (
                <button key={d} onClick={() => changeDiff(d)}
                  className={cn("px-4 h-8 text-xs uppercase tracking-wider rounded-full transition",
                    diff === d ? "bg-ink text-paper" : "text-ink-muted hover:text-ink")}>
                  {DIFFICULTY[d].label}
                </button>
              ))}
            </div>
            <button onClick={openEditor}
              className="inline-flex items-center gap-1.5 px-3 h-8 text-xs rounded-full border border-hairline hover:border-ink/50 transition">
              <ListMusic className="h-3.5 w-3.5" /> Edytuj listę
            </button>
          </div>
        </div>

        {/* Hidden YT player */}
        <div className="absolute opacity-0 pointer-events-none -z-10" aria-hidden>
          <div ref={containerRef} />
        </div>

        {current && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-hairline bg-paper p-6 sm:p-8 text-center">
                <DurationStepper
                  durations={conf.durations}
                  currentIdx={attemptIdx}
                  guesses={Array.from({ length: attemptIdx }, () => ({ correct: false }))}
                />
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => playing ? stopPlayback() : playSnippet()}
                  disabled={!playerReady || ended}
                  className="h-16 w-16 rounded-full bg-ink text-paper inline-flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition">
                  {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                </button>
                <button
                  onClick={() => { stopPlayback(); setTimeout(playSnippet, 50); }}
                  disabled={!playerReady || ended}
                  className="h-11 w-11 rounded-full border border-hairline inline-flex items-center justify-center hover:border-ink/50 disabled:opacity-40 transition"
                  title="Od początku">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-3 font-mono">
                {duration}s {!playerReady && "· ładowanie playera..."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {choices.map(c => {
                const isCorrect = c.videoId === current.videoId;
                const isPicked = picked === c.videoId;
                const reveal = ended;
                return (
                  <button
                    key={c.videoId}
                    onClick={() => onPick(c)}
                    disabled={ended}
                    className={cn(
                      "text-left p-4 rounded-2xl border transition",
                      reveal && isCorrect && "border-emerald-500 bg-emerald-500/10",
                      reveal && !isCorrect && isPicked && "border-red-500 bg-red-500/10",
                      !reveal && "border-hairline hover:border-ink/50",
                      reveal && !isCorrect && !isPicked && "border-hairline opacity-60",
                    )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wider text-ink-muted truncate">{c.artist}</div>
                        <div className="font-medium truncate">{c.title}</div>
                      </div>
                      {reveal && isCorrect && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {reveal && !isCorrect && isPicked && <X className="h-4 w-4 text-red-500 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!ended && (
                <button onClick={skip} className="px-5 h-10 rounded-full border border-hairline text-sm hover:border-ink/50 transition">
                  Pas
                </button>
              )}
              {ended && (
                <button onClick={() => nextRound(tracks)} className="px-6 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
                  Następny track →
                </button>
              )}
            </div>
          </div>
        )}

        {showEditor && (
          <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditor(false)}>
            <div className="bg-paper rounded-3xl border border-hairline max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl">Edytuj listę</h2>
                <button onClick={() => setShowEditor(false)} className="h-8 w-8 rounded-full hover:bg-muted inline-flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Editor draft={draft} setDraft={setDraft} onSave={saveDraft} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Editor({ draft, setDraft, onSave }: { draft: string; setDraft: (v: string) => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        rows={10}
        placeholder={`https://music.youtube.com/watch?v=abc123 | Taco Hemingway - Polskie Tango\nhttps://music.youtube.com/watch?v=def456 | Mata - Patointeligencja`}
        className="w-full rounded-2xl border border-hairline bg-paper p-4 font-mono text-xs resize-y focus:outline-none focus:border-ink/50"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">Format: <code>link | Artysta - Tytuł</code></p>
        <button onClick={onSave} className="px-5 h-10 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
          Zapisz
        </button>
      </div>
    </div>
  );
}