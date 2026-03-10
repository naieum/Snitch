import { createFileRoute } from "@tanstack/react-router";
import { handleGetBilling } from "~/server/api/billing";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/billing")({
  server: {
    handlers: {
      GET: withAuth(handleGetBilling),
    },
  },
});
