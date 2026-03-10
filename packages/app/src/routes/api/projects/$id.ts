import { createFileRoute } from "@tanstack/react-router";
import { handleGetProject, handleUpdateProject, handleDeleteProject } from "~/server/api/projects";
import { withAuthAndParam } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/projects/$id")({
  server: {
    handlers: {
      GET: withAuthAndParam(handleGetProject),
      PUT: withAuthAndParam(handleUpdateProject),
      DELETE: withAuthAndParam(handleDeleteProject),
    },
  },
});
