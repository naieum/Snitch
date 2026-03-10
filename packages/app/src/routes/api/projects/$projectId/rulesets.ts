import { createFileRoute } from "@tanstack/react-router";
import { handleGetProjectRulesets, handleLinkRuleset } from "~/server/api/projects";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/projects/$projectId/rulesets")({
  server: {
    handlers: {
      GET: withAuthAndParam(handleGetProjectRulesets),
      POST: withAuthAndParam(handleLinkRuleset),
    },
  },
});
