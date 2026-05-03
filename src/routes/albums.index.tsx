import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";
import { AppHeader } from "@/components/app-header";
import { albums } from "@/lib/game-data";
import { Storage } from "@/lib/storage";
import { loadYtAlbums, subscribeYt, getYtAlbums } from "@/lib/yt-pool";

export const Route = createFileRoute("/albums/")({
  head: () => ({ meta: [{ title: "Albumy — RAP GUESSER" }, { name: "description", content: "Wybierz album i zgaduj jego tracki." }] }),
  component: AlbumsPage,
});

function AlbumsPage() {
  useSyncExternalStore(subscribeYt, () => getYtAlbums().length, () => 0);
  useEffect(() => { loadYtAlbums(); }, []);
  const list = albums();
  const progress = Storage.getAlbumProgress();
  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Tryb album</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Wybierz płytę</h1>
          <p className="mt-3 text-ink-muted max-w-lg">Każdy album to osobne wyzwanie. Zgaduj wszystkie tracki, śledź postęp i bij swój rekord.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {list.map(a => {
            const p = progress[a.id];
            const done = p?.guessed.length ?? 0;
            const pct = (done / a.songs.length) * 100;
            return (
              <Link
                key={a.id}
                to="/albums/$albumId"
                params={{ albumId: a.id }}
                className="group block"
              >
                <div className="aspect-square rounded-2xl overflow-hidden border border-hairline relative shadow-soft group-hover:shadow-lift transition">
                  <img src={a.cover} alt={a.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {done === a.songs.length && (
                    <div className="absolute top-3 right-3 bg-success text-paper text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full">100%</div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="font-medium leading-tight truncate">{a.title}</div>
                  <div className="text-sm text-ink-muted truncate">{a.artist} · {a.year}</div>
                  <div className="mt-2 h-1 bg-hairline rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-ink-muted">{done}/{a.songs.length}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
