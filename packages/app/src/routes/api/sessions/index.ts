import { createFileRoute } from "@tanstack/react-router";
import { handleListSessions } from "~/server/api/keys";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/sessions/")({
  server: {
    handlers: {
      GET: withAuth(handleListSessions),
    },
  },
});
