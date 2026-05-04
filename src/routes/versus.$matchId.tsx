import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { NickInput } from "@/components/versus/nick-input";
import { VersusLobby } from "@/components/versus/lobby";
import { VersusRound } from "@/components/versus/round";
import { VersusResult } from "@/components/versus/result";
import { useVersusMatch } from "@/hooks/use-versus";
import { joinMatch } from "@/server/versus.functions";
import { VersusLocal } from "@/lib/storage";

export const Route = createFileRoute("/versus/$matchId")({
  head: () => ({
    meta: [
      { title: "Mecz Versus — RAP GUESSER" },
      { name: "description", content: "Pojedynek 1v1." },
    ],
  }),
  component: VersusMatchPage,
});

function VersusMatchPage() {
  const { matchId } = Route.useParams();
  const { match, results, loading, error } = useVersusMatch(matchId);
  const [playerId, setPlayerId] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinNick, setJoinNick] = useState("");
  const joinFn = useServerFn(joinMatch);

  useEffect(() => {
    setPlayerId(VersusLocal.getOrCreatePlayerId());
    setJoinNick(VersusLocal.getSuggestedNick());
  }, []);

  // Auto-join: jeśli jesteśmy nieznani w meczu i jest wolny slot guesta — pokaż formularz.
  const isParticipant = !!match && (match.host_player_id === playerId || match.guest_player_id === playerId);
  const slotOpen = !!match && !match.guest_player_id && match.status === "lobby";

  const doJoin = async () => {
    const v = joinNick.trim();
    if (!v) { toast.error("Wpisz nick"); return; }
    setJoining(true);
    try {
      VersusLocal.saveSuggestedNick(v);
      await joinFn({ data: { matchId, playerId, nick: v } });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się dołączyć");
    } finally { setJoining(false); }
  };

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {loading && <div className="text-center text-sm text-ink-muted py-10">Ładowanie meczu…</div>}
        {error && <div className="text-center text-sm text-primary py-10">{error}</div>}
        {!loading && !match && <div className="text-center text-sm text-ink-muted py-10">Nie ma takiego meczu.</div>}

        {match && !isParticipant && slotOpen && (
          <div className="max-w-md mx-auto bg-card border border-hairline rounded-3xl p-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Dołącz do meczu</p>
              <h2 className="font-display text-2xl">Grasz przeciwko {match.host_nick}</h2>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Twój nick na ten mecz</label>
              <NickInput value={joinNick} onChange={setJoinNick} autoFocus />
            </div>
            <Button onClick={doJoin} disabled={joining} className="w-full rounded-full h-11">
              Dołącz do meczu
            </Button>
          </div>
        )}

        {match && !isParticipant && !slotOpen && (
          <div className="text-center text-sm text-ink-muted py-10">
            Ten mecz jest pełny lub już wystartował.
          </div>
        )}

        {match && isParticipant && match.status === "lobby" && (
          <VersusLobby match={match} playerId={playerId} />
        )}

        {match && isParticipant && match.status === "playing" && (
          <VersusRound match={match} results={results} playerId={playerId} />
        )}

        {match && isParticipant && match.status === "finished" && (
          <VersusResult match={match} results={results} playerId={playerId} />
        )}
      </main>
    </div>
  );
}