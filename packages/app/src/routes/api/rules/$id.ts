import { createFileRoute } from "@tanstack/react-router";
import { handleGetRule, handleUpdateRule, handleDeleteRule } from "~/server/api/rules";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/rules/$id")({
  server: {
    handlers: {
      GET: withAuthAndParam(handleGetRule),
      PUT: withAuthAndParam(handleUpdateRule),
      DELETE: withAuthAndParam(handleDeleteRule),
    },
  },
});
