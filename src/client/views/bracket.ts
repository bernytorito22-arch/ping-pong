import {
  connectWebSocket,
  setOfflineBanner,
  type PublicMatch,
  type PublicRoom,
  type WsConnection,
} from "../api";
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
    if (!id) return "—";
    return room?.players.find((p) => p.id === id)?.name ?? "—";
  };

  const randomizeLocked = (): boolean => {
    if (!room?.bracket) return true;
    return room.bracket.matches.some(
      (m) => m.state.pointsA > 0 || m.state.pointsB > 0,
    );
  };

  const render = () => {
    if (!room) return;

    const champion = room.championId ? playerName(room.championId) : null;
    const rounds = groupByRound(room.bracket?.matches ?? []);

    container.innerHTML = `
      <div class="stack">
        <h1>Torneo</h1>
        <p>Código: <strong>${escapeHtml(room.id)}</strong></p>
        ${toast ? `<p class="error-msg">${escapeHtml(toast)}</p>` : ""}
        ${champion ? `<div class="champion">Campeón: ${escapeHtml(champion)}</div>` : ""}
        <div class="row">
          <button type="button" id="copy-link">Copiar enlace</button>
          <button type="button" id="randomize" ${randomizeLocked() ? "disabled" : ""}>Mezclar llave</button>
        </div>
        ${rounds
          .map(
            ([round, matches]) => `
          <h2 class="round-title">Ronda ${round + 1}</h2>
          <ul class="match-list">
            ${matches.map((m) => renderMatchCard(m)).join("")}
          </ul>`,
          )
          .join("")}
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
        const matchId = el.dataset.matchId!;
        location.href = `/t/${roomId}/m/${matchId}`;
      });
    });
  };

  const renderMatchCard = (match: PublicMatch): string => {
    const a = playerName(match.playerAId);
    const b = playerName(match.playerBId);
    const isBye = !match.playerAId || !match.playerBId;
    const completed = match.state.status === "completed";
    const openable =
      match.playerAId && match.playerBId && !completed;

    if (isBye) {
      const passer = match.winnerId ? playerName(match.winnerId) : a !== "—" ? a : b;
      return `<li class="match-card bye">${escapeHtml(passer)} pasa</li>`;
    }

    const score =
      completed || match.state.status === "in_progress"
        ? ` — ${match.state.setsA}-${match.state.setsB} (${match.state.pointsA}-${match.state.pointsB})`
        : "";

    const classes = ["match-card", completed ? "completed" : "", openable ? "clickable" : ""]
      .filter(Boolean)
      .join(" ");

    return `<li class="${classes}" ${openable ? `data-match-id="${match.id}"` : ""}>
      ${escapeHtml(a)} vs ${escapeHtml(b)}${score}
    </li>`;
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
        location.replace(`/t/${roomId}`);
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
