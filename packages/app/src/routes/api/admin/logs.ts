import { createFileRoute } from "@tanstack/react-router";
import { handleAdminLogs } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/logs")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminLogs(request),
    },
  },
});
