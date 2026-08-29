import type { Side } from "../../domain/types";
import {
  connectWebSocket,
  setOfflineBanner,
  type PublicMatch,
  type PublicRoom,
  type WsConnection,
} from "../api";
import { flapBoard, flapSet, flapStrip } from "../ui/flap";
import { navigateTo } from "../router";
import { renderMissing } from "./missing";

export function mountScoreboard(
  container: HTMLElement,
  roomId: string,
  matchId: string,
): () => void {
  let room: PublicRoom | null = null;
  let ws: WsConnection | null = null;
  let toast = "";
  let prevPointsA: number | null = null;
  let prevPointsB: number | null = null;

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
    const backHref = room.mode === "tournament" ? `/t/${roomId}` : "/";
    const backLabel = room.mode === "tournament" ? "Volver" : "Volver";

    const animateA = prevPointsA !== null && prevPointsA !== match.state.pointsA;
    const animateB = prevPointsB !== null && prevPointsB !== match.state.pointsB;
    prevPointsA = match.state.pointsA;
    prevPointsB = match.state.pointsB;

    container.innerHTML = `
      <div class="scoreboard-view">
        <div class="scoreboard-top">
          <button type="button" class="score-sq" data-side="a" data-delta="-1" ${completed ? "disabled" : ""} aria-label="Restar punto ${escapeHtml(nameA)}">−</button>
          <div class="scoreboard-sets">
            <span class="scoreboard-sets-label">Sets</span>
            ${
              showSets
                ? `<div class="set-pair set-pair--stack">${flapSet(match.state.setsA)}${flapSet(match.state.setsB)}</div>`
                : ""
            }
          </div>
          <button type="button" class="score-sq" data-side="b" data-delta="1" ${completed ? "disabled" : ""} aria-label="Sumar punto ${escapeHtml(nameB)}">+</button>
        </div>
        ${toast ? `<p class="error-msg">${escapeHtml(toast)}</p>` : ""}
        ${winner ? `<div class="status-msg">Ganó ${flapStrip(winner, "flap-strip--win")}</div>` : ""}
        <div class="scoreboard-grid">
          <div class="score-side">
            <div class="score-name">${escapeHtml(nameA)}</div>
            ${flapBoard(match.state.pointsA, animateA)}
            <div class="score-rail">
              <button type="button" class="score-sq" data-side="a" data-delta="-1" ${completed ? "disabled" : ""} aria-label="Restar">−</button>
              <button type="button" class="score-sq" data-side="a" data-delta="1" ${completed ? "disabled" : ""} aria-label="Sumar">+</button>
            </div>
          </div>
          <div class="score-divider" aria-hidden="true"></div>
          <div class="score-side">
            <div class="score-name">${escapeHtml(nameB)}</div>
            ${flapBoard(match.state.pointsB, animateB)}
            <div class="score-rail">
              <button type="button" class="score-sq" data-side="b" data-delta="-1" ${completed ? "disabled" : ""} aria-label="Restar">−</button>
              <button type="button" class="score-sq" data-side="b" data-delta="1" ${completed ? "disabled" : ""} aria-label="Sumar">+</button>
            </div>
          </div>
        </div>
        <div class="scoreboard-actions">
          <button type="button" id="undo" class="text-link" ${completed ? "disabled" : ""}>Deshacer</button>
          ${room.mode === "scoreboard" ? `<button type="button" id="reset" class="text-link">Reset</button>` : ""}
          <a class="text-link" href="${backHref}">${backLabel}</a>
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
      const found = room.bracket?.matches.find((m) => m.id === matchId);
      if (!found) {
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
        navigateTo(`/t/${roomId}`, true);
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
