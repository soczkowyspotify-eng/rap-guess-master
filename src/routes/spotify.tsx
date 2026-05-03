import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { GameBoard } from "@/components/game/game-board";
import { useGame } from "@/hooks/use-game";
import { fetchSpotifyPlaylist, type SpotifyTrack } from "@/server/spotify.functions";
import type { Song } from "@/data/songs";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/spotify")({
  head: () => ({ meta: [
    { title: "Spotify — RAP GUESSER" },
    { name: "description", content: "Zgaduj utwory z dowolnej playlisty Spotify (30s preview)." },
  ]}),
  component: SpotifyPage,
});

interface LoadedPlaylist {
  name: string;
  total: number;
  withPreview: number;
  songs: Song[];
  covers: Record<string, string>;
}

function SpotifyPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pl, setPl] = useState<LoadedPlaylist | null>(null);
  const [seed, setSeed] = useState(0);

  const load = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(null); setPl(null);
    try {
      const res = await fetchSpotifyPlaylist({ data: { url } });
      if (res.error) { setError(res.error); return; }
      if (!res.tracks.length) { setError("Ta playlista nie zwróciła żadnych tracków z preview (Spotify ich nie udostępnia)."); return; }
      const songs: Song[] = res.tracks.map((t: SpotifyTrack) => ({
        id: t.id, title: t.title, artist: t.artist, year: t.year, type: "url" as const, src: t.src,
      }));
      const covers: Record<string, string> = {};
      for (const t of res.tracks) if (t.cover) covers[t.id] = t.cover;
      setPl({ name: res.name, total: res.total, withPreview: res.withPreview, songs, covers });
      setSeed(s => s + 1);
    } catch (err: any) {
      setError(err?.message ?? "Coś poszło nie tak.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Beta</p>
          <h1 className="font-display text-3xl sm:text-5xl mt-2">Z playlisty Spotify</h1>
          <p className="text-ink-muted text-sm sm:text-base mt-3">
            Wklej link do publicznej playlisty. Tracklista idzie ze Spotify, a próbki dobieramy automatycznie.
          </p>
        </div>

        <form onSubmit={load} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="flex-1 h-11 px-4 rounded-full bg-card border border-hairline text-sm focus:outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-11 px-6 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Ładuję" : "Załaduj"}
          </button>
        </form>

        {error && (
          <div className="text-sm text-primary text-center py-4 border border-primary/30 rounded-2xl mb-6">{error}</div>
        )}

        {pl && <PlaylistGame key={seed} pl={pl} />}
      </main>
    </div>
  );
}

function PlaylistGame({ pl }: { pl: LoadedPlaylist }) {
  const game = useGame({ mode: "endless", difficulty: "normal", poolOverride: pl.songs });
  const ended = game.status !== "playing";
  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">{pl.name}</p>
        <p className="text-xs text-ink-muted mt-1">
          {pl.withPreview} / {pl.total} tracków z dostępną próbką
        </p>
      </div>
      <GameBoard game={game} cover={game.track ? pl.covers[game.track.id] : undefined} />
      {ended && (
        <div className="mt-8 flex justify-center">
          <button onClick={game.next} className="px-6 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
            Następny track →
          </button>
        </div>
      )}
    </div>
  );
}