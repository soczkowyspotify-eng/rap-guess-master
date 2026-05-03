import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { addYtTrack, deleteYtTrack, verifyAdmin } from "@/server/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { loadYtTracks } from "@/lib/yt-pool";
import { Trash2, Lock, Plus } from "lucide-react";
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

interface Row { id: string; video_id: string; artist: string; title: string; created_at: string; }

function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const verify = useServerFn(verifyAdmin);
  const add = useServerFn(addYtTrack);
  const del = useServerFn(deleteYtTrack);

  const [link, setLink] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const [rows, setRows] = useState<Row[]>([]);

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
    const { data } = await supabase
      .from("yt_tracks")
      .select("id, video_id, artist, title, created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
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
      await add({ data: { password: pw, link, artist, title } });
      toast.success("Dodano");
      setLink(""); setArtist(""); setTitle("");
      await refresh();
      await loadYtTracks();
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd dodawania");
    } finally { setAdding(false); }
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
          <h1 className="font-display text-3xl md:text-4xl">Baza tracków</h1>
          <p className="text-sm text-ink-muted">Dodane tu utwory pojawiają się u wszystkich graczy w Daily, Endless i Albumach.</p>
        </div>

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
              placeholder="Artysta"
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
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> {adding ? "Dodaję…" : "Dodaj"}
            </button>
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
      </main>
    </div>
  );
}