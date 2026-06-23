import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppHeader } from "@/components/app-header";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Konto — RAP GUESSER" },
    { name: "description", content: "Zaloguj się lub załóż konto, by synchronizować statystyki i grać w Versus z trwałym nickiem." },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/" }); });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { nick: nick.trim() || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Konto utworzone — witaj!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Zalogowano");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Coś poszło nie tak");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error("Nie udało się zalogować przez Google"); return; }
      if (result.redirected) return;
      navigate({ to: "/" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-md mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Opcjonalne
          </div>
          <h1 className="font-display text-3xl sm:text-4xl">
            {mode === "login" ? "Zaloguj się" : "Załóż konto"}
          </h1>
          <p className="text-sm text-ink-muted mt-3">
            Konto nie jest wymagane, ale ułatwia rzeczy:<br/>
            zapisuje stat na zawsze i daje trwały nick w Versus.
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full h-12 rounded-full border border-hairline bg-card hover:border-ink transition flex items-center justify-center gap-3 text-sm font-medium disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Kontynuuj z Google
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-hairline flex-1" />
          <span className="text-xs text-ink-muted">albo email</span>
          <div className="h-px bg-hairline flex-1" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
              <input
                value={nick}
                onChange={e => setNick(e.target.value)}
                placeholder="Nick (widoczny w Versus)"
                maxLength={20}
                className="w-full h-12 pl-11 pr-4 bg-card border border-hairline rounded-2xl outline-none focus:border-primary"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="email" required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full h-12 pl-11 pr-4 bg-card border border-hairline rounded-2xl outline-none focus:border-primary"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="password" required minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Hasło (min. 6 znaków)"
              className="w-full h-12 pl-11 pr-4 bg-card border border-hairline rounded-2xl outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full h-12 rounded-full bg-ink text-paper font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {mode === "login" ? "Zaloguj się" : "Załóż konto"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          {mode === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
          <button
            onClick={() => setMode(m => m === "login" ? "signup" : "login")}
            className="text-primary hover:underline"
          >
            {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>

        <p className="text-center text-xs text-ink-muted mt-8">
          <Link to="/" className="hover:text-ink">albo graj bez konta →</Link>
        </p>
      </main>
    </div>
  );
}