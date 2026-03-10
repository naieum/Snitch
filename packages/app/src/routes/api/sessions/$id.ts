import { createFileRoute } from "@tanstack/react-router";
import { handleDeleteSession } from "~/server/api/keys";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/sessions/$id")({
  server: {
    handlers: {
      DELETE: withAuthAndParam(handleDeleteSession),
    },
  },
});
