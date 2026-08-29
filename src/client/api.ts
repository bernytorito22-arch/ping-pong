import type {
  Command,
  MatchSnapshot,
  MatchType,
  PointsTo,
  RoomMode,
  Rules,
  Side,
} from "../domain/types";

export type { Command, MatchType, PointsTo, RoomMode, Rules, Side };

export interface Player {
  id: string;
  name: string;
}

export interface PublicMatch {
  id: string;
  round: number;
  slot: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  state: MatchSnapshot;
}

export interface PublicRoom {
  id: string;
  mode: RoomMode;
  rules: Rules;
  players: Player[];
  bracket: { size: number; matches: PublicMatch[] } | null;
  scoreboardMatch: PublicMatch | null;
  activeMatchId: string | null;
  championId: string | null;
}

export interface WsConnection {
  send(command: Command): void;
  close(): void;
}

type StateHandler = (room: PublicRoom) => void;
type ErrorHandler = (message: string) => void;
type OfflineHandler = (offline: boolean) => void;

export async function createRoom(
  mode: RoomMode,
  names: string[],
  rules: Rules,
): Promise<{ id: string }> {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, names, rules }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "No se pudo crear la sala");
  }
  return (await res.json()) as { id: string };
}

export async function fetchRoom(id: string): Promise<PublicRoom | null> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar la sala");
  return (await res.json()) as PublicRoom;
}

export function connectWebSocket(
  id: string,
  onState: StateHandler,
  onError: ErrorHandler,
  onOffline?: OfflineHandler,
): WsConnection {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}/api/rooms/${encodeURIComponent(id)}/ws`);
  let closed = false;

  const setOffline = (offline: boolean) => onOffline?.(offline);

  ws.addEventListener("open", () => {
    setOffline(false);
    ws.send(JSON.stringify({ type: "hello" }));
  });

  ws.addEventListener("message", (event) => {
    let msg: { type: string; room?: PublicRoom; message?: string };
    try {
      msg = JSON.parse(String(event.data)) as typeof msg;
    } catch {
      onError("Respuesta inválida del servidor");
      return;
    }
    if (msg.type === "state" && msg.room) {
      onState(msg.room);
      return;
    }
    if (msg.type === "error") {
      onError(msg.message ?? "Error");
    }
  });

  ws.addEventListener("close", () => {
    if (!closed) setOffline(true);
  });

  ws.addEventListener("error", () => {
    setOffline(true);
  });

  return {
    send(command) {
      if (ws.readyState !== WebSocket.OPEN) {
        setOffline(true);
        return;
      }
      ws.send(JSON.stringify(command));
    },
    close() {
      closed = true;
      ws.close();
    },
  };
}

export function setOfflineBanner(offline: boolean): void {
  const banner = document.getElementById("offline-banner");
  if (banner) banner.hidden = !offline;
}
