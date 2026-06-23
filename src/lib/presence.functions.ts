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

const PingSchema = z.object({
  playerId: z.string().min(4).max(100),
  nick: z.string().min(1).max(50),
  view: z.string().min(1).max(40),
});

export const pingPresence = createServerFn({ method: "POST" })
  .inputValidator((d) => PingSchema.parse(d))
  .handler(async ({ data }) => {
    const supa = publicClient();
    await supa.from("presence_pings").upsert({
      player_id: data.playerId,
      nick: data.nick.slice(0, 50),
      current_view: data.view,
      last_seen: new Date().toISOString(),
    }, { onConflict: "player_id" });
    return { ok: true };
  });

export const getActivePlayers = createServerFn({ method: "GET" })
  .handler(async () => {
    const supa = publicClient();
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data } = await supa
      .from("presence_pings")
      .select("nick, current_view, last_seen")
      .gt("last_seen", cutoff)
      .order("last_seen", { ascending: false })
      .limit(50);
    const list = (data ?? []) as { nick: string; current_view: string; last_seen: string }[];
    return { count: list.length, players: list.slice(0, 12) };
  });