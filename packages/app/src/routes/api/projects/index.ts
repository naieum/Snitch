import { createFileRoute } from "@tanstack/react-router";
import { handleListProjects, handleCreateProject } from "~/server/api/projects";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/projects/")({
  server: {
    handlers: {
      GET: withAuth(handleListProjects),
      POST: withAuth(handleCreateProject),
    },
  },
});
