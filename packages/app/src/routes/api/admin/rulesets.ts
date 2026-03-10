import { createFileRoute } from "@tanstack/react-router";
import { handleAdminRulesets } from "~/server/api/admin";

export const Route = createFileRoute("/api/admin/rulesets")({
  server: {
    handlers: {
      GET: async ({ request }) => handleAdminRulesets(request),
    },
  },
});
