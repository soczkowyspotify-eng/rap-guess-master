import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { addYtTrack, deleteYtTrack, updateYtTrack, verifyAdmin, addYtAlbum, deleteYtAlbum, updateYtAlbum } from "@/server/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { loadYtTracks, loadYtAlbums } from "@/lib/yt-pool";
import { Trash2, Lock, Plus, Music, Disc3, X, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin — RAP GUESSER" },
    { name: "description", content: "Panel admina: dodawanie tracków YouTube Music do bazy gry." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminPage,
});

const PW_KEY = "rg.admin.pw";

function extractVid(input: string): string | null {
  const t = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;
  const m = t.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function parseStart(input: string): number {
  const t = input.trim();
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Math.max(0, parseInt(t, 10));
  const m = t.match(/^(\d+):(\d{1,2})$/);
  if (m) return Math.max(0, parseInt(m[1], 10) * 60 + parseInt(m[2], 10));
  return 0;
}

interface Row { id: string; video_id: string; artist: string; title: string; created_at: string; }
interface AlbumRow {
  id: string; cover_url: string; artist: string; title: string; year: number | null; created_at: string;
  recommended: boolean;
  yt_album_tracks: { id: string; video_id: string; artist: string; title: string; position: number; start_sec: number }[];
}

type Tab = "tracks" | "albums";

function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verify = useServerFn(verifyAdmin);
  const add = useServerFn(addYtTrack);
  const del = useServerFn(deleteYtTrack);
  const updTrk = useServerFn(updateYtTrack);
  const addAlb = useServerFn(addYtAlbum);
  const delAlb = useServerFn(deleteYtAlbum);
  const updAlb = useServerFn(updateYtAlbum);

  const [tab, setTab] = useState<Tab>("tracks");

  const [link, setLink] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [albumRows, setAlbumRows] = useState<AlbumRow[]>([]);

  // Album form state
  const [aCover, setACover] = useState("");
  const [aArtist, setAArtist] = useState("");
  const [aTitle, setATitle] = useState("");
  const [aYear, setAYear] = useState<string>("");
  const [aRecommended, setARecommended] = useState(false);
  const [aTracks, setATracks] = useState<{ link: string; artist: string; title: string; start_sec: string }[]>([
    { link: "", artist: "", title: "", start_sec: "" },
  ]);
  const [addingAlbum, setAddingAlbum] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto-login z localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(PW_KEY) : null;
    if (!saved) return;
    setPw(saved);
    verify({ data: { password: saved } })
      .then(() => setAuthed(true))
      .catch(() => localStorage.removeItem(PW_KEY));
  }, [verify]);

  const refresh = async () => {
    const { data: t } = await supabase
      .from("yt_tracks")
      .select("id, video_id, artist, title, created_at")
      .order("created_at", { ascending: false });
    setRows((t ?? []) as Row[]);
    const { data: a } = await supabase
      .from("yt_albums")
      .select("id, cover_url, artist, title, year, recommended, created_at, yt_album_tracks(id, video_id, artist, title, position, start_sec)")
      .order("created_at", { ascending: false });
    setAlbumRows((a ?? []) as unknown as AlbumRow[]);
  };

  useEffect(() => { if (authed) refresh(); }, [authed]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await verify({ data: { password: pw } });
      localStorage.setItem(PW_KEY, pw);
      setAuthed(true);
      toast.success("Zalogowano");
    } catch (err: any) {
      toast.error(err?.message ?? "Złe hasło");
    } finally { setVerifying(false); }
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim() || !artist.trim() || !title.trim()) {
      toast.error("Uzupełnij wszystkie pola"); return;
    }
    setAdding(true);
    try {
      if (editingTrackId) {
        await updTrk({ data: { password: pw, id: editingTrackId, link, artist, title } });
        toast.success("Zapisano zmiany");
      } else {
        await add({ data: { password: pw, link, artist, title } });
        toast.success("Dodano");
      }
      resetTrackForm();
      await refresh();
      await loadYtTracks();
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd dodawania");
    } finally { setAdding(false); }
  };

  const resetTrackForm = () => {
    setEditingTrackId(null);
    setLink(""); setArtist(""); setTitle("");
  };

  const onEditTrack = (r: Row) => {
    setEditingTrackId(r.id);
    setLink(`https://music.youtube.com/watch?v=${r.video_id}`);
    setArtist(r.artist);
    setTitle(r.title);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Usunąć ten track?")) return;
    try {
      await del({ data: { password: pw, id } });
      await refresh();
      await loadYtTracks();
      toast.success("Usunięto");
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd");
    }
  };

  const onAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aCover.trim() || !aArtist.trim() || !aTitle.trim()) {
      toast.error("Uzupełnij okładkę, artystę i tytuł albumu"); return;
    }
    const tracks = aTracks
      .map((t) => ({ link: t.link.trim(), artist: t.artist.trim(), title: t.title.trim(), start_sec: parseStart(t.start_sec) }))
      .filter((t) => t.link && t.artist && t.title);
    if (!tracks.length) { toast.error("Dodaj przynajmniej jeden track"); return; }
    const ids = tracks.map((t) => extractVid(t.link)).filter(Boolean) as string[];
    const dupIdx = ids.findIndex((id, i) => ids.indexOf(id) !== i);
    if (dupIdx !== -1) {
      const first = ids.indexOf(ids[dupIdx]);
      toast.error(`Duplikat linku: track #${first + 1} i #${dupIdx + 1} mają ten sam film`);
      return;
    }
    setAddingAlbum(true);
    try {
      if (editingId) {
        await updAlb({ data: {
          password: pw, id: editingId,
          cover_url: aCover.trim(), artist: aArtist.trim(), title: aTitle.trim(),
          year: aYear ? Number(aYear) : null, recommended: aRecommended, tracks,
        } });
        toast.success("Album zaktualizowany");
      } else {
        await addAlb({ data: {
          password: pw,
          cover_url: aCover.trim(),
          artist: aArtist.trim(),
          title: aTitle.trim(),
          year: aYear ? Number(aYear) : null,
          recommended: aRecommended,
          tracks,
        } });
        toast.success("Album dodany");
      }
      resetAlbumForm();
      await refresh();
      await loadYtAlbums();
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd");
    } finally { setAddingAlbum(false); }
  };

  const resetAlbumForm = () => {
    setEditingId(null);
    setACover(""); setAArtist(""); setATitle(""); setAYear("");
    setARecommended(false);
    setATracks([{ link: "", artist: "", title: "", start_sec: "" }]);
  };

  const onEditAlbum = (a: AlbumRow) => {
    setEditingId(a.id);
    setACover(a.cover_url);
    setAArtist(a.artist);
    setATitle(a.title);
    setAYear(a.year ? String(a.year) : "");
    setARecommended(!!a.recommended);
    const sorted = [...(a.yt_album_tracks ?? [])].sort((x, y) => x.position - y.position);
    setATracks(sorted.length
      ? sorted.map((t) => ({ link: `https://music.youtube.com/watch?v=${t.video_id}`, artist: t.artist, title: t.title, start_sec: t.start_sec ? String(t.start_sec) : "" }))
      : [{ link: "", artist: "", title: "", start_sec: "" }]);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDeleteAlbum = async (id: string) => {
    if (!confirm("Usunąć ten album wraz z trackami?")) return;
    try {
      await delAlb({ data: { password: pw, id } });
      await refresh();
      await loadYtAlbums();
      toast.success("Usunięto");
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd");
    }
  };

  const updateTrack = (idx: number, key: "link" | "artist" | "title" | "start_sec", val: string) => {
    setATracks((prev) => prev.map((t, i) => i === idx ? { ...t, [key]: val } : t));
  };
  const addTrackRow = () => setATracks((p) => [...p, { link: "", artist: "", title: "", start_sec: "" }]);
  const removeTrackRow = (idx: number) => setATracks((p) => p.length > 1 ? p.filter((_, i) => i !== idx) : p);

  if (!authed) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader />
        <main className="max-w-md mx-auto px-6 py-20">
          <div className="text-center mb-8 space-y-2">
            <Lock className="h-8 w-8 mx-auto text-ink-muted" />
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Admin</p>
            <h1 className="font-display text-3xl">Hasło wymagane</h1>
          </div>
          <form onSubmit={onLogin} className="space-y-3">
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Hasło admina"
              className="w-full h-12 px-4 rounded-2xl border border-hairline bg-card outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={verifying || !pw}
              className="w-full h-12 rounded-2xl bg-ink text-paper font-medium hover:opacity-90 disabled:opacity-40"
            >
              {verifying ? "Sprawdzam…" : "Zaloguj"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Admin · YouTube Music</p>
          <h1 className="font-display text-3xl md:text-4xl">Panel admina</h1>
          <p className="text-sm text-ink-muted">Dodaj artystów po przecinku, np. <em>Otsochodzi, Żabson</em>.</p>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-hairline p-1 bg-card">
            <button
              onClick={() => setTab("tracks")}
              className={`px-5 h-10 rounded-full text-sm inline-flex items-center gap-2 transition ${tab === "tracks" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
            ><Music className="h-4 w-4" /> Tracki</button>
            <button
              onClick={() => setTab("albums")}
              className={`px-5 h-10 rounded-full text-sm inline-flex items-center gap-2 transition ${tab === "albums" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
            ><Disc3 className="h-4 w-4" /> Albumy</button>
          </div>
        </div>

        {tab === "tracks" && (<>
        <form onSubmit={onAdd} className="rounded-3xl border border-hairline p-5 sm:p-6 space-y-3 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Link YouTube Music"
              className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
            />
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artyści (po przecinku)"
              className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tytuł"
              className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-ink-muted">Najlepiej linki z <strong>music.youtube.com</strong> (brak intra teledysku).</p>
            <div className="flex gap-2">
              {editingTrackId && (
                <button type="button" onClick={resetTrackForm} className="inline-flex items-center gap-2 px-5 h-11 rounded-full border border-hairline text-sm font-medium hover:bg-muted">
                  Anuluj
                </button>
              )}
              <button
                type="submit"
                disabled={adding}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> {adding ? (editingTrackId ? "Zapisuję…" : "Dodaję…") : (editingTrackId ? "Zapisz zmiany" : "Dodaj")}
              </button>
            </div>
          </div>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">{rows.length} {rows.length === 1 ? "track" : "tracków"}</h2>
            <button onClick={refresh} className="text-xs text-ink-muted hover:text-ink underline underline-offset-4">Odśwież</button>
          </div>
          <ul className="rounded-2xl border border-hairline divide-y divide-hairline overflow-hidden">
            {rows.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">Brak tracków. Dodaj pierwszy powyżej.</li>
            )}
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3 flex items-center gap-3 bg-paper">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-sm text-ink-muted truncate">{r.artist}</div>
                </div>
                <a
                  href={`https://music.youtube.com/watch?v=${r.video_id}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs font-mono text-ink-muted hover:text-ink truncate hidden sm:block max-w-[160px]"
                >
                  {r.video_id}
                </a>
                <button
                  onClick={() => onEditTrack(r)}
                  className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-muted transition"
                  aria-label="Edytuj"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(r.id)}
                  className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-primary hover:bg-muted transition"
                  aria-label="Usuń"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
        </>)}

        {tab === "albums" && (<>
          <form onSubmit={onAddAlbum} className="rounded-3xl border border-hairline p-5 sm:p-6 space-y-4 bg-card">
            <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-start">
              <div className="space-y-2">
                <div className="aspect-square rounded-xl border border-hairline overflow-hidden bg-paper">
                  {aCover ? (
                    <img src={aCover} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">Okładka</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input value={aCover} onChange={(e) => setACover(e.target.value)} placeholder="URL okładki (grafika)" className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px] gap-3">
                  <input value={aArtist} onChange={(e) => setAArtist(e.target.value)} placeholder="Artysta albumu (po przecinku)" className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                  <input value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="Tytuł albumu" className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                  <input value={aYear} onChange={(e) => setAYear(e.target.value)} placeholder="Rok" inputMode="numeric" className="h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                </div>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="checkbox" checked={aRecommended} onChange={(e) => setARecommended(e.target.checked)} className="h-4 w-4 accent-primary" />
                  <span>Rekomendujemy ten album ⭐</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Tracki</p>
                <button type="button" onClick={addTrackRow} className="text-xs inline-flex items-center gap-1 text-ink-muted hover:text-ink">
                  <Plus className="h-3 w-3" /> Dodaj track
                </button>
              </div>
              <div className="space-y-2">
                {aTracks.map((t, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[28px_1fr_1fr_1fr_36px] gap-2 items-center">
                    <div className="text-sm font-mono text-ink-muted text-center">{i + 1}.</div>
                    <input value={t.link} onChange={(e) => updateTrack(i, "link", e.target.value)} placeholder="Link YT Music" className="h-10 px-3 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                    <input value={t.artist} onChange={(e) => updateTrack(i, "artist", e.target.value)} placeholder="Artyści (po przecinku)" className="h-10 px-3 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                    <input value={t.title} onChange={(e) => updateTrack(i, "title", e.target.value)} placeholder="Tytuł" className="h-10 px-3 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                    <button type="button" onClick={() => removeTrackRow(i)} className="h-10 w-9 rounded-lg inline-flex items-center justify-center text-ink-muted hover:text-primary hover:bg-muted" aria-label="Usuń">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="flex gap-2">
                {editingId && (
                  <button type="button" onClick={resetAlbumForm} className="inline-flex items-center gap-2 px-5 h-11 rounded-full border border-hairline text-sm font-medium hover:bg-muted">
                    Anuluj
                  </button>
                )}
                <button type="submit" disabled={addingAlbum} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40">
                  <Plus className="h-4 w-4" /> {addingAlbum ? (editingId ? "Zapisuję…" : "Dodaję…") : (editingId ? "Zapisz zmiany" : "Dodaj album")}
                </button>
              </div>
            </div>
          </form>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{albumRows.length} {albumRows.length === 1 ? "album" : "albumów"}</h2>
              <button onClick={refresh} className="text-xs text-ink-muted hover:text-ink underline underline-offset-4">Odśwież</button>
            </div>
            <ul className="space-y-3">
              {albumRows.length === 0 && (
                <li className="rounded-2xl border border-hairline px-4 py-8 text-center text-sm text-ink-muted">Brak albumów.</li>
              )}
              {albumRows.map((a) => (
                <li key={a.id} className={`rounded-2xl border p-3 bg-paper flex items-center gap-3 ${editingId === a.id ? "border-primary" : "border-hairline"}`}>
                  <img src={a.cover_url} alt="" className="h-16 w-16 rounded-lg object-cover bg-card" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-2">
                      {a.title}
                      {a.recommended && <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-paper">Polecany</span>}
                    </div>
                    <div className="text-sm text-ink-muted truncate">{a.artist}{a.year ? ` · ${a.year}` : ""}</div>
                    <div className="text-xs text-ink-muted mt-1">{a.yt_album_tracks?.length ?? 0} tracków</div>
                  </div>
                  <button onClick={() => onEditAlbum(a)} className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-muted transition" aria-label="Edytuj">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDeleteAlbum(a.id)} className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-primary hover:bg-muted transition" aria-label="Usuń">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>)}
      </main>
    </div>
  );
}