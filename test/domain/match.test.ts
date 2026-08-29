import { describe, it, expect } from "vitest";
import type { Match, Rules } from "../../src/domain/types";
import {
  setsNeeded,
  isSetOver,
  applyPoint,
  undo,
  canOpen,
} from "../../src/domain/match";

const rules11: Rules = { pointsTo: 11, matchType: "one_set" };
const rulesBo3: Rules = { pointsTo: 11, matchType: "best_of_3" };

function createMatch(overrides?: Partial<Match>): Match {
  return {
    id: "m1",
    round: 0,
    slot: 0,
    playerAId: "p1",
    playerBId: "p2",
    winnerId: null,
    state: {
      pointsA: 0,
      pointsB: 0,
      setsA: 0,
      setsB: 0,
      status: "in_progress",
      winnerId: null,
    },
    undoStack: [],
    ...overrides,
  };
}

function scoreSet(match: Match, rules: Rules, winner: "a" | "b") {
  const target = rules.pointsTo;
  const loserPts = target - 2;
  if (winner === "a") {
    for (let i = match.state.pointsA; i < target; i++) {
      applyPoint(match, rules, "a", 1);
    }
    for (let i = match.state.pointsB; i < loserPts; i++) {
      applyPoint(match, rules, "b", 1);
    }
  } else {
    for (let i = match.state.pointsB; i < target; i++) {
      applyPoint(match, rules, "b", 1);
    }
    for (let i = match.state.pointsA; i < loserPts; i++) {
      applyPoint(match, rules, "a", 1);
    }
  }
}

describe("setsNeeded", () => {
  it("returns sets to win per match type", () => {
    expect(setsNeeded("one_set")).toBe(1);
    expect(setsNeeded("best_of_3")).toBe(2);
    expect(setsNeeded("best_of_5")).toBe(3);
  });
});

describe("isSetOver", () => {
  it("closes at 11-9", () => {
    expect(isSetOver(11, 9, 11)).toBe(true);
  });

  it("does not close at 11-10", () => {
    expect(isSetOver(11, 10, 11)).toBe(false);
  });

  it("closes at 12-10", () => {
    expect(isSetOver(12, 10, 11)).toBe(true);
  });
});

describe("applyPoint", () => {
  it("closes Bo3 match at 2-0 sets", () => {
    const match = createMatch();
    scoreSet(match, rulesBo3, "a");
    expect(match.state.setsA).toBe(1);
    expect(match.state.status).toBe("in_progress");
    scoreSet(match, rulesBo3, "a");
    expect(match.state.setsA).toBe(2);
    expect(match.state.status).toBe("completed");
    expect(match.winnerId).toBe("p1");
    expect(match.state.winnerId).toBe("p1");
  });

  it("no-ops minus below 0", () => {
    const match = createMatch();
    applyPoint(match, rules11, "a", -1);
    expect(match.state.pointsA).toBe(0);
    expect(match.undoStack).toHaveLength(0);
  });

  it("no-ops when match is completed", () => {
    const match = createMatch({
      winnerId: "p1",
      state: {
        pointsA: 11,
        pointsB: 9,
        setsA: 1,
        setsB: 0,
        status: "completed",
        winnerId: "p1",
      },
    });
    applyPoint(match, rules11, "a", 1);
    expect(match.state.pointsA).toBe(11);
    expect(match.undoStack).toHaveLength(0);
  });
});

describe("undo", () => {
  it("restores previous state", () => {
    const match = createMatch();
    applyPoint(match, rules11, "a", 1);
    applyPoint(match, rules11, "b", 1);
    expect(match.state.pointsA).toBe(1);
    expect(match.state.pointsB).toBe(1);
    undo(match);
    expect(match.state.pointsA).toBe(1);
    expect(match.state.pointsB).toBe(0);
    undo(match);
    expect(match.state.pointsA).toBe(0);
    expect(match.state.pointsB).toBe(0);
  });
});

describe("canOpen", () => {
  it("allows open when both players ready and pending", () => {
    const match = createMatch({
      state: {
        pointsA: 0,
        pointsB: 0,
        setsA: 0,
        setsB: 0,
        status: "pending",
        winnerId: null,
      },
    });
    expect(canOpen(match)).toBe(true);
  });

  it("blocks open when a player is missing", () => {
    const match = createMatch({ playerBId: null });
    expect(canOpen(match)).toBe(false);
  });
});
