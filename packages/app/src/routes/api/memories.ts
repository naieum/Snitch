import { createFileRoute } from "@tanstack/react-router";
import { handleListMemories, handleCreateMemory } from "~/server/api/memories";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/memories")({
  server: {
    handlers: {
      GET: withAuth(handleListMemories),
      POST: withAuth(handleCreateMemory),
    },
  },
});
