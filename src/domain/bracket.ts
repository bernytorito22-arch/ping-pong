import { shuffle } from "./shuffle";
import type { Bracket, Match, MatchSnapshot, Player, Side } from "./types";

export function bracketSize(n: number): 2 | 4 | 8 | 16 {
  if (n <= 2) return 2;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  return 16;
}

export function seedOrder(size: 2 | 4 | 8 | 16): number[] {
  if (size === 2) return [1, 2];
  const half = seedOrder((size / 2) as 2 | 4 | 8 | 16);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed);
    result.push(size + 1 - seed);
  }
  return result;
}

function emptySnapshot(): MatchSnapshot {
  return {
    pointsA: 0,
    pointsB: 0,
    setsA: 0,
    setsB: 0,
    status: "pending",
    winnerId: null,
  };
}

function completedSnapshot(winnerId: string): MatchSnapshot {
  return {
    pointsA: 0,
    pointsB: 0,
    setsA: 0,
    setsB: 0,
    status: "completed",
    winnerId,
  };
}

function matchId(round: number, slot: number): string {
  return `m-r${round}-s${slot}`;
}

function parentOfInBracket(
  round: number,
  slot: number,
  size: 2 | 4 | 8 | 16,
): string | null {
  const finalRound = Math.log2(size) - 1;
  if (round >= finalRound) return null;
  return matchId(round + 1, Math.floor(slot / 2));
}

export function parentOf(matchIdStr: string): string | null {
  const parsed = matchIdStr.match(/^m-r(\d+)-s(\d+)$/);
  if (!parsed) return null;
  const round = Number(parsed[1]);
  const slot = Number(parsed[2]);
  if (round >= 2) return null;
  return matchId(round + 1, Math.floor(slot / 2));
}

export function sideInParent(matchIdStr: string): Side {
  const match = matchIdStr.match(/^m-r\d+-s(\d+)$/);
  if (!match) return "a";
  return Number(match[1]) % 2 === 0 ? "a" : "b";
}

export function hasAnyPlayedPoints(bracket: Bracket): boolean {
  return bracket.matches.some(
    (m) => m.state.pointsA > 0 || m.state.pointsB > 0,
  );
}

function seedToPlayerId(
  seed: number,
  players: Player[],
): string | null {
  if (seed > players.length) return null;
  return players[seed - 1].id;
}

function createMatches(size: 2 | 4 | 8 | 16): Match[] {
  const rounds = Math.log2(size);
  const matches: Match[] = [];
  for (let round = 0; round < rounds; round++) {
    const slotsInRound = size / 2 ** (round + 1);
    for (let slot = 0; slot < slotsInRound; slot++) {
      matches.push({
        id: matchId(round, slot),
        round,
        slot,
        playerAId: null,
        playerBId: null,
        winnerId: null,
        state: emptySnapshot(),
        undoStack: [],
      });
    }
  }
  return matches;
}

function promoteWinner(
  matches: Match[],
  child: Match,
  size: 2 | 4 | 8 | 16,
): void {
  const parentId = parentOfInBracket(child.round, child.slot, size);
  if (!parentId || !child.winnerId) return;
  const parent = matches.find((m) => m.id === parentId);
  if (!parent) return;
  const side = sideInParent(child.id);
  if (side === "a") {
    parent.playerAId = child.winnerId;
  } else {
    parent.playerBId = child.winnerId;
  }
}

export function buildBracketFromOrder(players: Player[]): Bracket {
  const size = bracketSize(players.length);
  const order = seedOrder(size);
  const matches = createMatches(size);

  const round0 = matches.filter((m) => m.round === 0);
  for (let slot = 0; slot < round0.length; slot++) {
    const match = round0[slot];
    const seedA = order[slot * 2];
    const seedB = order[slot * 2 + 1];
    match.playerAId = seedToPlayerId(seedA, players);
    match.playerBId = seedToPlayerId(seedB, players);

    const hasBye =
      match.playerAId === null || match.playerBId === null;

    if (hasBye) {
      const winnerId =
        match.playerAId ?? match.playerBId;
      match.winnerId = winnerId;
      match.state = completedSnapshot(winnerId!);
      promoteWinner(matches, match, size);
    }
  }

  return { size, matches };
}

export function buildBracket(
  players: Player[],
  rng: () => number,
): Bracket {
  return buildBracketFromOrder(shuffle(players, rng));
}
