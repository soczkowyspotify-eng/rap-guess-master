import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function checkPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Brak skonfigurowanego hasła admina");
  if (pw !== expected) throw new Error("Złe hasło");
}

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const PwSchema = z.object({ password: z.string().min(1).max(200) });

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => PwSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

const AddSchema = PwSchema.extend({
  link: z.string().min(1).max(500),
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
});

export const addYtTrack = createServerFn({ method: "POST" })
  .inputValidator((d) => AddSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const videoId = extractVideoId(data.link);
    if (!videoId) throw new Error("Niepoprawny link YouTube");
    const { data: row, error } = await supabaseAdmin
      .from("yt_tracks")
      .insert({ video_id: videoId, artist: data.artist.trim(), title: data.title.trim() })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("Ten track już jest w bazie");
      throw new Error(error.message);
    }
    return row;
  });

const DelSchema = PwSchema.extend({ id: z.string().uuid() });

export const deleteYtTrack = createServerFn({ method: "POST" })
  .inputValidator((d) => DelSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin.from("yt_tracks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateTrackSchema = PwSchema.extend({
  id: z.string().uuid(),
  link: z.string().min(1).max(500),
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
});

export const updateYtTrack = createServerFn({ method: "POST" })
  .inputValidator((d) => UpdateTrackSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const videoId = extractVideoId(data.link);
    if (!videoId) throw new Error("Niepoprawny link YouTube");
    const { error } = await supabaseAdmin
      .from("yt_tracks")
      .update({ video_id: videoId, artist: data.artist.trim(), title: data.title.trim() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============= ALBUMY =============

const AlbumTrackSchema = z.object({
  link: z.string().min(1).max(500),
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  start_sec: z.number().int().min(0).max(3600).optional(),
});

const AddAlbumSchema = PwSchema.extend({
  cover_url: z.string().url().max(1000),
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  recommended: z.boolean().optional(),
  tracks: z.array(AlbumTrackSchema).min(1).max(100),
});

export const addYtAlbum = createServerFn({ method: "POST" })
  .inputValidator((d) => AddAlbumSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    // Walidacja linków
    const trackRows = data.tracks.map((t, i) => {
      const vid = extractVideoId(t.link);
      if (!vid) throw new Error(`Niepoprawny link YouTube w tracku #${i + 1}`);
      return { video_id: vid, artist: t.artist.trim(), title: t.title.trim(), position: i, start_sec: t.start_sec ?? 0 };
    });
    const seen = new Map<string, number>();
    for (let i = 0; i < trackRows.length; i++) {
      const prev = seen.get(trackRows[i].video_id);
      if (prev !== undefined) {
        throw new Error(`Duplikat linku: track #${prev + 1} i #${i + 1} mają ten sam film`);
      }
      seen.set(trackRows[i].video_id, i);
    }
    const { data: album, error: aErr } = await supabaseAdmin
      .from("yt_albums")
      .insert({
        cover_url: data.cover_url.trim(),
        artist: data.artist.trim(),
        title: data.title.trim(),
        year: data.year ?? null,
        recommended: data.recommended ?? false,
      })
      .select()
      .single();
    if (aErr || !album) throw new Error(aErr?.message ?? "Błąd tworzenia albumu");
    const { error: tErr } = await supabaseAdmin
      .from("yt_album_tracks")
      .insert(trackRows.map((r) => ({ ...r, album_id: album.id })));
    if (tErr) {
      await supabaseAdmin.from("yt_albums").delete().eq("id", album.id);
      throw new Error(tErr.message);
    }
    return album;
  });

export const deleteYtAlbum = createServerFn({ method: "POST" })
  .inputValidator((d) => DelSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin.from("yt_albums").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateAlbumSchema = PwSchema.extend({
  id: z.string().uuid(),
  cover_url: z.string().url().max(1000),
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  recommended: z.boolean().optional(),
  tracks: z.array(AlbumTrackSchema).min(1).max(100),
});

export const updateYtAlbum = createServerFn({ method: "POST" })
  .inputValidator((d) => UpdateAlbumSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const trackRows = data.tracks.map((t, i) => {
      const vid = extractVideoId(t.link);
      if (!vid) throw new Error(`Niepoprawny link YouTube w tracku #${i + 1}`);
      return { video_id: vid, artist: t.artist.trim(), title: t.title.trim(), position: i, start_sec: t.start_sec ?? 0 };
    });
    const seen = new Map<string, number>();
    for (let i = 0; i < trackRows.length; i++) {
      const prev = seen.get(trackRows[i].video_id);
      if (prev !== undefined) {
        throw new Error(`Duplikat linku: track #${prev + 1} i #${i + 1} mają ten sam film`);
      }
      seen.set(trackRows[i].video_id, i);
    }
    const { error: uErr } = await supabaseAdmin
      .from("yt_albums")
      .update({
        cover_url: data.cover_url.trim(),
        artist: data.artist.trim(),
        title: data.title.trim(),
        year: data.year ?? null,
        recommended: data.recommended ?? false,
      })
      .eq("id", data.id);
    if (uErr) throw new Error(uErr.message);
    const { error: dErr } = await supabaseAdmin
      .from("yt_album_tracks")
      .delete()
      .eq("album_id", data.id);
    if (dErr) throw new Error(dErr.message);
    const { error: tErr } = await supabaseAdmin
      .from("yt_album_tracks")
      .insert(trackRows.map((r) => ({ ...r, album_id: data.id })));
    if (tErr) throw new Error(tErr.message);
    return { ok: true };
  });

// ============= OGŁOSZENIA (popup) =============

const AddAnnouncementSchema = PwSchema.extend({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  image_url: z.string().url().max(1000).optional().nullable(),
  active: z.boolean().optional(),
});

export const addAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => AddAnnouncementSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { data: row, error } = await supabaseAdmin
      .from("announcements")
      .insert({
        title: data.title.trim(),
        body: data.body.trim(),
        image_url: data.image_url?.trim() || null,
        active: data.active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => DelSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ToggleAnnouncementSchema = PwSchema.extend({
  id: z.string().uuid(),
  active: z.boolean(),
});

export const toggleAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => ToggleAnnouncementSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin
      .from("announcements")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============= PROPOZYCJE UTWORÓW =============

export const deleteSuggestion = createServerFn({ method: "POST" })
  .inputValidator((d) => DelSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await (supabaseAdmin as any)
      .from("track_suggestions")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============= LEGACY OVERRIDES =============

const UpsertOverrideSchema = PwSchema.extend({
  song_id: z.string().min(1).max(200),
  start_sec: z.number().int().min(0).max(3600),
  hidden: z.boolean(),
});

export const upsertLegacyOverride = createServerFn({ method: "POST" })
  .inputValidator((d) => UpsertOverrideSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await (supabaseAdmin as any)
      .from("legacy_song_overrides")
      .upsert({
        song_id: data.song_id,
        start_sec: data.start_sec,
        hidden: data.hidden,
        updated_at: new Date().toISOString(),
      }, { onConflict: "song_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ResetOverrideSchema = PwSchema.extend({ song_id: z.string().min(1).max(200) });

export const resetLegacyOverride = createServerFn({ method: "POST" })
  .inputValidator((d) => ResetOverrideSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await (supabaseAdmin as any)
      .from("legacy_song_overrides")
      .delete()
      .eq("song_id", data.song_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============= Lyric snippets =============

const LyricUpsertSchema = PwSchema.extend({
  id: z.string().uuid().optional(),
  track_id: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  lines: z.array(z.string().min(1).max(500)).min(1).max(8),
  difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  active: z.boolean().default(true),
});

export const upsertLyricSnippet = createServerFn({ method: "POST" })
  .inputValidator((d) => LyricUpsertSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const payload = {
      track_id: data.track_id,
      artist: data.artist.trim(),
      title: data.title.trim(),
      lines: data.lines.map(l => l.trim()).filter(Boolean),
      difficulty: data.difficulty,
      active: data.active,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("lyric_snippets").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("lyric_snippets")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

const LyricIdSchema = PwSchema.extend({ id: z.string().uuid() });

export const deleteLyricSnippet = createServerFn({ method: "POST" })
  .inputValidator((d) => LyricIdSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin.from("lyric_snippets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const LyricToggleSchema = PwSchema.extend({ id: z.string().uuid(), active: z.boolean() });

export const toggleLyricSnippet = createServerFn({ method: "POST" })
  .inputValidator((d) => LyricToggleSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { error } = await supabaseAdmin.from("lyric_snippets").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const LyricBulkSchema = PwSchema.extend({
  items: z.array(z.object({
    track_id: z.string().min(1).max(200),
    artist: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
    lines: z.array(z.string().min(1).max(500)).min(1).max(8),
    difficulty: z.enum(["easy", "normal", "hard"]).default("normal"),
  })).min(1).max(200),
});

export const bulkImportLyricSnippets = createServerFn({ method: "POST" })
  .inputValidator((d) => LyricBulkSchema.parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const rows = data.items.map(i => ({
      track_id: i.track_id,
      artist: i.artist.trim(),
      title: i.title.trim(),
      lines: i.lines.map(l => l.trim()).filter(Boolean),
      difficulty: i.difficulty,
      active: true,
    }));
    const { error, count } = await supabaseAdmin.from("lyric_snippets").insert(rows, { count: "exact" });
    if (error) throw new Error(error.message);
    return { ok: true, inserted: count ?? rows.length };
  });