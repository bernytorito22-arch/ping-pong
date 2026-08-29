import type { Side } from "../../domain/types";
import {
  connectWebSocket,
  setOfflineBanner,
  type PublicMatch,
  type PublicRoom,
  type WsConnection,
} from "../api";
import { renderMissing } from "./missing";

export function mountScoreboard(
  container: HTMLElement,
  roomId: string,
  matchId: string,
): () => void {
  let room: PublicRoom | null = null;
  let ws: WsConnection | null = null;
  let toast = "";

  const cleanup = () => {
    ws?.close();
    setOfflineBanner(false);
  };

  const playerName = (id: string | null): string => {
    if (!id) return "—";
    return room?.players.find((p) => p.id === id)?.name ?? "—";
  };

  const currentMatch = (): PublicMatch | null => {
    if (!room) return null;
    if (room.mode === "scoreboard") return room.scoreboardMatch;
    return room.bracket?.matches.find((m) => m.id === matchId) ?? null;
  };

  const render = () => {
    const match = currentMatch();
    if (!room || !match) return;

    const nameA = playerName(match.playerAId);
    const nameB = playerName(match.playerBId);
    const completed = match.state.status === "completed";
    const winner = completed && match.winnerId ? playerName(match.winnerId) : null;
    const showSets = room.rules.matchType !== "one_set";
    const backHref = room.mode === "tournament" ? `/t/${roomId}` : `/t/${roomId}`;

    container.innerHTML = `
      <div class="stack scoreboard">
        <h1>Marcador</h1>
        ${toast ? `<p class="error-msg">${escapeHtml(toast)}</p>` : ""}
        ${winner ? `<div class="status-msg">Ganó ${escapeHtml(winner)}</div>` : ""}
        <div class="score-side">
          <div class="score-name">${escapeHtml(nameA)}</div>
          ${showSets ? `<div class="score-sets">Sets: ${match.state.setsA}</div>` : ""}
          <div class="score-points">${match.state.pointsA}</div>
          <div class="score-controls">
            <button type="button" data-side="a" data-delta="-1" ${completed ? "disabled" : ""}>−</button>
            <button type="button" data-side="a" data-delta="1" ${completed ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div class="score-side">
          <div class="score-name">${escapeHtml(nameB)}</div>
          ${showSets ? `<div class="score-sets">Sets: ${match.state.setsB}</div>` : ""}
          <div class="score-points">${match.state.pointsB}</div>
          <div class="score-controls">
            <button type="button" data-side="b" data-delta="-1" ${completed ? "disabled" : ""}>−</button>
            <button type="button" data-side="b" data-delta="1" ${completed ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div class="row">
          <button type="button" id="undo" ${completed ? "disabled" : ""}>Deshacer</button>
          ${room.mode === "scoreboard" ? `<button type="button" id="reset">Reset</button>` : ""}
          <a class="button" href="${backHref}">${room.mode === "tournament" ? "Volver a la llave" : "Volver"}</a>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>("[data-side]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const side = btn.dataset.side as Side;
        const delta = Number(btn.dataset.delta) as 1 | -1;
        toast = "";
        ws?.send({ type: "point", matchId: match.id, side, delta });
      });
    });

    container.querySelector("#undo")!.addEventListener("click", () => {
      toast = "";
      ws?.send({ type: "undo", matchId: match.id });
    });

    container.querySelector("#reset")?.addEventListener("click", () => {
      toast = "";
      ws?.send({ type: "resetScoreboard" });
    });
  };

  const openIfNeeded = () => {
    const match = currentMatch();
    if (!match || !room) return;
    if (
      room.mode === "tournament" &&
      match.playerAId &&
      match.playerBId &&
      match.state.status === "pending"
    ) {
      ws?.send({ type: "openMatch", matchId: match.id });
    }
  };

  ws = connectWebSocket(
    roomId,
    (next) => {
      room = next;
      toast = "";
      render();
    },
    (msg) => {
      toast = msg;
      render();
    },
    setOfflineBanner,
  );

  fetch(`/api/rooms/${encodeURIComponent(roomId)}`)
    .then(async (res) => {
      if (res.status === 404) {
        cleanup();
        renderMissing(container);
        return;
      }
      room = (await res.json()) as PublicRoom;
      if (room.mode === "scoreboard") {
        render();
        return;
      }
      const match = room.bracket?.matches.find((m) => m.id === matchId);
      if (!match) {
        cleanup();
        renderMissing(container);
        return;
      }
      render();
      openIfNeeded();
    })
    .catch(() => {
      cleanup();
      renderMissing(container);
    });

  return cleanup;
}

export function mountScoreboardRoom(container: HTMLElement, roomId: string): () => void {
  let room: PublicRoom | null = null;
  let ws: WsConnection | null = null;

  const cleanup = () => {
    ws?.close();
    setOfflineBanner(false);
  };

  ws = connectWebSocket(
    roomId,
    (next) => {
      room = next;
      if (room.mode === "scoreboard" && room.scoreboardMatch) {
        cleanup();
        mountScoreboard(container, roomId, room.scoreboardMatch.id);
      }
    },
    () => {},
    setOfflineBanner,
  );

  fetch(`/api/rooms/${encodeURIComponent(roomId)}`)
    .then(async (res) => {
      if (res.status === 404) {
        cleanup();
        renderMissing(container);
        return;
      }
      room = (await res.json()) as PublicRoom;
      if (room.mode === "tournament") {
        cleanup();
        location.replace(`/t/${roomId}`);
        return;
      }
      if (room.scoreboardMatch) {
        cleanup();
        mountScoreboard(container, roomId, room.scoreboardMatch.id);
      }
    })
    .catch(() => {
      cleanup();
      renderMissing(container);
    });

  return cleanup;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
