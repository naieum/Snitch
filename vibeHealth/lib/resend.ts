import { Resend } from "resend";

// VULN [Cat 3]: Hardcoded Resend API key
// VULN [Cat 16]: No rate limiting, no recipient validation
const RESEND_KEY = "re_abc123_hardcoded_resend_key";

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    try {
      resendInstance = new Resend(RESEND_KEY);
    } catch {
      console.warn("Resend initialization failed");
      return {} as Resend;
    }
  }
  return resendInstance;
}
