import { createFileRoute } from "@tanstack/react-router";
import { handleCreateCheckout } from "~/server/api/stripe";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: withAuth(handleCreateCheckout),
    },
  },
});
