import {
  buildBracket,
  hasAnyPlayedPoints,
  sideInParent,
} from "./bracket";
import { applyPoint, canOpen, undo } from "./match";
import { assertPlayerCount, uniqueNames } from "./names";
import type {
  ApplyErrorCode,
  Command,
  Match,
  Player,
  Room,
  RoomMode,
  Rules,
} from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface CreateRoomInput {
  id: string;
  mode: RoomMode;
  names: string[];
  rules: Rules;
  now: number;
  rng: () => number;
}

function throwApply(code: ApplyErrorCode): never {
  throw { code };
}

function createScoreboardMatch(players: Player[]): Match {
  return {
    id: "scoreboard",
    round: 0,
    slot: 0,
    playerAId: players[0].id,
    playerBId: players[1].id,
    winnerId: null,
    state: {
      pointsA: 0,
      pointsB: 0,
      setsA: 0,
      setsB: 0,
      status: "pending",
      winnerId: null,
    },
    undoStack: [],
  };
}

function parentMatchId(
  match: Match,
  size: 2 | 4 | 8 | 16,
): string | null {
  const finalRound = Math.log2(size) - 1;
  if (match.round >= finalRound) return null;
  return `m-r${match.round + 1}-s${Math.floor(match.slot / 2)}`;
}

export function findMatchById(room: Room, matchId: string): Match | null {
  if (room.scoreboardMatch?.id === matchId) {
    return room.scoreboardMatch;
  }
  if (!room.bracket) return null;
  return room.bracket.matches.find((m) => m.id === matchId) ?? null;
}

function parentHasPlayedPoints(room: Room, match: Match): boolean {
  if (!room.bracket) return false;
  const parentId = parentMatchId(match, room.bracket.size);
  if (!parentId) return false;
  const parent = findMatchById(room, parentId);
  if (!parent) return false;
  return (
    parent.state.pointsA > 0 ||
    parent.state.pointsB > 0 ||
    parent.state.setsA > 0 ||
    parent.state.setsB > 0
  );
}

function promoteWinnerToParent(room: Room, match: Match): void {
  if (!room.bracket || !match.winnerId) return;
  const parentId = parentMatchId(match, room.bracket.size);
  if (!parentId) {
    room.championId = match.winnerId;
    return;
  }
  const parent = findMatchById(room, parentId);
  if (!parent) return;
  const side = sideInParent(match.id);
  if (side === "a") {
    parent.playerAId = match.winnerId;
  } else {
    parent.playerBId = match.winnerId;
  }
}

function demoteWinnerFromParent(room: Room, match: Match): void {
  if (!room.bracket) return;
  const parentId = parentMatchId(match, room.bracket.size);
  if (!parentId) return;
  const parent = findMatchById(room, parentId);
  if (!parent) return;
  const side = sideInParent(match.id);
  if (side === "a") {
    parent.playerAId = null;
  } else {
    parent.playerBId = null;
  }
  if (room.championId) {
    room.championId = null;
  }
}

export function createRoom(input: CreateRoomInput): Room {
  const { id, mode, names, rules, now, rng } = input;
  assertPlayerCount(names.length, mode);
  const resolved = uniqueNames(names);
  const players: Player[] = resolved.map((name, index) => ({
    id: `p${index + 1}`,
    name,
  }));

  if (mode === "tournament") {
    return {
      id,
      mode,
      createdAt: now,
      lastWrittenAt: now,
      rules,
      players,
      bracket: buildBracket(players, rng),
      scoreboardMatch: null,
      activeMatchId: null,
      championId: null,
    };
  }

  return {
    id,
    mode,
    createdAt: now,
    lastWrittenAt: now,
    rules,
    players,
    bracket: null,
    scoreboardMatch: createScoreboardMatch(players),
    activeMatchId: null,
    championId: null,
  };
}

export function isExpired(
  room: Room,
  now: number,
  ttlMs = THIRTY_DAYS_MS,
): boolean {
  return now - room.lastWrittenAt > ttlMs;
}

export function applyCommand(
  room: Room,
  cmd: Command,
  now: number,
  rng: () => number,
): void {
  switch (cmd.type) {
    case "randomize": {
      if (room.mode !== "tournament" || !room.bracket) {
        throwApply("invalid");
      }
      if (hasAnyPlayedPoints(room.bracket)) {
        throwApply("randomize_locked");
      }
      room.bracket = buildBracket(room.players, rng);
      room.lastWrittenAt = now;
      return;
    }
    case "openMatch": {
      const match = findMatchById(room, cmd.matchId);
      if (!match) throwApply("not_found");
      if (!canOpen(match)) throwApply("match_not_ready");
      match.state.status = "in_progress";
      room.activeMatchId = cmd.matchId;
      room.lastWrittenAt = now;
      return;
    }
    case "point": {
      const match = findMatchById(room, cmd.matchId);
      if (!match) throwApply("not_found");
      const wasCompleted = match.state.status === "completed";
      applyPoint(match, room.rules, cmd.side, cmd.delta);
      if (!wasCompleted && match.state.status === "completed") {
        promoteWinnerToParent(room, match);
      }
      room.lastWrittenAt = now;
      return;
    }
    case "undo": {
      const match = findMatchById(room, cmd.matchId);
      if (!match) throwApply("not_found");
      if (
        match.state.status === "completed" &&
        parentHasPlayedPoints(room, match)
      ) {
        throwApply("undo_blocked");
      }
      const wasCompleted = match.state.status === "completed";
      undo(match);
      if (wasCompleted) {
        demoteWinnerFromParent(room, match);
      }
      room.lastWrittenAt = now;
      return;
    }
    case "resetScoreboard": {
      if (room.mode !== "scoreboard") throwApply("invalid");
      room.scoreboardMatch = createScoreboardMatch(room.players);
      room.activeMatchId = null;
      room.championId = null;
      room.lastWrittenAt = now;
      return;
    }
  }
}
