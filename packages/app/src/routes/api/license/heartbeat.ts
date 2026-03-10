import { createFileRoute } from "@tanstack/react-router";
import { handleHeartbeat } from "~/server/api/license";

export const Route = createFileRoute("/api/license/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => handleHeartbeat(request),
    },
  },
});
