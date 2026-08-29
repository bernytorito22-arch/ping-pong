import type {
  Match,
  MatchSnapshot,
  MatchType,
  PointsTo,
  Rules,
  Side,
} from "./types";

export function setsNeeded(matchType: MatchType): number {
  switch (matchType) {
    case "one_set":
      return 1;
    case "best_of_3":
      return 2;
    case "best_of_5":
      return 3;
  }
}

export function isSetOver(
  pointsA: number,
  pointsB: number,
  pointsTo: PointsTo,
): boolean {
  const max = Math.max(pointsA, pointsB);
  const lead = Math.abs(pointsA - pointsB);
  return max >= pointsTo && lead >= 2;
}

export function canOpen(match: Match): boolean {
  return (
    match.playerAId !== null &&
    match.playerBId !== null &&
    match.state.status === "pending"
  );
}

function snapshotState(state: MatchSnapshot): MatchSnapshot {
  return { ...state };
}

export function applyPoint(
  match: Match,
  rules: Rules,
  side: Side,
  delta: 1 | -1,
): void {
  if (match.state.status === "completed") return;

  const pointsKey = side === "a" ? "pointsA" : "pointsB";
  const newPoints = match.state[pointsKey] + delta;
  if (newPoints < 0) return;

  match.undoStack.push(snapshotState(match.state));

  match.state[pointsKey] = newPoints;
  if (match.state.status === "pending") {
    match.state.status = "in_progress";
  }

  const { pointsA, pointsB } = match.state;
  if (!isSetOver(pointsA, pointsB, rules.pointsTo)) return;

  if (pointsA > pointsB) {
    match.state.setsA += 1;
  } else {
    match.state.setsB += 1;
  }

  const needed = setsNeeded(rules.matchType);
  if (match.state.setsA >= needed || match.state.setsB >= needed) {
    const winnerId =
      match.state.setsA >= needed ? match.playerAId! : match.playerBId!;
    match.state.status = "completed";
    match.state.winnerId = winnerId;
    match.winnerId = winnerId;
    return;
  }

  match.state.pointsA = 0;
  match.state.pointsB = 0;
}

export function undo(match: Match): void {
  const snapshot = match.undoStack.pop();
  if (!snapshot) return;
  match.state = snapshotState(snapshot);
  match.winnerId = snapshot.winnerId;
}
