import { renderHome } from "./views/home";
import { renderMissing } from "./views/missing";
import { renderSetupTournament } from "./views/setup-tournament";
import { renderSetupScoreboard } from "./views/setup-scoreboard";
import { mountBracket } from "./views/bracket";
import { mountScoreboard, mountScoreboardRoom } from "./views/scoreboard";
import { fetchRoom } from "./api";

type Route =
  | { name: "home" }
  | { name: "setup-tournament" }
  | { name: "setup-scoreboard" }
  | { name: "room"; id: string }
  | { name: "match"; id: string; matchId: string }
  | { name: "missing" };

let unmount: (() => void) | null = null;

function parseRoute(pathname: string): Route {
  if (pathname === "/") return { name: "home" };
  if (pathname === "/nuevo") return { name: "setup-tournament" };
  if (pathname === "/marcador") return { name: "setup-scoreboard" };

  const match = pathname.match(/^\/t\/([23456789abcdefghjkmnpqrstuvwxyz]{6})\/m\/([^/]+)$/i);
  if (match) {
    return { name: "match", id: match[1]!.toLowerCase(), matchId: match[2]! };
  }

  const room = pathname.match(/^\/t\/([23456789abcdefghjkmnpqrstuvwxyz]{6})$/i);
  if (room) return { name: "room", id: room[1]!.toLowerCase() };

  return { name: "missing" };
}

function render(route: Route): void {
  unmount?.();
  unmount = null;

  const app = document.getElementById("app");
  if (!app) return;

  switch (route.name) {
    case "home":
      renderHome(app);
      break;
    case "setup-tournament":
      renderSetupTournament(app);
      break;
    case "setup-scoreboard":
      renderSetupScoreboard(app);
      break;
    case "room":
      unmount = mountRoom(app, route.id);
      break;
    case "match":
      unmount = mountScoreboard(app, route.id, route.matchId);
      break;
    case "missing":
      renderMissing(app);
      break;
  }
}

function navigate(): void {
  render(parseRoute(location.pathname));
}

function mountRoom(container: HTMLElement, roomId: string): () => void {
  let cancelled = false;
  let innerCleanup: (() => void) | null = null;

  void fetchRoom(roomId).then((room) => {
    if (cancelled) return;
    if (!room) {
      renderMissing(container);
      return;
    }
    innerCleanup =
      room.mode === "scoreboard"
        ? mountScoreboardRoom(container, roomId)
        : mountBracket(container, roomId);
  });

  return () => {
    cancelled = true;
    innerCleanup?.();
  };
}

window.addEventListener("popstate", navigate);
navigate();
