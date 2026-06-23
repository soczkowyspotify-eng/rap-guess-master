import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { pingPresence } from "@/lib/presence.functions";
import { VersusLocal } from "@/lib/storage";

export function usePresence(view: string) {
  const ping = useServerFn(pingPresence);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const playerId = VersusLocal.getOrCreatePlayerId();
    const nick = VersusLocal.getSuggestedNick() || `Gracz-${playerId.slice(0, 4)}`;
    const send = () => {
      ping({ data: { playerId, nick, view } }).catch(() => {});
    };
    send();
    const id = setInterval(send, 30_000);
    return () => clearInterval(id);
  }, [view, ping]);
}