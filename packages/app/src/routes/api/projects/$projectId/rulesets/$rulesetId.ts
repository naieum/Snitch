import { createFileRoute } from "@tanstack/react-router";
import { handleUnlinkRuleset } from "~/server/api/projects";
import { withAuthAndParams } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/projects/$projectId/rulesets/$rulesetId")({
  server: {
    handlers: {
      DELETE: withAuthAndParams(handleUnlinkRuleset),
    },
  },
});
