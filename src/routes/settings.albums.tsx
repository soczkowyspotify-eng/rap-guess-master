import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { albums as allAlbums } from "@/lib/game-data";
import { AlbumPrefs } from "@/lib/album-prefs";
import { Check, Star, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { loadYtAlbums } from "@/lib/yt-pool";

export const Route = createFileRoute("/settings/albums")({
  head: () => ({ meta: [{ title: "Wybór albumów — RAP GUESSER" }] }),
  component: AlbumsSettings,
});

function AlbumsSettings() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, force] = useState(0);

  useEffect(() => {
    loadYtAlbums().then(() => force(x => x + 1));
    const s = AlbumPrefs.get();
    setSelected(s ?? new Set());
  }, []);

  const list = useMemo(() => allAlbums(), []);
  const allOn = selected.size === 0; // brak filtru = wszystkie

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.size === 0) {
        // przejście z "wszystkie" → wszystkie poza klikniętym
        for (const a of list) n.add(a.id);
      }
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelected(new Set());
  const selectNone = () => setSelected(new Set(["__none__"]));
  const onlyRecommended = () => setSelected(new Set(list.filter(a => a.recommended).map(a => a.id)));

  const save = () => {
    if (selected.size === 0) AlbumPrefs.clear();
    else AlbumPrefs.save([...selected].filter(id => id !== "__none__"));
    toast.success("Zapisano. Endless korzysta teraz z wybranej puli.");
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4">
          <ArrowLeft className="h-4 w-4" /> Ustawienia
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl">Wybierz albumy</h1>
        <p className="text-ink-muted mt-2 text-sm">
          Wybrane albumy zasilają tryby Endless i Album. Singles są zawsze w puli.
          {allOn && <> Obecnie używamy <span className="text-ink">wszystkich</span> albumów.</>}
        </p>

        <div className="flex flex-wrap gap-2 mt-6">
          <button onClick={selectAll} className="px-4 h-9 rounded-full text-sm border border-hairline hover:border-ink transition">Wszystkie</button>
          <button onClick={selectNone} className="px-4 h-9 rounded-full text-sm border border-hairline hover:border-ink transition">Żadne</button>
          <button onClick={onlyRecommended} className="px-4 h-9 rounded-full text-sm border border-hairline hover:border-ink transition inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> Tylko polecane
          </button>
          <button onClick={() => { AlbumPrefs.clear(); setSelected(new Set()); }} className="ml-auto px-4 h-9 rounded-full text-sm border border-hairline hover:border-ink transition inline-flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 mt-6">
          {list.map(a => {
            const on = allOn || (selected.has(a.id) && !selected.has("__none__"));
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition text-left ${on ? "border-ink bg-card" : "border-hairline opacity-60 hover:opacity-100"}`}
              >
                <img src={a.cover} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-1">
                    {a.title}
                    {a.recommended && <Star className="h-3 w-3 text-primary fill-primary" />}
                  </div>
                  <div className="text-xs text-ink-muted truncate">{a.artist} · {a.songs.length} utworów</div>
                </div>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? "border-ink bg-ink text-paper" : "border-hairline"}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8 flex justify-end">
          <button onClick={save} className="px-6 h-11 rounded-full bg-ink text-paper font-medium shadow-lift hover:opacity-90">
            Zapisz wybór
          </button>
        </div>
      </main>
    </div>
  );
}