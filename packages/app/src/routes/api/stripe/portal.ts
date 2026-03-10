import { createFileRoute } from "@tanstack/react-router";
import { handleCreatePortal } from "~/server/api/stripe";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/stripe/portal")({
  server: {
    handlers: {
      POST: withAuth(handleCreatePortal),
    },
  },
});
