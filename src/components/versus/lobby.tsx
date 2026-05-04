import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, Pencil, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NickInput } from "./nick-input";
import { startMatch, updateNick } from "@/server/versus.functions";
import type { VersusMatch } from "@/hooks/use-versus";
import { VersusLocal } from "@/lib/storage";

interface Props {
  match: VersusMatch;
  playerId: string;
  onStarted?: () => void;
}

export function VersusLobby({ match, playerId }: Props) {
  const startFn = useServerFn(startMatch);
  const updateNickFn = useServerFn(updateNick);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const isHost = match.host_player_id === playerId;
  const myNick = isHost ? match.host_nick : match.guest_nick ?? "";
  const oppNick = isHost ? match.guest_nick : match.host_nick;
  const lobbyFull = !!match.guest_player_id;

  const link = typeof window !== "undefined" ? `${window.location.origin}/versus/${match.id}` : "";
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 256, margin: 1, color: { dark: "#000000", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  const openEdit = () => { setNickDraft(myNick); setEditing(true); };

  const saveNick = async () => {
    const v = nickDraft.trim();
    if (!v) { toast.error("Nick nie może być pusty"); return; }
    setBusy(true);
    try {
      await updateNickFn({ data: { matchId: match.id, playerId, nick: v } });
      VersusLocal.saveSuggestedNick(v);
      setEditing(false);
      toast.success("Nick zmieniony");
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd");
    } finally { setBusy(false); }
  };

  const start = async () => {
    setBusy(true);
    try {
      await startFn({ data: { matchId: match.id, playerId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się wystartować");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-ink-muted">Versus 1v1 · best of 5</p>
        <h1 className="font-display text-3xl">Poczekalnia</h1>
      </div>

      <div className="bg-card border border-hairline rounded-2xl p-5 space-y-4">
        <PlayerSlot label={isHost ? "Ty (host)" : "Host"} nick={isHost ? myNick : match.host_nick} canEdit={isHost} onEdit={openEdit} />
        <PlayerSlot
          label={isHost ? "Przeciwnik" : "Ty"}
          nick={isHost ? (oppNick ?? "Czeka na dołączenie…") : myNick}
          canEdit={!isHost && !!match.guest_player_id}
          onEdit={openEdit}
          dim={isHost && !match.guest_player_id}
        />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Link do meczu</div>
        <div className="flex gap-2">
          <input readOnly value={link} className="flex-1 h-11 px-4 bg-muted rounded-full text-sm font-mono truncate" />
          <Button onClick={copy} variant="outline" className="rounded-full h-11">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!lobbyFull && (
        <div className="bg-card border border-hairline rounded-2xl p-5 space-y-4 text-center">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">Zeskanuj kod QR</div>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Kod QR z linkiem do meczu" className="mx-auto w-48 h-48 rounded-xl bg-white p-2" />
          ) : (
            <div className="mx-auto w-48 h-48 grid place-items-center bg-muted rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Czekamy na drugiego gracza…
          </div>
        </div>
      )}

      {isHost ? (
        <Button
          onClick={start}
          disabled={!lobbyFull || busy}
          className="w-full rounded-full h-12 text-base"
        >
          <Play className="h-4 w-4" />
          {lobbyFull ? "Rozpocznij mecz" : "Czekam na drugiego gracza…"}
        </Button>
      ) : (
        <p className="text-center text-sm text-ink-muted">Czekamy aż host wystartuje…</p>
      )}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Zmień swój nick</DialogTitle></DialogHeader>
          <NickInput value={nickDraft} onChange={setNickDraft} autoFocus />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Anuluj</Button>
            <Button onClick={saveNick} disabled={busy}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlayerSlot({ label, nick, canEdit, onEdit, dim }: { label: string; nick: string; canEdit: boolean; onEdit: () => void; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">{label}</div>
        <div className={`font-display text-xl truncate ${dim ? "text-ink-muted" : ""}`}>{nick}</div>
      </div>
      {canEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit} className="rounded-full">
          <Pencil className="h-3.5 w-3.5" /> Zmień nick
        </Button>
      )}
    </div>
  );
}