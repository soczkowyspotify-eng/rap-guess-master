import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/app-header";
import { addYtTrack, deleteYtTrack, updateYtTrack, verifyAdmin, addYtAlbum, deleteYtAlbum, updateYtAlbum, addAnnouncement, deleteAnnouncement, toggleAnnouncement, deleteSuggestion, upsertLegacyOverride, resetLegacyOverride } from "@/server/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { loadYtTracks, loadYtAlbums, loadLegacyOverrides } from "@/lib/yt-pool";
import { RAW_LEGACY_SONGS } from "@/data/songs";
import { Trash2, Lock, Plus, Music, Disc3, X, Pencil, Megaphone, Eye, EyeOff, Lightbulb, ExternalLink, Youtube, Search, Play, Archive, EyeOff as EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { fetchFromYoutube, type YtFetchedTrack } from "@/server/youtube.functions";

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

function formatSec(s: number): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return m > 0 ? `${m}:${String(ss).padStart(2, "0")}` : String(ss);
}

interface Row { id: string; video_id: string; artist: string; title: string; created_at: string; }
interface AlbumRow {
  id: string; cover_url: string; artist: string; title: string; year: number | null; created_at: string;
  recommended: boolean;
  yt_album_tracks: { id: string; video_id: string; artist: string; title: string; position: number; start_sec: number }[];
}
interface AnnouncementRow {
  id: string; title: string; body: string; image_url: string | null; active: boolean; created_at: string;
}
interface SuggestionRow {
  id: string; artist: string; title: string; link: string | null; created_at: string;
}

