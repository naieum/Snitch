import { createFileRoute } from "@tanstack/react-router";
import { handleAdminStripe } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/stripe")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminStripe(request),
    },
  },
});
