import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Swords, Plus, LogIn, Bot } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NickInput } from "@/components/versus/nick-input";
import { createMatch } from "@/server/versus.functions";
import { VersusLocal } from "@/lib/storage";

export const Route = createFileRoute("/versus/")({
  head: () => ({
    meta: [
      { title: "Versus 1v1 — RAP GUESSER" },
      { name: "description", content: "Zagraj 1v1 ze znajomym. Wygrywa kto trafi tracki z mniejszą liczbą prób." },
    ],
  }),
  component: VersusHomePage,
});

function VersusHomePage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createMatch);
  const [nick, setNick] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNick(VersusLocal.getSuggestedNick());
  }, []);

  const create = async () => {
    const v = nick.trim();
    if (!v) { toast.error("Wpisz nick"); return; }
    setBusy(true);
    try {
      const playerId = VersusLocal.getOrCreatePlayerId();
      VersusLocal.saveSuggestedNick(v);
      const r = await createFn({ data: { playerId, nick: v } });
      navigate({ to: "/versus/$matchId", params: { matchId: r.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się");
    } finally { setBusy(false); }
  };

  const join = () => {
    const id = extractMatchId(joinId.trim());
    if (!id) { toast.error("Wklej link lub kod meczu"); return; }
    if (nick.trim()) VersusLocal.saveSuggestedNick(nick.trim());
    navigate({ to: "/versus/$matchId", params: { matchId: id } });
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-3 mb-10">
          <Swords className="h-12 w-12 mx-auto text-primary" />
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Tryb · Versus 1v1</p>
          <h1 className="font-display text-4xl">Wyzwij znajomego</h1>
          <p className="text-sm text-ink-muted">Best of 5. Wygrywa kto trafi z mniejszą liczbą prób.</p>
        </div>

        <div className="bg-card border border-hairline rounded-3xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Twój nick</label>
            <NickInput value={nick} onChange={setNick} />
          </div>

          <Button onClick={create} disabled={busy} className="w-full rounded-full h-12">
            <Plus className="h-4 w-4" /> Stwórz mecz
          </Button>

          <div className="flex items-center gap-3 text-xs font-mono text-ink-muted">
            <div className="flex-1 h-px bg-hairline" /> LUB <div className="flex-1 h-px bg-hairline" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Dołącz do meczu</label>
            <Input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Wklej link lub ID meczu"
              className="h-11 rounded-full px-4"
            />
            <Button onClick={join} variant="outline" className="w-full rounded-full h-11">
              <LogIn className="h-4 w-4" /> Dołącz
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-ink-muted">
            <div className="flex-1 h-px bg-hairline" /> LUB <div className="flex-1 h-px bg-hairline" />
          </div>

          <button
            onClick={() => {
              if (nick.trim()) VersusLocal.saveSuggestedNick(nick.trim());
              navigate({ to: "/versus/bot" });
            }}
            className="w-full rounded-2xl border border-hairline hover:border-primary/50 hover:bg-primary/5 transition-all p-4 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base">Zagraj z botem</div>
              <div className="text-xs text-ink-muted">Solo, 3 poziomy trudności. Bez czekania.</div>
            </div>
            <span className="text-ink-muted">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

function extractMatchId(input: string): string | null {
  const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const m = input.match(uuidRe);
  return m ? m[0] : null;
}