import { DurableObject } from "cloudflare:workers";

export class Room extends DurableObject {}

export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("ok");
  },
} satisfies ExportedHandler<Env>;
