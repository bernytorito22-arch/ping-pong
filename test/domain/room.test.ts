import { describe, it, expect } from "vitest";
import type { Room, Rules } from "../../src/domain/types";
import {
  createRoom,
  isExpired,
  applyCommand,
  findMatchById,
} from "../../src/domain/room";

const rules: Rules = { pointsTo: 11, matchType: "one_set" };
const NOW = 1_700_000_000_000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const rng = () => 0.5;

function expectApplyError(
  fn: () => void,
  code: "randomize_locked" | "undo_blocked",
) {
  try {
    fn();
    expect.unreachable("expected applyCommand to throw");
  } catch (err) {
    expect(err).toEqual({ code });
  }
}

function createTournament(names: string[]): Room {
  return createRoom({
    id: "room-1",
    mode: "tournament",
    names,
    rules,
    now: NOW,
    rng,
  });
}

function createScoreboard(names: [string, string]): Room {
  return createRoom({
    id: "room-2",
    mode: "scoreboard",
    names,
    rules,
    now: NOW,
    rng,
  });
}

function playableMatch(room: Room) {
  const match = room.bracket!.matches.find(
    (m) =>
      m.playerAId !== null &&
      m.playerBId !== null &&
      m.state.status !== "completed",
  );
  if (!match) throw new Error("no playable match");
  return match;
}

function winSet(room: Room, matchId: string, side: "a" | "b") {
  const match = findMatchById(room, matchId)!;
  const target = room.rules.pointsTo;
  const loserPts = target - 2;
  const winnerSide = side;
  const loserSide = side === "a" ? "b" : "a";
  for (let i = match.state[winnerSide === "a" ? "pointsA" : "pointsB"]; i < target; i++) {
    applyCommand(room, { type: "point", matchId, side: winnerSide, delta: 1 }, NOW, rng);
  }
  for (let i = match.state[loserSide === "a" ? "pointsA" : "pointsB"]; i < loserPts; i++) {
    applyCommand(room, { type: "point", matchId, side: loserSide, delta: 1 }, NOW, rng);
  }
}

describe("isExpired", () => {
  it("returns false within 30 days of last write", () => {
    const room = createTournament(["A", "B", "C"]);
    expect(isExpired(room, NOW + THIRTY_DAYS_MS)).toBe(false);
  });

  it("returns true after 30 days without writes", () => {
    const room = createTournament(["A", "B", "C"]);
    expect(isExpired(room, NOW + THIRTY_DAYS_MS + 1)).toBe(true);
  });
});

describe("createRoom", () => {
  it("deduplicates names and builds a tournament bracket", () => {
    const room = createTournament(["Ana", "ana", "Bob"]);
    expect(room.players.map((p) => p.name)).toEqual(["Ana", "Ana 2", "Bob"]);
    expect(room.bracket?.size).toBe(4);
    expect(room.scoreboardMatch).toBeNull();
  });

  it("creates a scoreboard match for two players", () => {
    const room = createScoreboard(["X", "Y"]);
    expect(room.bracket).toBeNull();
    expect(room.scoreboardMatch?.playerAId).toBe("p1");
    expect(room.scoreboardMatch?.playerBId).toBe("p2");
  });
});

describe("applyCommand randomize", () => {
  it("rebuilds bracket when no points played", () => {
    const room = createTournament(["A", "B", "C"]);
    const before = room.bracket!.matches.map((m) => m.id).join(",");
    applyCommand(room, { type: "randomize" }, NOW + 1, () => 0.1);
    const after = room.bracket!.matches.map((m) => m.id).join(",");
    expect(after).toBe(before);
    expect(room.lastWrittenAt).toBe(NOW + 1);
  });

  it("throws randomize_locked after any point is played", () => {
    const room = createTournament(["A", "B", "C"]);
    const match = playableMatch(room);
    applyCommand(room, { type: "openMatch", matchId: match.id }, NOW, rng);
    applyCommand(
      room,
      { type: "point", matchId: match.id, side: "a", delta: 1 },
      NOW,
      rng,
    );
    expectApplyError(
      () => applyCommand(room, { type: "randomize" }, NOW, rng),
      "randomize_locked",
    );
  });
});

describe("applyCommand tournament play-through", () => {
  it("plays a 3-player bracket through to champion", () => {
    const room = createTournament(["A", "B", "C"]);
    const semi = playableMatch(room);

    applyCommand(room, { type: "openMatch", matchId: semi.id }, NOW, rng);
    expect(findMatchById(room, semi.id)!.state.status).toBe("in_progress");
    expect(room.activeMatchId).toBe(semi.id);

    winSet(room, semi.id, "a");
    const semiMatch = findMatchById(room, semi.id)!;
    expect(semiMatch.state.status).toBe("completed");
    expect(semiMatch.winnerId).toBe(semi.playerAId);

    const final = room.bracket!.matches.find((m) => m.round === 1)!;
    expect(final.playerAId).toBeTruthy();
    expect(final.playerBId).toBe(semi.winnerId);

    applyCommand(room, { type: "openMatch", matchId: final.id }, NOW, rng);
    winSet(room, final.id, "b");
    expect(room.championId).toBe(final.playerBId);
    expect(final.state.status).toBe("completed");
  });

  it("blocks undo after close when parent match has points", () => {
    const room = createTournament(["A", "B", "C"]);
    const semi = playableMatch(room);
    applyCommand(room, { type: "openMatch", matchId: semi.id }, NOW, rng);
    winSet(room, semi.id, "a");

    const final = room.bracket!.matches.find((m) => m.round === 1)!;
    applyCommand(room, { type: "openMatch", matchId: final.id }, NOW, rng);
    applyCommand(
      room,
      { type: "point", matchId: final.id, side: "a", delta: 1 },
      NOW,
      rng,
    );

    expectApplyError(
      () => applyCommand(room, { type: "undo", matchId: semi.id }, NOW, rng),
      "undo_blocked",
    );
  });
});

describe("applyCommand scoreboard", () => {
  it("resets the scoreboard match", () => {
    const room = createScoreboard(["X", "Y"]);
    const matchId = room.scoreboardMatch!.id;
    applyCommand(room, { type: "openMatch", matchId }, NOW, rng);
    applyCommand(
      room,
      { type: "point", matchId, side: "a", delta: 1 },
      NOW,
      rng,
    );
    applyCommand(room, { type: "resetScoreboard" }, NOW, rng);
    const match = room.scoreboardMatch!;
    expect(match.state.pointsA).toBe(0);
    expect(match.state.pointsB).toBe(0);
    expect(match.state.status).toBe("pending");
    expect(match.undoStack).toHaveLength(0);
    expect(room.activeMatchId).toBeNull();
  });
});

describe("findMatchById", () => {
  it("finds bracket and scoreboard matches", () => {
    const tournament = createTournament(["A", "B"]);
    expect(findMatchById(tournament, "m-r0-s0")).toBeDefined();

    const scoreboard = createScoreboard(["X", "Y"]);
    expect(findMatchById(scoreboard, scoreboard.scoreboardMatch!.id)).toBe(
      scoreboard.scoreboardMatch,
    );
  });
});
