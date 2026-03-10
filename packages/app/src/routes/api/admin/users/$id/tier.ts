import { createFileRoute } from "@tanstack/react-router";
import { handleAdminUpdateUserTier } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/users/$id/tier")({
  server: {
    handlers: {
      PATCH: async ({ request }) => handleAdminUpdateUserTier(request),
    },
  },
});
