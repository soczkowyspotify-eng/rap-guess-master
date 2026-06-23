import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { upsertLyricSnippet, deleteLyricSnippet, toggleLyricSnippet, bulkImportLyricSnippets } from "@/server/admin.functions";
import { allSongs, normalize } from "@/lib/game-data";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, EyeOff, Upload, Quote, X } from "lucide-react";

interface Row {
  id: string;
  track_id: string;
  artist: string;
  title: string;
  lines: string[];
  difficulty: "easy" | "normal" | "hard";
  active: boolean;
  created_at: string;
}

export function LyricsAdminPanel({ password }: { password: string }) {
  const upsert = useServerFn(upsertLyricSnippet);
  const del = useServerFn(deleteLyricSnippet);
  const tog = useServerFn(toggleLyricSnippet);
  const bulk = useServerFn(bulkImportLyricSnippets);

  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [trackId, setTrackId] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState<string[]>(["", "", "", ""]);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [preview, setPreview] = useState<Row | null>(null);

  const pool = useMemo(() => allSongs(), []);

  const refresh = async () => {
    const { data } = await supabase
      .from("lyric_snippets")
      .select("id, track_id, artist, title, lines, difficulty, active, created_at")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { void refresh(); }, []);

  const filtered = rows.filter(r => {
    if (!query.trim()) return true;
    const q = normalize(query);
    return normalize(r.artist).includes(q) || normalize(r.title).includes(q);
  });

  const matchedSongs = useMemo(() => {
    if (!songQuery.trim()) return [];
    const q = normalize(songQuery);
    return pool.filter(s => normalize(s.title).includes(q) || normalize(s.artist).includes(q)).slice(0, 6);
  }, [songQuery, pool]);

  const reset = () => {
    setEditing(null); setTrackId(""); setArtist(""); setTitle("");
    setLines(["", "", "", ""]); setDifficulty("normal"); setActive(true); setSongQuery("");
  };

  const onEdit = (r: Row) => {
    setEditing(r);
    setTrackId(r.track_id); setArtist(r.artist); setTitle(r.title);
    setLines([...r.lines, "", "", "", ""].slice(0, Math.max(4, r.lines.length)));
    setDifficulty(r.difficulty); setActive(r.active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSave = async () => {
    const cleanLines = lines.map(l => l.trim()).filter(Boolean);
    if (!trackId || !artist || !title || cleanLines.length === 0) {
      toast.error("Wybierz utwór i podaj przynajmniej 1 wers"); return;
    }
    setSaving(true);
    try {
      await upsert({ data: {
        password, id: editing?.id, track_id: trackId,
        artist, title, lines: cleanLines, difficulty, active,
      } });
      toast.success(editing ? "Zaktualizowano" : "Dodano wersy");
      reset();
      await refresh();
    } catch (err: any) { toast.error(err?.message ?? "Błąd"); }
    finally { setSaving(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Usunąć ten snippet?")) return;
    try { await del({ data: { password, id } }); await refresh(); toast.success("Usunięto"); }
    catch (err: any) { toast.error(err?.message ?? "Błąd"); }
  };

  const onToggle = async (id: string, next: boolean) => {
    try { await tog({ data: { password, id, active: next } }); await refresh(); }
    catch (err: any) { toast.error(err?.message ?? "Błąd"); }
  };

  const onImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) throw new Error("Oczekiwano tablicy");
      const items = parsed.map((p: any) => ({
        track_id: String(p.track_id ?? p.id ?? `${p.artist}-${p.title}`).slice(0, 200),
        artist: String(p.artist),
        title: String(p.title),
        lines: Array.isArray(p.lines) ? p.lines.map(String) : [],
        difficulty: (p.difficulty ?? "normal") as "easy" | "normal" | "hard",
      }));
      const res = await bulk({ data: { password, items } });
      toast.success(`Zaimportowano ${res.inserted}`);
      setImportJson(""); setImportOpen(false);
      await refresh();
    } catch (err: any) { toast.error(err?.message ?? "Niepoprawny JSON"); }
  };

  const pickSong = (s: { id: string; artist: string; title: string }) => {
    setTrackId(s.id); setArtist(s.artist); setTitle(s.title); setSongQuery("");
  };

  return (
    <div className="space-y-6">
      {/* FORM */}
      <div className="bg-card border border-hairline rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl flex items-center gap-2">
            <Quote className="h-5 w-5 text-primary" />
            {editing ? "Edytuj snippet" : "Dodaj snippet"}
          </h3>
          <button onClick={() => setImportOpen(o => !o)} className="text-sm px-3 h-8 rounded-full border border-hairline hover:border-ink inline-flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" /> Import JSON
          </button>
        </div>

        {importOpen && (
          <div className="border border-hairline rounded-2xl p-3 space-y-2 bg-paper">
            <p className="text-xs text-ink-muted">Format: <code>[{"{"}"artist":"...","title":"...","lines":["...","..."]{"}"}]</code></p>
            <textarea
              value={importJson} onChange={e => setImportJson(e.target.value)}
              rows={6} placeholder='[{"artist":"Mata","title":"Patointeligencja","lines":["...","..."]}]'
              className="w-full p-3 bg-card border border-hairline rounded-xl font-mono text-xs"
            />
            <button onClick={onImport} className="px-4 h-9 rounded-full bg-ink text-paper text-sm">Importuj</button>
          </div>
        )}

        <div>
          <label className="text-xs font-mono text-ink-muted">Utwór z bazy</label>
          <input
            value={songQuery || `${artist}${title ? " — " + title : ""}`.trim()}
            onChange={e => { setSongQuery(e.target.value); if (editing) setEditing(null); }}
            placeholder="Wpisz tytuł lub wykonawcę…"
            className="w-full h-11 px-3 bg-paper border border-hairline rounded-xl outline-none focus:border-primary"
          />
          {matchedSongs.length > 0 && (
            <div className="mt-1 bg-paper border border-hairline rounded-xl overflow-hidden">
              {matchedSongs.map(s => (
                <button key={s.id} onClick={() => pickSong(s)} className="w-full px-3 py-2 text-left hover:bg-muted text-sm flex justify-between">
                  <span><span className="font-medium">{s.title}</span> — <span className="text-ink-muted">{s.artist}</span></span>
                  <span className="text-xs font-mono text-ink-muted">{s.year ?? ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Wykonawca" className="h-11 px-3 bg-paper border border-hairline rounded-xl" />
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł" className="h-11 px-3 bg-paper border border-hairline rounded-xl" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-ink-muted">Wersy (kolejność = kolejność odsłaniania)</label>
          {lines.map((l, i) => (
            <input
              key={i} value={l}
              onChange={e => setLines(p => p.map((x, j) => j === i ? e.target.value : x))}
              placeholder={`Wers ${i + 1}${i === 0 ? " (pokazany od razu)" : ""}`}
              className="w-full h-11 px-3 bg-paper border border-hairline rounded-xl"
            />
          ))}
          <button onClick={() => setLines(p => [...p, ""])} className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Dodaj kolejny wers
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="h-10 px-3 bg-paper border border-hairline rounded-xl text-sm">
            <option value="easy">Łatwy</option>
            <option value="normal">Normalny</option>
            <option value="hard">Trudny</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            Aktywne
          </label>
          <div className="flex-1" />
          {editing && <button onClick={reset} className="px-4 h-10 rounded-full border border-hairline text-sm">Anuluj</button>}
          <button onClick={onSave} disabled={saving} className="px-5 h-10 rounded-full bg-ink text-paper text-sm font-medium disabled:opacity-50">
            {editing ? "Zapisz" : "Dodaj"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Filtruj…"
            className="h-10 px-3 bg-card border border-hairline rounded-xl text-sm flex-1"
          />
          <span className="text-xs text-ink-muted">{filtered.length} / {rows.length}</span>
        </div>
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className={`bg-card border rounded-2xl p-4 ${r.active ? "border-hairline" : "border-hairline opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.artist} — {r.title}</div>
                  <div className="text-xs text-ink-muted mt-1">{r.lines.length} wersów · {r.difficulty}</div>
                  <div className="mt-2 text-sm text-ink-muted italic line-clamp-2">„{r.lines[0]}"</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setPreview(r)} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-muted" title="Podgląd">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => onToggle(r.id, !r.active)} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-muted" title={r.active ? "Wyłącz" : "Włącz"}>
                    {r.active ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-rose-500" />}
                  </button>
                  <button onClick={() => onEdit(r)} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => onDelete(r.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-rose-500/10 text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-ink-muted py-8 text-sm">Brak snippetów.</p>}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="bg-card border border-hairline rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg">Podgląd</h3>
              <button onClick={() => setPreview(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 mb-4 text-center">
              {preview.lines.map((l, i) => (
                <p key={i} className="font-display italic text-lg">„{l}"</p>
              ))}
            </div>
            <p className="text-center text-sm text-ink-muted">{preview.artist} — {preview.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}