import { createFileRoute } from "@tanstack/react-router";
import { handleListRulesets, handleCreateRuleset } from "~/server/api/rulesets";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/rulesets/")({
  server: {
    handlers: {
      GET: withAuth(handleListRulesets),
      POST: withAuth(handleCreateRuleset),
    },
  },
});
