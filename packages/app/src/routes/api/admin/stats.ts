import { createFileRoute } from "@tanstack/react-router";
import { handleAdminStats } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminStats(request),
    },
  },
});
