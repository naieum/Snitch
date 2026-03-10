import { createFileRoute } from "@tanstack/react-router";
import { handleDeviceCodeRequest } from "~/server/api/device-auth";

export const Route = createFileRoute("/api/auth/device")({
  server: {
    handlers: {
      POST: async ({ request }) => handleDeviceCodeRequest(request),
    },
  },
});
