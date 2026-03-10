import { createFileRoute } from "@tanstack/react-router";
import { handleAdminUserDetail } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/users/$id")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminUserDetail(request),
    },
  },
});
