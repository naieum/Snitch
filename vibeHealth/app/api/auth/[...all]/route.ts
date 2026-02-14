import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// VULN [Cat 7]: No rate limiting on authentication endpoints
// Attackers can brute-force passwords without throttling
export const { GET, POST } = toNextJsHandler(auth);
