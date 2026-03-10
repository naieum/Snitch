import { createFileRoute } from "@tanstack/react-router";
import { handleSearch } from "~/server/api/search";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: withAuth(handleSearch),
    },
  },
});
