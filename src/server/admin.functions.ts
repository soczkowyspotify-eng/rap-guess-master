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