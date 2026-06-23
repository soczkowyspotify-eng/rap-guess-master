import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export interface LyricSnippet {
  id: string;
  track_id: string;
  artist: string;
  title: string;
  lines: string[];
  difficulty: "easy" | "normal" | "hard";
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export const getRandomLyric = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = publicClient();
    const { data } = await supa
      .from("lyric_snippets")
      .select("id, track_id, artist, title, lines, difficulty")
      .eq("active", true);
    const all = (data ?? []) as LyricSnippet[];
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  });

export const getDailyLyric = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = publicClient();
    const { data } = await supa
      .from("lyric_snippets")
      .select("id, track_id, artist, title, lines, difficulty")
      .eq("active", true)
      .order("created_at", { ascending: true });
    const all = (data ?? []) as LyricSnippet[];
    if (!all.length) return null;
    const idx = hashStr(todayKey()) % all.length;
    return all[idx];
  });