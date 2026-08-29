export type MatchType = "one_set" | "best_of_3" | "best_of_5";
export type PointsTo = 7 | 11;
export type RoomMode = "tournament" | "scoreboard";
export type MatchStatus = "pending" | "in_progress" | "completed";
export type Side = "a" | "b";

export interface Rules {
  pointsTo: PointsTo;
  matchType: MatchType;
}

export interface Player {
  id: string;
  name: string;
}

export interface MatchSnapshot {
  pointsA: number;
  pointsB: number;
  setsA: number;
  setsB: number;
  status: MatchStatus;
  winnerId: string | null;
}

export interface Match {
  id: string;
  round: number;
  slot: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  state: MatchSnapshot;
  undoStack: MatchSnapshot[];
}

export interface Bracket {
  size: 2 | 4 | 8 | 16;
  matches: Match[];
}

export interface Room {
  id: string;
  mode: RoomMode;
  createdAt: number;
  lastWrittenAt: number;
  rules: Rules;
  players: Player[];
  bracket: Bracket | null;
  scoreboardMatch: Match | null;
  activeMatchId: string | null;
  championId: string | null;
}

export type Command =
  | { type: "point"; matchId: string; side: Side; delta: 1 | -1 }
  | { type: "undo"; matchId: string }
  | { type: "openMatch"; matchId: string }
  | { type: "randomize" }
  | { type: "resetScoreboard" };

export type ApplyErrorCode =
  | "not_found"
  | "expired"
  | "invalid"
  | "match_not_ready"
  | "randomize_locked"
  | "undo_blocked";
