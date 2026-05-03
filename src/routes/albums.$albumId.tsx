import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { GameBoard } from "@/components/game/game-board";
import { useGame } from "@/hooks/use-game";
import { albumById } from "@/lib/game-data";
import { Storage } from "@/lib/storage";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/albums/$albumId")({
  head: ({ params }) => {
    const a = albumById(params.albumId);
    return { meta: [
      { title: a ? `${a.title} — Album mode` : "Album — RAP GUESSER" },
      { name: "description", content: a ? `Zgaduj tracki z albumu ${a.title}.` : "Tryb album." },
    ]};
  },
  component: AlbumPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Nie ma takiego albumu</h1>
        <Link to="/albums" className="mt-6 inline-block underline underline-offset-4">← Wróć do listy</Link>
      </main>
    </div>
  ),
});

function AlbumPage() {
  const { albumId } = Route.useParams();
  const album = albumById(albumId);
  if (!album) throw notFound();
  const game = useGame({ mode: "album", albumId: album.id, difficulty: Storage.getSettings().difficulty });
  const progress = Storage.getAlbumProgress()[album.id];
  const done = progress?.guessed.length ?? 0;
  const ended = game.status !== "playing";
  const completed = done === album.songs.length;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <Link to="/albums" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Wszystkie albumy
        </Link>

        <header className="grid md:grid-cols-[200px_1fr] gap-8 items-end mb-12 pb-12 border-b border-hairline">
          <img src={album.cover} alt={album.title} className="w-full aspect-square object-cover rounded-2xl shadow-lift" />
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Album · {album.year}</p>
            <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{album.title}</h1>
            <p className="mt-1 text-lg text-ink-muted">{album.artist}</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex-1 h-1 bg-hairline rounded-full overflow-hidden max-w-xs">
                <div className="h-full bg-primary" style={{ width: `${(done/album.songs.length)*100}%` }} />
              </div>
              <span className="text-sm font-mono text-ink-muted">{done}/{album.songs.length}</span>
            </div>
          </div>
        </header>

        {completed ? (
          <div className="text-center py-16 space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-success">Album ukończony</p>
            <h2 className="font-display text-5xl">100%</h2>
            <p className="text-ink-muted">Wszystkie tracki zgadnięte. Spróbuj innego albumu.</p>
            <Link to="/albums" className="inline-block px-6 h-11 leading-[2.75rem] rounded-full bg-ink text-paper font-medium">
              Wybierz inny album
            </Link>
          </div>
        ) : game.track ? (
          <>
            <GameBoard game={game} cover={album.cover} hideAnswerOnLoss={false} />
            {ended && (
              <div className="mt-10 flex justify-center">
                <button onClick={game.next} className="px-6 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
                  Następny track →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-ink-muted">Brak tracków do odgadnięcia.</div>
        )}

        <section className="mt-16 pt-12 border-t border-hairline">
          <h3 className="font-display text-2xl mb-6">Tracklista</h3>
          <ol className="grid sm:grid-cols-2 gap-1.5">
            {album.songs.map((s, i) => {
              const guessed = progress?.guessed.includes(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted transition">
                  <span className="font-mono text-xs text-ink-muted w-6">{String(i+1).padStart(2, "0")}</span>
                  <span className="flex-1 truncate">{guessed ? s.title : <span className="text-ink-muted">— ukryty —</span>}</span>
                  {guessed && <Check className="h-4 w-4 text-success" />}
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </div>
  );
}
