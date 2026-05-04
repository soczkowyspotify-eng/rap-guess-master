import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { CHANGELOG, CURRENT_VERSION } from "@/data/changelog";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "rg2-seen-changelog-version";

interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
}

export function ChangelogPopup() {
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, image_url, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      try {
        const seen = localStorage.getItem(LS_KEY);
        const key = data ? `a:${data.id}` : `v:${CURRENT_VERSION}`;
        if (seen !== key) {
          if (data) setAnnouncement(data as Announcement);
          setTimeout(() => setOpen(true), 600);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const close = () => {
    setOpen(false);
    try {
      const key = announcement ? `a:${announcement.id}` : `v:${CURRENT_VERSION}`;
      localStorage.setItem(LS_KEY, key);
    } catch {}
  };

  if (!open) return null;

  const latest = CHANGELOG[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />
      <div className="relative w-full sm:max-w-md bg-card border border-hairline sm:rounded-3xl rounded-t-3xl shadow-lift p-6 sm:p-8 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <button
          onClick={close}
          aria-label="Zamknij"
          className="absolute top-4 right-4 h-8 w-8 inline-flex items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-muted transition"
        >
          <X className="h-4 w-4" />
        </button>

        {announcement ? (
          <>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Ogłoszenie
            </div>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">{announcement.title}</h2>
            {announcement.image_url && (
              <img
                src={announcement.image_url}
                alt=""
                className="mt-4 w-full max-h-64 object-cover rounded-2xl border border-hairline"
              />
            )}
            <p className="mt-5 text-sm text-ink whitespace-pre-line leading-relaxed">{announcement.body}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Nowości · v{latest.version}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">{latest.title}</h2>
            <p className="text-xs font-mono text-ink-muted mt-1">{latest.date}</p>

            <ul className="mt-6 space-y-3">
              {latest.changes.map((c, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
                  <span className="text-ink">{c}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={close}
          className="mt-8 w-full h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 transition"
        >
          OK, zaczynam grać
        </button>
      </div>
    </div>
  );
}