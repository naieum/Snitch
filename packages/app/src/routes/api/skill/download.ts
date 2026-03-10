import { createFileRoute } from "@tanstack/react-router";
import { handleSkillDownload } from "~/server/api/skill";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/skill/download")({
  server: {
    handlers: {
      GET: withAuth(handleSkillDownload),
    },
  },
});
