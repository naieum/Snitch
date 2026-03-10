import { createFileRoute } from "@tanstack/react-router";
import { handleSkillVersion } from "~/server/api/skill";

export const Route = createFileRoute("/api/skill/version")({
  server: {
    handlers: {
      GET: async () => handleSkillVersion(),
    },
  },
});
