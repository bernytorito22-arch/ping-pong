import { describe, it, expect } from "vitest";
import type { Player } from "../../src/domain/types";
import {
  bracketSize,
  seedOrder,
  buildBracketFromOrder,
  buildBracket,
  parentOf,
  sideInParent,
  hasAnyPlayedPoints,
} from "../../src/domain/bracket";

function players(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

describe("bracketSize", () => {
  it("returns next power of 2", () => {
    expect(bracketSize(2)).toBe(2);
    expect(bracketSize(3)).toBe(4);
    expect(bracketSize(5)).toBe(8);
    expect(bracketSize(8)).toBe(8);
    expect(bracketSize(9)).toBe(16);
    expect(bracketSize(16)).toBe(16);
  });
});

describe("seedOrder", () => {
  it("places seeds in standard single-elim order", () => {
    expect(seedOrder(2)).toEqual([1, 2]);
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe("buildBracketFromOrder", () => {
  it("creates 1 real round-0 match and 3 bye promotions for 5 players", () => {
    const roster = players(5);
    const bracket = buildBracketFromOrder(roster);

    expect(bracket.size).toBe(8);

    const round0 = bracket.matches.filter((m) => m.round === 0);
    expect(round0).toHaveLength(4);

    const realMatches = round0.filter(
      (m) => m.playerAId !== null && m.playerBId !== null,
    );
    expect(realMatches).toHaveLength(1);
    expect(realMatches[0].playerAId).toBe("p4");
    expect(realMatches[0].playerBId).toBe("p5");
    expect(realMatches[0].state.status).toBe("pending");

    const byeMatches = round0.filter(
      (m) => m.playerAId === null || m.playerBId === null,
    );
    expect(byeMatches).toHaveLength(3);
    for (const m of byeMatches) {
      expect(m.state.status).toBe("completed");
      expect(m.winnerId).not.toBeNull();
      expect(m.state.winnerId).toBe(m.winnerId);
    }

    const round1 = bracket.matches.filter((m) => m.round === 1);
    const promoted = round1.filter(
      (m) => m.playerAId !== null || m.playerBId !== null,
    );
    expect(promoted.length).toBeGreaterThan(0);
    for (const m of byeMatches) {
      const parentId = parentOf(m.id);
      const parent = bracket.matches.find((x) => x.id === parentId);
      expect(parent).toBeDefined();
      const side = sideInParent(m.id);
      expect(parent![side === "a" ? "playerAId" : "playerBId"]).toBe(
        m.winnerId,
      );
    }
  });

  it("uses match ids m-r{round}-s{slot}", () => {
    const bracket = buildBracketFromOrder(players(4));
    expect(bracket.matches.map((m) => m.id)).toContain("m-r0-s0");
    expect(bracket.matches.map((m) => m.id)).toContain("m-r1-s0");
  });
});

describe("parentOf / sideInParent", () => {
  it("maps round-0 slots to round-1 parents", () => {
    expect(parentOf("m-r0-s0")).toBe("m-r1-s0");
    expect(parentOf("m-r0-s1")).toBe("m-r1-s0");
    expect(parentOf("m-r0-s2")).toBe("m-r1-s1");
    expect(parentOf("m-r0-s3")).toBe("m-r1-s1");
    expect(parentOf("m-r2-s0")).toBeNull();

    expect(sideInParent("m-r0-s0")).toBe("a");
    expect(sideInParent("m-r0-s1")).toBe("b");
    expect(sideInParent("m-r0-s2")).toBe("a");
    expect(sideInParent("m-r0-s3")).toBe("b");
  });
});

describe("hasAnyPlayedPoints", () => {
  it("returns false for a fresh bracket", () => {
    const bracket = buildBracketFromOrder(players(4));
    expect(hasAnyPlayedPoints(bracket)).toBe(false);
  });
});

describe("buildBracket", () => {
  it("shuffles players before seeding", () => {
    const roster = players(4);
    let call = 0;
    const rng = () => {
      const values = [0.9, 0.1, 0.5];
      return values[call++ % values.length];
    };
    const bracket = buildBracket(roster, rng);
    expect(bracket.size).toBe(4);
    expect(bracket.matches.length).toBe(3);
  });
});
