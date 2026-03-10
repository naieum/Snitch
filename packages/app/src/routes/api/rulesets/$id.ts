import { createFileRoute } from "@tanstack/react-router";
import { handleGetRuleset, handleUpdateRuleset, handleDeleteRuleset } from "~/server/api/rulesets";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/rulesets/$id")({
  server: {
    handlers: {
      GET: withAuthAndParam(handleGetRuleset),
      PUT: withAuthAndParam(handleUpdateRuleset),
      DELETE: withAuthAndParam(handleDeleteRuleset),
    },
  },
});
