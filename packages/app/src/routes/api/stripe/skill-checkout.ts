import { createFileRoute } from "@tanstack/react-router";
import { handleSkillCheckout } from "~/server/api/skill-checkout";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/stripe/skill-checkout")({
  server: {
    handlers: {
      POST: withAuth(handleSkillCheckout),
    },
  },
});
