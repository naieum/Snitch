import { createFileRoute } from "@tanstack/react-router";
import { handleDevicePair } from "~/server/api/device-auth";
import { withAuth } from "~/server/api/with-auth";

export const Route = createFileRoute("/api/auth/device/pair")({
  server: {
    handlers: {
      POST: withAuth(handleDevicePair),
    },
  },
});
