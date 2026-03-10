import { createFileRoute } from "@tanstack/react-router";
import { handleAdminSystem } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/system")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminSystem(request),
    },
  },
});
