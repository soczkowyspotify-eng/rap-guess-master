import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/i18n";

export const Route = createFileRoute("/suggest")({
  head: () => ({ meta: [
    { title: "Zaproponuj utwór — RAP GUESSER" },
    { name: "description", content: "Zaproponuj nowy utwór do bazy gry RAP GUESSER." },
  ] }),
  component: SuggestPage,
});

function SuggestPage() {
  const { t } = useI18n();
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = artist.trim();
    const ttl = title.trim();
    const l = link.trim();
    if (!a || !ttl) { toast.error(t("suggest.toast.empty")); return; }
    if (a.length > 200 || ttl.length > 200 || l.length > 500) { toast.error(t("suggest.toast.long")); return; }
    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from("track_suggestions")
        .insert({ artist: a, title: ttl, link: l || null });
      if (error) throw error;
      setSent(true);
      setArtist(""); setTitle(""); setLink("");
      toast.success(t("suggest.toast.ok"));
    } catch (err: any) {
      toast.error(err?.message ?? t("suggest.toast.err"));
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-6 w-6" />
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">{t("suggest.tag")}</p>
          <h1 className="font-display text-3xl md:text-4xl">{t("suggest.title")}</h1>
          <p className="text-sm text-ink-muted">{t("suggest.subtitle")}</p>
        </div>

        {sent ? (
          <div className="rounded-3xl border border-primary/40 bg-card p-6 text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-paper">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl">{t("suggest.sent.title")}</h2>
            <p className="text-sm text-ink-muted">{t("suggest.sent.desc")}</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setSent(false)} className="px-5 h-11 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90">
                {t("suggest.sent.again")}
              </button>
              <Link to="/" className="px-5 h-11 inline-flex items-center rounded-full border border-hairline text-sm font-medium hover:bg-muted">
                {t("suggest.sent.back")}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-3xl border border-hairline bg-card p-5 sm:p-6 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">{t("suggest.artist")}</label>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                maxLength={200}
                placeholder="np. Taco Hemingway"
                className="w-full h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">{t("suggest.title2")}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="np. Polskie tango"
                className="w-full h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">{t("suggest.link")} <span className="opacity-60">{t("suggest.optional")}</span></label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                maxLength={500}
                placeholder="https://..."
                className="w-full h-11 px-3 rounded-xl border border-hairline bg-paper outline-none focus:border-primary text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full h-12 rounded-2xl bg-ink text-paper font-medium hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" /> {sending ? t("suggest.sending") : t("suggest.send")}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}