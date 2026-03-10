import { createFileRoute } from "@tanstack/react-router";
import { handleDeviceTokenPoll } from "~/server/api/device-auth";

export const Route = createFileRoute("/api/auth/device/token")({
  server: {
    handlers: {
      POST: async ({ request }) => handleDeviceTokenPoll(request),
    },
  },
});
