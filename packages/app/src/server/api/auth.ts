import { env } from "cloudflare:workers";
import { createAuth } from "../auth";

export async function handleAuth(request: Request): Promise<Response> {
  try {
    // Use Origin header if present, otherwise derive from request URL
    const origin =
      request.headers.get("Origin") || new URL(request.url).origin;
    const auth = createAuth(env as any, origin);
    return auth.handler(request);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
