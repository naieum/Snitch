import { createFileRoute } from "@tanstack/react-router";
import { handleWebhook } from "~/server/api/stripe";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handleWebhook(request),
    },
  },
});
