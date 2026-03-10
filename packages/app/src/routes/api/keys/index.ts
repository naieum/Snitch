import { createFileRoute } from "@tanstack/react-router";
import { handleListKeys, handleCreateToken } from "~/server/api/keys";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/keys/")({
  server: {
    handlers: {
      GET: withAuth(handleListKeys),
      POST: withAuth(handleCreateToken),
    },
  },
});
