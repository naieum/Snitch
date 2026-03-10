import { createFileRoute } from "@tanstack/react-router";
import { handleAdminUsage } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/usage")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminUsage(request),
    },
  },
});
