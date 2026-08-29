import type { RoomMode } from "./types";

export function normalizeName(raw: string): string {
  const name = raw.trim();
  if (!name) {
    throw new Error("empty name");
  }
  return name;
}

export function uniqueNames(names: string[]): string[] {
  const baseByKey = new Map<string, string>();
  const countByKey = new Map<string, number>();

  return names.map((raw) => {
    const name = normalizeName(raw);
    const key = name.toLowerCase();
    const count = countByKey.get(key) ?? 0;

    if (count === 0) {
      baseByKey.set(key, name);
      countByKey.set(key, 1);
      return name;
    }

    const next = count + 1;
    countByKey.set(key, next);
    return `${baseByKey.get(key)!} ${next}`;
  });
}

export function assertPlayerCount(n: number, mode: RoomMode): void {
  if (mode === "tournament" && (n < 2 || n > 16)) {
    throw new Error("tournament requires 2–16 players");
  }
  if (mode === "scoreboard" && n !== 2) {
    throw new Error("scoreboard requires exactly 2 players");
  }
}
