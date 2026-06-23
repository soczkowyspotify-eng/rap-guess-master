import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  nick: string;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sync = async (u: User | null) => {
      if (cancelled) return;
      setUser(u);
      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("id, nick, avatar_url")
          .eq("id", u.id)
          .maybeSingle();
        if (!cancelled) setProfile((data as Profile | null) ?? null);
      } else {
        setProfile(null);
      }
      if (!cancelled) setLoading(false);
    };

    supabase.auth.getUser().then(({ data }) => sync(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        sync(session?.user ?? null);
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  return { user, profile, loading, signOut };
}