import { assertPlayerCount } from "./domain/names";
import type { RoomMode, Rules } from "./domain/types";
import { errorMessage } from "./errors";
import { newRoomId } from "./id";
import { Room } from "./room-do";

export { Room };

type WorkerEnv = Env & { ASSETS?: Fetcher };

interface CreateBody {
  mode: RoomMode;
  names: string[];
  rules: Rules;
}

const ID_RE = /^[23456789abcdefghjkmnpqrstuvwxyz]{6}$/;

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/rooms" && request.method === "POST") {
      return createRoom(request, env);
    }

    const roomGet = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
    if (roomGet && request.method === "GET") {
      return getRoom(roomGet[1]!, env);
    }

    const roomWs = url.pathname.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    if (roomWs) {
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomWs[1]!));
      return stub.fetch(request);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("No encontrado", { status: 404 });
  },
} satisfies ExportedHandler<WorkerEnv>;

async function createRoom(request: Request, env: WorkerEnv): Promise<Response> {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
    assertPlayerCount(body.names.length, body.mode);
  } catch {
    return json({ error: errorMessage("invalid") }, 400);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newRoomId();
    const stub = env.ROOMS.get(env.ROOMS.idFromName(id));
    try {
      await stub.create({
        id,
        mode: body.mode,
        names: body.names,
        rules: body.rules,
      });
      return json({ id }, 201);
    } catch {
      // id collision or transient failure — retry
    }
  }

  return json({ error: "No se pudo crear la sala" }, 500);
}

async function getRoom(id: string, env: WorkerEnv): Promise<Response> {
  if (!ID_RE.test(id)) {
    return new Response("No encontrado", { status: 404 });
  }
  const stub = env.ROOMS.get(env.ROOMS.idFromName(id));
  const room = await stub.snapshot();
  if (!room) {
    return new Response("No encontrado", { status: 404 });
  }
  return json(room, 200);
}

function json(data: unknown, status: number): Response {
  return Response.json(data, { status });
}
