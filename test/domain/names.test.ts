import { describe, it, expect } from "vitest";
import { uniqueNames, assertPlayerCount } from "../../src/domain/names";

it("añade sufijos a duplicados ignorando mayúsculas", () => {
  expect(uniqueNames(["Ana", "ana", "Beto"])).toEqual(["Ana", "Ana 2", "Beto"]);
});

it("rechaza torneo fuera de 2–16", () => {
  expect(() => assertPlayerCount(1, "tournament")).toThrow();
  expect(() => assertPlayerCount(17, "tournament")).toThrow();
});
