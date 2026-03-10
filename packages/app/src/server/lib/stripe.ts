import Stripe from "stripe";
import { env } from "cloudflare:workers";

function getStripe(): Stripe {
  return new Stripe((env as any).STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

export function isStripeEnabled(): boolean {
  return (env as any).STRIPE_ENABLED === "true";
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });
  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return session.url;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    (env as any).STRIPE_WEBHOOK_SECRET
  );
}

export async function createSkillCheckoutSession(
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: "payment",
    line_items: [{ price: (env as any).STRIPE_PRICE_SKILL, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, product: "skill" },
  });
  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  return session.url;
}

export function tierFromPriceId(priceId: string): string {
  if (priceId === (env as any).STRIPE_PRICE_BASE) return "base";
  if (priceId === (env as any).STRIPE_PRICE_PRO) return "pro";
  if (priceId === (env as any).STRIPE_PRICE_ENTERPRISE) return "enterprise";
  return "free";
}
