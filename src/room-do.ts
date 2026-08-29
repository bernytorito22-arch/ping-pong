import { DurableObject } from "cloudflare:workers";
import { applyCommand, createRoom, isExpired } from "./domain/room";
import type {
  ApplyErrorCode,
  Bracket,
  Command,
  Match,
  Room as DomainRoom,
  RoomMode,
  Rules,
} from "./domain/types";
import { errorMessage, isApplyError } from "./errors";

export interface CreateInit {
  id: string;
  mode: RoomMode;
  names: string[];
  rules: Rules;
}

export type PublicMatch = Omit<Match, "undoStack">;

export type PublicRoom = Omit<DomainRoom, "bracket" | "scoreboardMatch"> & {
  bracket: (Omit<Bracket, "matches"> & { matches: PublicMatch[] }) | null;
  scoreboardMatch: PublicMatch | null;
};

function rng(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! / 2 ** 32;
}

function toPublicMatch(match: Match): PublicMatch {
  const { undoStack: _undo, ...rest } = match;
  return rest;
}

export function toPublicRoom(room: DomainRoom): PublicRoom {
  return {
    ...room,
    bracket: room.bracket
      ? {
          ...room.bracket,
          matches: room.bracket.matches.map(toPublicMatch),
        }
      : null,
    scoreboardMatch: room.scoreboardMatch
      ? toPublicMatch(room.scoreboardMatch)
      : null,
  };
}

type ClientMessage = Command | { type: "hello" };

export class Room extends DurableObject {
  #room: DomainRoom | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.#room = (await ctx.storage.get<DomainRoom>("room")) ?? null;
    });
  }

  async snapshot(): Promise<PublicRoom | null> {
    this.#room = (await this.ctx.storage.get<DomainRoom>("room")) ?? null;
    if (!this.#room) return null;
    if (isExpired(this.#room, Date.now())) {
      await this.ctx.storage.deleteAll();
      this.#room = null;
      return null;
    }
    return toPublicRoom(this.#room);
  }

  async create(init: CreateInit): Promise<PublicRoom> {
    const now = Date.now();
    this.#room = createRoom({ ...init, now, rng });
    await this.persist();
    this.broadcastState();
    return toPublicRoom(this.#room);
  }

  async command(cmd: Command): Promise<PublicRoom> {
    this.assertWritable();
    try {
      applyCommand(this.#room!, cmd, Date.now(), rng);
    } catch (err) {
      this.rethrowApply(err);
    }
    await this.persist();
    this.broadcastState();
    return toPublicRoom(this.#room!);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Se requiere WebSocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(text) as ClientMessage;
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          code: "invalid",
          message: errorMessage("invalid"),
        }),
      );
      return;
    }

    if (parsed.type === "hello") {
      const snap = await this.snapshot();
      if (!snap) {
        ws.send(
          JSON.stringify({
            type: "error",
            code: "not_found",
            message: errorMessage("not_found"),
          }),
        );
        return;
      }
      ws.send(JSON.stringify({ type: "state", room: snap }));
      return;
    }

    try {
      const room = await this.command(parsed);
      ws.send(JSON.stringify({ type: "state", room }));
    } catch (err) {
      if (isApplyError(err)) {
        ws.send(
          JSON.stringify({
            type: "error",
            code: err.code,
            message: errorMessage(err.code),
          }),
        );
        return;
      }
      throw err;
    }
  }

  private assertWritable(): void {
    if (!this.#room) {
      throw { code: "not_found" satisfies ApplyErrorCode };
    }
    if (isExpired(this.#room, Date.now())) {
      void this.ctx.storage.deleteAll();
      this.#room = null;
      throw { code: "expired" satisfies ApplyErrorCode };
    }
  }

  private async persist(): Promise<void> {
    if (!this.#room) return;
    await this.ctx.storage.put("room", this.#room);
  }

  private broadcastState(): void {
    if (!this.#room) return;
    const payload = JSON.stringify({
      type: "state",
      room: toPublicRoom(this.#room),
    });
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(payload);
    }
  }

  private rethrowApply(err: unknown): never {
    if (isApplyError(err)) throw err;
    throw err;
  }
}
