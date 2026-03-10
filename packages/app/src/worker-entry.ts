import tanstack from "@tanstack/react-start/server-entry";
import { handleMcpRequest } from "./server/mcp-handler";
import { handleAuth } from "./server/api/auth";

// Re-export workflow classes so Cloudflare can find them
export { EmbeddingWorkflow } from "./server/workflows/embedding-workflow";
export { BulkEmbeddingWorkflow } from "./server/workflows/bulk-embedding-workflow";
export { StripeWebhookWorkflow } from "./server/workflows/stripe-webhook-workflow";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.hostname === "mcp.snitch.live") {
      return handleMcpRequest(request, env, ctx);
    }
    // Handle better-auth routes before TanStack Router (splat route only
    // matches a single segment, but better-auth needs deep paths like
    // /api/auth/sign-in/social and /api/auth/callback/github)
    if (url.pathname.startsWith("/api/auth/") && !url.pathname.startsWith("/api/auth/device")) {
      return handleAuth(request);
    }
    const response = await tanstack.fetch(request);
    const ct = response.headers.get("Content-Type") || "";
    if (ct.includes("text/html")) {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-Content-Type-Options", "nosniff");
      newResponse.headers.set("X-Frame-Options", "DENY");
      newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      newResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      return newResponse;
    }
    return response;
  },
};
