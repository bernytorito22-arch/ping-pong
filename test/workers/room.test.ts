import { env, runInDurableObject, SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { newRoomId } from "../../src/id";
import type { PublicRoom, Room } from "../../src/room-do";

const rules = { pointsTo: 11 as const, matchType: "one_set" as const };
const THIRTY_ONE_DAYS_MS = 31 * 24 * 60 * 60 * 1000;

describe("newRoomId", () => {
  it("genera 6 caracteres del alfabeto seguro", () => {
    const id = newRoomId();
    expect(id).toHaveLength(6);
    expect(id).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/);
  });
});

describe("worker API", () => {
  it("POST /api/rooms crea sala y devuelve id", async () => {
    const res = await SELF.fetch("https://example.com/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "tournament",
        names: ["Ana", "Beto"],
        rules,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    expect(body.id).toMatch(/^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/);
  });

  it("GET /api/rooms/:id devuelve snapshot sin undoStack", async () => {
    const created = await SELF.fetch("https://example.com/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "scoreboard",
        names: ["Ana", "Beto"],
        rules,
      }),
    });
    const { id } = (await created.json()) as { id: string };

    const res = await SELF.fetch(`https://example.com/api/rooms/${id}`);
    expect(res.status).toBe(200);
    const room = (await res.json()) as PublicRoom;
    expect(room.id).toBe(id);
    expect(room.scoreboardMatch).not.toBeNull();
    expect(room.scoreboardMatch).not.toHaveProperty("undoStack");
  });

  it("GET /api/rooms/:id responde 404 si no existe", async () => {
    const res = await SELF.fetch("https://example.com/api/rooms/abcdef");
    expect(res.status).toBe(404);
  });
});

describe("Room durable object", () => {
  it("snapshot devuelve null y borra storage si expiró", async () => {
    const stub = env.ROOMS.get(env.ROOMS.idFromName("expired-room"));
    await stub.create({
      id: "expired-room",
      mode: "scoreboard",
      names: ["Ana", "Beto"],
      rules,
    });

    await runInDurableObject(stub, async (_instance, state) => {
      const stored = await state.storage.get<{ lastWrittenAt: number }>("room");
      stored!.lastWrittenAt = Date.now() - THIRTY_ONE_DAYS_MS;
      await state.storage.put("room", stored);
    });

    const snap = await stub.snapshot();
    expect(snap).toBeNull();

    await runInDurableObject(stub, async (_instance, state) => {
      expect(await state.storage.get("room")).toBeUndefined();
    });
  });

  it("command persiste y devuelve snapshot sin undoStack", async () => {
    const stub = env.ROOMS.get(env.ROOMS.idFromName("cmd-room"));
    const created = await stub.create({
      id: "cmd-room",
      mode: "scoreboard",
      names: ["Ana", "Beto"],
      rules,
    });
    const matchId = created.scoreboardMatch!.id;

    const updated = await stub.command({
      type: "point",
      matchId,
      side: "a",
      delta: 1,
    });
    expect(updated.scoreboardMatch).not.toHaveProperty("undoStack");
    expect(updated.scoreboardMatch!.state.pointsA).toBe(1);
  });

  it("fetch hace upgrade WebSocket", async () => {
    const stub = env.ROOMS.get(env.ROOMS.idFromName("ws-room"));
    await stub.create({
      id: "ws-room",
      mode: "scoreboard",
      names: ["Ana", "Beto"],
      rules,
    });

    const upgrade = await stub.fetch("https://example.com/ws", {
      headers: { Upgrade: "websocket" },
    });
    expect(upgrade.status).toBe(101);
    expect(upgrade.webSocket).toBeDefined();
  });

  it("hello por WS devuelve estado", async () => {
    const stub = env.ROOMS.get(env.ROOMS.idFromName("hello-room"));
    await stub.create({
      id: "hello-room",
      mode: "scoreboard",
      names: ["Ana", "Beto"],
      rules,
    });

    const messages: string[] = [];
    await runInDurableObject(stub, async (instance: Room) => {
      const ws = { send: (data: string) => messages.push(data) } as WebSocket;
      await instance.webSocketMessage(ws, JSON.stringify({ type: "hello" }));
    });

    const msg = JSON.parse(messages[0]!) as { type: string; room: PublicRoom };
    expect(msg.type).toBe("state");
    expect(msg.room.players).toHaveLength(2);
    expect(msg.room.scoreboardMatch).not.toHaveProperty("undoStack");
  });

  it("errores por WS en español", async () => {
    const stub = env.ROOMS.get(env.ROOMS.idFromName("err-room"));
    await stub.create({
      id: "err-room",
      mode: "scoreboard",
      names: ["Ana", "Beto"],
      rules,
    });

    const messages: string[] = [];
    await runInDurableObject(stub, async (instance: Room) => {
      const ws = { send: (data: string) => messages.push(data) } as WebSocket;
      await instance.webSocketMessage(
        ws,
        JSON.stringify({
          type: "point",
          matchId: "missing",
          side: "a",
          delta: 1,
        }),
      );
    });

    expect(JSON.parse(messages[0]!)).toEqual({
      type: "error",
      code: "not_found",
      message: "No encontrado",
    });
  });
});
