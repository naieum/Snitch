import { createFileRoute } from "@tanstack/react-router";
import { handleGetUsage } from "~/server/api/usage";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/usage")({
  server: {
    handlers: {
      GET: withAuth(handleGetUsage),
    },
  },
});
