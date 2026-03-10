import { createFileRoute } from "@tanstack/react-router";
import { handleListRules, handleCreateRule } from "~/server/api/rules";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/rulesets/$rulesetId/rules")({
  server: {
    handlers: {
      GET: withAuthAndParam(handleListRules),
      POST: withAuthAndParam(handleCreateRule),
    },
  },
});
