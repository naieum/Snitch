import { createFileRoute } from "@tanstack/react-router";
import { handleDeleteKey } from "~/server/api/keys";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/keys/$id")({
  server: {
    handlers: {
      DELETE: withAuthAndParam(handleDeleteKey),
    },
  },
});
