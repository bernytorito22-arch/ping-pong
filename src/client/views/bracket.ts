import {
  connectWebSocket,
  setOfflineBanner,
  type PublicMatch,
  type PublicRoom,
  type WsConnection,
} from "../api";
import { flapIndex, flapPair, flapStrip, livePill } from "../ui/flap";
import { chevronLeft, paddles } from "../ui/icons";
import { navigateTo } from "../router";
import { renderMissing } from "./missing";

export function mountBracket(container: HTMLElement, roomId: string): () => void {
  let room: PublicRoom | null = null;
  let ws: WsConnection | null = null;
  let toast = "";

  const cleanup = () => {
    ws?.close();
    setOfflineBanner(false);
  };

  const playerName = (id: string | null): string => {
    if (!id) return "Por definir";
    return room?.players.find((p) => p.id === id)?.name ?? "Por definir";
  };

  const randomizeLocked = (): boolean => {
    if (!room?.bracket) return true;
    return room.bracket.matches.some((m) => m.state.pointsA > 0 || m.state.pointsB > 0);
  };

  const render = () => {
    if (!room) return;

    const champion = room.championId ? playerName(room.championId) : null;
    const rounds = groupByRound(room.bracket?.matches ?? []);
    const lastRound = rounds.length ? rounds[rounds.length - 1]![0] : 0;
    const size = room.bracket?.size ?? 8;

    container.innerHTML = `
      <div class="bracket-view">
        <div class="page-header">
          <a class="button back-link" href="/" aria-label="Volver">${chevronLeft}</a>
          <div class="page-header__main">
            <h1>Torneo</h1>
            ${livePill()}
          </div>
          <div class="bracket-toolbar">
            <button type="button" id="copy-link">Copiar</button>
            <button type="button" id="randomize" ${randomizeLocked() ? "disabled" : ""}>Mezclar</button>
          </div>
        </div>
        ${toast ? `<p class="error-msg">${escapeHtml(toast)}</p>` : ""}
        ${champion ? `<div class="champion">Campeón ${flapStrip(champion)}</div>` : ""}
        <div class="bracket-columns">
          ${rounds
            .map(
              ([round, matches]) => `
            <div class="bracket-column" style="--slots: ${matches.length}">
              <h2 class="round-title">${roundLabel(round, lastRound)}</h2>
              <ul class="match-list">
                ${matches.map((m, i) => renderMatchCard(m, badgeFor(round, lastRound, size, i + 1))).join("")}
              </ul>
            </div>`,
            )
            .join("")}
        </div>
        <div class="bracket-foot">${paddles}</div>
      </div>
    `;

    container.querySelector("#copy-link")!.addEventListener("click", async () => {
      const url = `${location.origin}/t/${room!.id}`;
      try {
        await navigator.clipboard.writeText(url);
        toast = "Enlace copiado";
      } catch {
        toast = "No se pudo copiar";
      }
      render();
    });

    container.querySelector("#randomize")?.addEventListener("click", () => {
      toast = "";
      ws?.send({ type: "randomize" });
    });

    container.querySelectorAll<HTMLElement>("[data-match-id]").forEach((el) => {
      el.addEventListener("click", () => {
        navigateTo(`/t/${roomId}/m/${el.dataset.matchId!}`);
      });
    });
  };

  const renderMatchCard = (match: PublicMatch, badge: string): string => {
    const a = playerName(match.playerAId);
    const b = playerName(match.playerBId);
    const isBye = Boolean(match.playerAId) !== Boolean(match.playerBId);
    const completed = match.state.status === "completed";
    const inProgress = match.state.status === "in_progress";
    const openable = Boolean(match.playerAId && match.playerBId && !completed);

    if (isBye) {
      const passer = match.winnerId ? playerName(match.winnerId) : a !== "Por definir" ? a : b;
      return `<li class="match-card bye">
        ${flapIndex(badge)}
        <span class="bye-name">${escapeHtml(passer)}</span>
        <span class="bye-label">Pasa</span>
      </li>`;
    }

    const isActive = room!.activeMatchId === match.id || inProgress;
    const classes = [
      "match-card",
      completed ? "completed" : "",
      isActive ? "active" : "",
      openable ? "clickable" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `<li class="${classes}" ${openable ? `data-match-id="${match.id}"` : ""}>
      ${isActive ? `<span class="match-tag">En juego</span>` : ""}
      ${flapIndex(badge)}
      <div class="match-players">
        ${playerRow(a, match.playerAId, match, completed, inProgress)}
        ${playerRow(b, match.playerBId, match, completed, inProgress)}
      </div>
    </li>`;
  };

  const playerRow = (
    name: string,
    playerId: string | null,
    match: PublicMatch,
    completed: boolean,
    inProgress: boolean,
  ): string => {
    const pending = !playerId;
    const isWinner = Boolean(completed && playerId && match.winnerId === playerId);
    const showScore = completed || inProgress;
    const isSideA = playerId === match.playerAId;
    const points = isSideA ? match.state.pointsA : match.state.pointsB;

    let nameHtml: string;
    if (pending) nameHtml = `<span class="match-player-name is-pending">Por definir</span>`;
    else if (isWinner) nameHtml = flapStrip(name);
    else if (completed) nameHtml = `<span class="match-player-name is-muted">${escapeHtml(name)}</span>`;
    else nameHtml = `<span class="match-player-name">${escapeHtml(name)}</span>`;

    const scoreHtml = showScore
      ? `<span class="match-score">${flapPair(points)}</span>`
      : `<span class="match-score"><span class="flap flap--mini flap--outlined">–</span><span class="flap flap--mini flap--outlined">–</span></span>`;

    return `<div class="match-player">${nameHtml}${scoreHtml}</div>`;
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
        navigateTo(`/t/${roomId}`, true);
        return;
      }
      render();
    })
    .catch(() => {
      cleanup();
      renderMissing(container);
    });

  return cleanup;
}

function roundLabel(round: number, lastRound: number): string {
  const remaining = lastRound - round;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinales";
  if (remaining === 2) return "Cuartos de final";
  return "Octavos";
}

function badgeFor(round: number, lastRound: number, _size: number, slot: number): string {
  const remaining = lastRound - round;
  if (remaining === 0) return "F";
  if (remaining === 1) return `S${slot}`;
  return String(slot);
}

function groupByRound(matches: PublicMatch[]): [number, PublicMatch[]][] {
  const map = new Map<number, PublicMatch[]>();
  for (const m of matches) {
    const list = map.get(m.round) ?? [];
    list.push(m);
    map.set(m.round, list);
  }
  return [...map.entries()].sort(([a], [b]) => a - b);
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