type Tab = "tracks" | "albums" | "announcements" | "suggestions" | "ytimport" | "legacy";

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
  const addAnn = useServerFn(addAnnouncement);
  const delAnn = useServerFn(deleteAnnouncement);
  const togAnn = useServerFn(toggleAnnouncement);
  const delSug = useServerFn(deleteSuggestion);
  const ytFetch = useServerFn(fetchFromYoutube);
  const upsertOvr = useServerFn(upsertLegacyOverride);
  const resetOvr = useServerFn(resetLegacyOverride);

  const [tab, setTab] = useState<Tab>("tracks");

  const [link, setLink] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [albumRows, setAlbumRows] = useState<AlbumRow[]>([]);
  const [annRows, setAnnRows] = useState<AnnouncementRow[]>([]);
  const [sugRows, setSugRows] = useState<SuggestionRow[]>([]);

  // ===== Legacy overrides state =====
  const [legacyOverrides, setLegacyOverrides] = useState<Record<string, { start_sec: number; hidden: boolean }>>({});
  const [legacyEdits, setLegacyEdits] = useState<Record<string, { startSec: string; hidden: boolean }>>({});
  const [legacySearch, setLegacySearch] = useState("");
  const [legacySavingId, setLegacySavingId] = useState<string | null>(null);

  // ===== YT Import state =====
  type ImportRow = YtFetchedTrack & { include: boolean; startSec: string };
  const [ytLink, setYtLink] = useState("");
  const [ytFetching, setYtFetching] = useState(false);
  const [ytKind, setYtKind] = useState<"video" | "playlist" | null>(null);
  const [ytRows, setYtRows] = useState<ImportRow[]>([]);
  const [ytAlbum, setYtAlbum] = useState<{ title: string; artist: string; cover_url: string; year: string; recommended: boolean }>({ title: "", artist: "", cover_url: "", year: "", recommended: false });
  const [ytPreview, setYtPreview] = useState<string | null>(null); // video_id
  const [ytSaving, setYtSaving] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annImage, setAnnImage] = useState("");
  const [annActive, setAnnActive] = useState(true);
  const [savingAnn, setSavingAnn] = useState(false);

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
    const { data: ann } = await supabase
      .from("announcements")
      .select("id, title, body, image_url, active, created_at")
      .order("created_at", { ascending: false });
    setAnnRows((ann ?? []) as AnnouncementRow[]);
    const { data: sug } = await (supabase as any)
      .from("track_suggestions")
      .select("id, artist, title, link, created_at")
      .order("created_at", { ascending: false });
    setSugRows((sug ?? []) as SuggestionRow[]);
    const { data: ovr } = await (supabase as any)
      .from("legacy_song_overrides")
      .select("song_id, start_sec, hidden");
    const map: Record<string, { start_sec: number; hidden: boolean }> = {};
    for (const r of (ovr ?? [])) map[r.song_id] = { start_sec: r.start_sec ?? 0, hidden: !!r.hidden };
    setLegacyOverrides(map);
    const edits: Record<string, { startSec: string; hidden: boolean }> = {};
    for (const sId of Object.keys(map)) {
      const o = map[sId];
      edits[sId] = { startSec: o.start_sec ? formatSec(o.start_sec) : "", hidden: o.hidden };
    }
    setLegacyEdits(edits);
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

  const onAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) {
      toast.error("Uzupełnij tytuł i treść"); return;
    }
    setSavingAnn(true);
    try {
      await addAnn({ data: {
        password: pw,
        title: annTitle.trim(),
        body: annBody.trim(),
        image_url: annImage.trim() || null,
        active: annActive,
      } });
      toast.success("Ogłoszenie zapisane");
      setAnnTitle(""); setAnnBody(""); setAnnImage(""); setAnnActive(true);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd");
    } finally { setSavingAnn(false); }
  };

  const onDeleteAnnouncement = async (id: string) => {
    if (!confirm("Usunąć to ogłoszenie?")) return;
    try {
      await delAnn({ data: { password: pw, id } });
      await refresh();
      toast.success("Usunięto");
    } catch (err: any) { toast.error(err?.message ?? "Błąd"); }
  };

  const onToggleAnnouncement = async (id: string, active: boolean) => {
    try {
      await togAnn({ data: { password: pw, id, active } });
      await refresh();
    } catch (err: any) { toast.error(err?.message ?? "Błąd"); }
  };

  const onDeleteSuggestion = async (id: string) => {
    if (!confirm("Usunąć tę propozycję?")) return;
    try {
      await delSug({ data: { password: pw, id } });
      await refresh();
      toast.success("Usunięto");
    } catch (err: any) { toast.error(err?.message ?? "Błąd"); }
  };

  // ===== Legacy overrides handlers =====
  const setLegacyEdit = (songId: string, patch: Partial<{ startSec: string; hidden: boolean }>) => {
    setLegacyEdits((p) => ({
      ...p,
      [songId]: { startSec: p[songId]?.startSec ?? "", hidden: p[songId]?.hidden ?? false, ...patch },
    }));
  };

  const onSaveLegacy = async (songId: string) => {
    const e = legacyEdits[songId] ?? { startSec: "", hidden: false };
    const start_sec = parseStart(e.startSec);
    setLegacySavingId(songId);
    try {
      if (start_sec === 0 && !e.hidden) {
        // Nic nie nadpisujemy → reset
        if (legacyOverrides[songId]) {
          await resetOvr({ data: { password: pw, song_id: songId } });
        }
      } else {
        await upsertOvr({ data: { password: pw, song_id: songId, start_sec, hidden: e.hidden } });
      }
      await refresh();
      await loadLegacyOverrides();
      toast.success("Zapisano");
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd");
    } finally { setLegacySavingId(null); }
  };

  const onResetLegacy = async (songId: string) => {
    setLegacySavingId(songId);
    try {
      await resetOvr({ data: { password: pw, song_id: songId } });
      await refresh();
      await loadLegacyOverrides();
      toast.success("Zresetowano");
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd");
    } finally { setLegacySavingId(null); }
  };

  // ===== YT Import handlers =====
  const onYtFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytLink.trim()) { toast.error("Wklej link YouTube"); return; }
    setYtFetching(true);
    setYtPreview(null);
    try {
      const res = await ytFetch({ data: { password: pw, link: ytLink.trim() } });
      setYtKind(res.type);
      setYtRows(res.tracks.map((t) => ({ ...t, include: true, startSec: "" })));
      if (res.type === "playlist" && res.albumMeta) {
        setYtAlbum({
          title: res.albumMeta.title,
          artist: res.albumMeta.artist,
          cover_url: res.albumMeta.cover_url,
          year: res.albumMeta.year ? String(res.albumMeta.year) : "",
          recommended: false,
        });
      } else {
        setYtAlbum({ title: "", artist: "", cover_url: "", year: "", recommended: false });
      }
      toast.success(res.type === "playlist" ? `Pobrano album (${res.tracks.length} tracków)` : "Pobrano utwór");
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd pobierania z YouTube");
    } finally { setYtFetching(false); }
  };

  const updateYtRow = (i: number, key: keyof ImportRow, val: any) => {
    setYtRows((p) => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  };

  const onYtClear = () => {
    setYtKind(null); setYtRows([]); setYtPreview(null); setYtLink("");
    setYtAlbum({ title: "", artist: "", cover_url: "", year: "", recommended: false });
  };

  const onYtSaveTracks = async () => {
    const sel = ytRows.filter((r) => r.include && r.artist.trim() && r.parsedTitle.trim());
    if (!sel.length) { toast.error("Zaznacz przynajmniej jeden track z wypełnionymi polami"); return; }
    setYtSaving(true);
    let ok = 0, fail = 0;
    for (const r of sel) {
      try {
        await add({ data: { password: pw, link: r.video_id, artist: r.artist.trim(), title: r.parsedTitle.trim() } });
        ok++;
      } catch { fail++; }
    }
    setYtSaving(false);
    toast[fail ? "warning" : "success"](`Zapisano ${ok}${fail ? `, błędów: ${fail}` : ""}`);
    await refresh(); await loadYtTracks();
    if (!fail) onYtClear();
  };

  const onYtSaveAlbum = async () => {
    const sel = ytRows.filter((r) => r.include && r.artist.trim() && r.parsedTitle.trim());
    if (!sel.length) { toast.error("Zaznacz przynajmniej jeden track"); return; }
    if (!ytAlbum.cover_url.trim() || !ytAlbum.artist.trim() || !ytAlbum.title.trim()) {
      toast.error("Uzupełnij okładkę, artystę i tytuł albumu"); return;
    }
    setYtSaving(true);
    try {
      await addAlb({ data: {
        password: pw,
        cover_url: ytAlbum.cover_url.trim(),
        artist: ytAlbum.artist.trim(),
        title: ytAlbum.title.trim(),
        year: ytAlbum.year ? Number(ytAlbum.year) : null,
        recommended: ytAlbum.recommended,
        tracks: sel.map((r) => ({ link: r.video_id, artist: r.artist.trim(), title: r.parsedTitle.trim(), start_sec: parseStart(r.startSec) })),
      } });
      toast.success("Album dodany");
      await refresh(); await loadYtAlbums();
      onYtClear();
    } catch (err: any) {
      toast.error(err?.message ?? "Błąd zapisu albumu");
    } finally { setYtSaving(false); }
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
            <button
              onClick={() => setTab("announcements")}
              className={`px-5 h-10 rounded-full text-sm inline-flex items-center gap-2 transition ${tab === "announcements" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
            ><Megaphone className="h-4 w-4" /> Popup</button>
            <button
              onClick={() => setTab("suggestions")}
              className={`px-5 h-10 rounded-full text-sm inline-flex items-center gap-2 transition ${tab === "suggestions" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
            ><Lightbulb className="h-4 w-4" /> Propozycje{sugRows.length > 0 && <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] rounded-full bg-primary text-paper">{sugRows.length}</span>}</button>
            <button
              onClick={() => setTab("ytimport")}
              className={`px-5 h-10 rounded-full text-sm inline-flex items-center gap-2 transition ${tab === "ytimport" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
            ><Youtube className="h-4 w-4" /> YT Import <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">BETA</span></button>
            <button
              onClick={() => setTab("legacy")}
              className={`px-5 h-10 rounded-full text-sm inline-flex items-center gap-2 transition ${tab === "legacy" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"}`}
            ><Archive className="h-4 w-4" /> Legacy</button>
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
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[28px_1fr_1fr_1fr_80px_36px] gap-2 items-center">
                    <div className="text-sm font-mono text-ink-muted text-center">{i + 1}.</div>
                    <input value={t.link} onChange={(e) => updateTrack(i, "link", e.target.value)} placeholder="Link YT Music" className="h-10 px-3 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                    <input value={t.artist} onChange={(e) => updateTrack(i, "artist", e.target.value)} placeholder="Artyści (po przecinku)" className="h-10 px-3 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                    <input value={t.title} onChange={(e) => updateTrack(i, "title", e.target.value)} placeholder="Tytuł" className="h-10 px-3 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                    <input value={t.start_sec} onChange={(e) => updateTrack(i, "start_sec", e.target.value)} placeholder="0:08" title="Offset startu (sekundy lub mm:ss)" className="h-10 px-2 rounded-lg border border-hairline bg-paper outline-none focus:border-primary text-sm font-mono text-center" />
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

        {tab === "announcements" && (<>
          <form onSubmit={onAddAnnouncement} className="rounded-3xl border border-hairline p-5 sm:p-6 space-y-3 bg-card">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5" /> Nowy popup dla użytkowników
            </p>
            <input
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Tytuł"
              className="w-full h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
            />
            <textarea
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              placeholder="Tekst ogłoszenia (możesz wstawiać nowe linie)"
              rows={5}
              className="w-full px-3 py-2 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm resize-y"
            />
            <input
              value={annImage}
              onChange={(e) => setAnnImage(e.target.value)}
              placeholder="URL grafiki (opcjonalnie)"
              className="w-full h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
            />
            {annImage && (
              <img src={annImage} alt="" className="max-h-40 rounded-xl border border-hairline object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
            )}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={annActive} onChange={(e) => setAnnActive(e.target.checked)} className="h-4 w-4 accent-primary" />
                <span>Aktywne (pokazuj userom)</span>
              </label>
              <button type="submit" disabled={savingAnn} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40">
                <Plus className="h-4 w-4" /> {savingAnn ? "Zapisuję…" : "Opublikuj"}
              </button>
            </div>
            <p className="text-xs text-ink-muted">Najnowsze aktywne ogłoszenie pokaże się każdemu userowi raz (po jego zamknięciu nie wróci).</p>
          </form>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{annRows.length} {annRows.length === 1 ? "ogłoszenie" : "ogłoszeń"}</h2>
              <button onClick={refresh} className="text-xs text-ink-muted hover:text-ink underline underline-offset-4">Odśwież</button>
            </div>
            <ul className="space-y-3">
              {annRows.length === 0 && (
                <li className="rounded-2xl border border-hairline px-4 py-8 text-center text-sm text-ink-muted">Brak ogłoszeń.</li>
              )}
              {annRows.map((a) => (
                <li key={a.id} className={`rounded-2xl border p-4 bg-paper flex gap-3 items-start ${a.active ? "border-primary/40" : "border-hairline opacity-70"}`}>
                  {a.image_url && <img src={a.image_url} alt="" className="h-16 w-16 rounded-lg object-cover bg-card shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-2">
                      {a.title}
                      {a.active && <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-paper">Live</span>}
                    </div>
                    <div className="text-sm text-ink-muted line-clamp-2 whitespace-pre-line">{a.body}</div>
                  </div>
                  <button onClick={() => onToggleAnnouncement(a.id, !a.active)} className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-muted transition" aria-label="Przełącz">
                    {a.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => onDeleteAnnouncement(a.id)} className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-primary hover:bg-muted transition" aria-label="Usuń">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>)}

        {tab === "suggestions" && (<>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">{sugRows.length} {sugRows.length === 1 ? "propozycja" : "propozycji"} od userów</h2>
              <button onClick={refresh} className="text-xs text-ink-muted hover:text-ink underline underline-offset-4">Odśwież</button>
            </div>
            <ul className="space-y-2">
              {sugRows.length === 0 && (
                <li className="rounded-2xl border border-hairline px-4 py-8 text-center text-sm text-ink-muted">Brak propozycji.</li>
              )}
              {sugRows.map((s) => (
                <li key={s.id} className="rounded-2xl border border-hairline p-4 bg-paper flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-sm text-ink-muted truncate">{s.artist}</div>
                    <div className="text-[11px] font-mono text-ink-muted mt-1">{new Date(s.created_at).toLocaleString("pl-PL")}</div>
                  </div>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-ink hover:bg-muted transition" aria-label="Otwórz link">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button onClick={() => onDeleteSuggestion(s.id)} className="h-9 w-9 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-primary hover:bg-muted transition" aria-label="Usuń">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>)}

        {tab === "ytimport" && (<>
          <div className="rounded-3xl border border-hairline p-5 sm:p-6 bg-card space-y-3">
            <div className="flex items-start gap-3">
              <Youtube className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-ink-muted">
                Wklej link do <strong>filmu YouTube</strong> (pojedynczy track) lub <strong>playlisty/albumu</strong> (np. z YouTube Music — link zaczyna się od <code className="font-mono text-xs">OLAK5uy_...</code>). System pobierze tytuł, artystę, okładkę i listę tracków. <strong>Sprawdź wszystko przed zapisem</strong> — heurystyka splitu „Artist - Title" nie zawsze trafia.
              </div>
            </div>
            <form onSubmit={onYtFetch} className="flex gap-2">
              <input
                value={ytLink}
                onChange={(e) => setYtLink(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... lub https://music.youtube.com/playlist?list=OLAK5uy_..."
                className="flex-1 h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
              />
              <button type="submit" disabled={ytFetching} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40">
                <Search className="h-4 w-4" /> {ytFetching ? "Pobieram…" : "Pobierz"}
              </button>
            </form>
          </div>

          {ytKind && ytRows.length > 0 && (
            <>
              {ytKind === "playlist" && (
                <section className="rounded-3xl border border-hairline p-5 sm:p-6 bg-card space-y-3">
                  <h3 className="font-display text-lg flex items-center gap-2"><Disc3 className="h-4 w-4" /> Metadane albumu</h3>
                  <div className="flex gap-4">
                    {ytAlbum.cover_url && <img src={ytAlbum.cover_url} alt="" className="h-24 w-24 rounded-xl object-cover bg-paper border border-hairline shrink-0" />}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input value={ytAlbum.title} onChange={(e) => setYtAlbum((p) => ({ ...p, title: e.target.value }))} placeholder="Tytuł albumu" className="h-10 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                      <input value={ytAlbum.artist} onChange={(e) => setYtAlbum((p) => ({ ...p, artist: e.target.value }))} placeholder="Artysta" className="h-10 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                      <input value={ytAlbum.cover_url} onChange={(e) => setYtAlbum((p) => ({ ...p, cover_url: e.target.value }))} placeholder="URL okładki" className="h-10 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm md:col-span-2 font-mono text-xs" />
                      <input value={ytAlbum.year} onChange={(e) => setYtAlbum((p) => ({ ...p, year: e.target.value.replace(/\D/g, "") }))} placeholder="Rok" className="h-10 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm" />
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={ytAlbum.recommended} onChange={(e) => setYtAlbum((p) => ({ ...p, recommended: e.target.checked }))} />
                        Polecany
                      </label>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg">{ytRows.length} {ytRows.length === 1 ? "track" : "tracków"} z YT</h3>
                  <button onClick={onYtClear} className="text-xs text-ink-muted hover:text-ink underline underline-offset-4">Wyczyść</button>
                </div>
                <ul className="space-y-2">
                  {ytRows.map((r, i) => (
                    <li key={r.video_id + i} className={`rounded-2xl border p-3 bg-paper ${r.include ? "border-hairline" : "border-hairline/40 opacity-50"}`}>
                      <div className="flex gap-3 items-start">
                        <input type="checkbox" checked={r.include} onChange={(e) => updateYtRow(i, "include", e.target.checked)} className="mt-2" />
                        <img src={r.thumbnail} alt="" className="h-14 w-14 rounded-lg object-cover bg-card shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="text-[11px] font-mono text-ink-muted truncate" title={r.title}>YT: {r.title} · <span className="opacity-70">{r.channel}</span></div>
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_80px] gap-1.5">
                            <input value={r.artist} onChange={(e) => updateYtRow(i, "artist", e.target.value)} placeholder="Artysta" className="h-9 px-2.5 rounded-lg border border-hairline bg-card outline-none focus:border-primary text-sm" />
                            <input value={r.parsedTitle} onChange={(e) => updateYtRow(i, "parsedTitle", e.target.value)} placeholder="Tytuł" className="h-9 px-2.5 rounded-lg border border-hairline bg-card outline-none focus:border-primary text-sm" />
                            {ytKind === "playlist" && (
                              <input value={r.startSec} onChange={(e) => updateYtRow(i, "startSec", e.target.value)} placeholder="Start (s)" title="Sekunda startu sample'a (opcjonalnie)" className="h-9 px-2.5 rounded-lg border border-hairline bg-card outline-none focus:border-primary text-sm font-mono" />
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setYtPreview(ytPreview === r.video_id ? null : r.video_id)}
                          className={`h-9 w-9 rounded-full inline-flex items-center justify-center shrink-0 transition ${ytPreview === r.video_id ? "bg-primary text-paper" : "text-ink-muted hover:text-ink hover:bg-muted"}`}
                          aria-label="Odsłuchaj"
                          title="Odsłuchaj"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                      {ytPreview === r.video_id && (
                        <div className="mt-3 rounded-xl overflow-hidden bg-black aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${r.video_id}?autoplay=1`}
                            title={r.title}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="sticky bottom-4 flex justify-end gap-2 z-10">
                <button onClick={onYtClear} className="px-5 h-11 rounded-full border border-hairline bg-card text-sm hover:bg-muted">Anuluj</button>
                {ytKind === "video" ? (
                  <button onClick={onYtSaveTracks} disabled={ytSaving} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40 shadow-lg">
                    <Plus className="h-4 w-4" /> {ytSaving ? "Zapisuję…" : `Zapisz jako track${ytRows.filter(r => r.include).length > 1 ? "i" : ""}`}
                  </button>
                ) : (
                  <>
                    <button onClick={onYtSaveTracks} disabled={ytSaving} className="inline-flex items-center gap-2 px-5 h-11 rounded-full border border-hairline bg-card text-sm font-medium hover:bg-muted disabled:opacity-40">
                      <Music className="h-4 w-4" /> Zapisz jako pojedyncze tracki
                    </button>
                    <button onClick={onYtSaveAlbum} disabled={ytSaving} className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 disabled:opacity-40 shadow-lg">
                      <Disc3 className="h-4 w-4" /> {ytSaving ? "Zapisuję…" : "Zapisz jako album"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </>)}
      </main>
    </div>
  );
}