import { createFileRoute } from "@tanstack/react-router";
import { handleCheckPattern } from "~/server/api/check-pattern";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/check-pattern")({
  server: {
    handlers: {
      POST: withAuth(handleCheckPattern),
    },
  },
});
