import { createFileRoute } from "@tanstack/react-router";
import { handleAdminUsers } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/users/")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminUsers(request),
    },
  },
});
