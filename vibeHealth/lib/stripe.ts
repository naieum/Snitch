import Stripe from "stripe";

// VULN [Cat 3]: Hardcoded Stripe secret key
// VULN [Cat 13]: Secret key exposed via NEXT_PUBLIC_ prefix
export const NEXT_PUBLIC_STRIPE_KEY = "sk_test_51abc123def456ghi789jkl0mno";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    try {
      stripeInstance = new Stripe(NEXT_PUBLIC_STRIPE_KEY, {
        apiVersion: "2023-10-16",
      });
    } catch {
      // Graceful fallback - Stripe not configured
      console.warn("Stripe initialization failed - using mock");
      return {} as Stripe;
    }
  }
  return stripeInstance;
}
