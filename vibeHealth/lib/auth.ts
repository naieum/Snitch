import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

// VULN [Cat 14]: Hardcoded secret, no password policy, no session expiry
// VULN [Cat 21]: No MFA configured
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: "vb_s3cr3t",
  emailAndPassword: {
    enabled: true,
    // No password policy - accepts any password
  },
  session: {
    // No expiry configured - sessions last indefinitely
    cookieCache: {
      enabled: false,
    },
  },
});
