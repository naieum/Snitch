import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq } from "drizzle-orm";
import {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  isStripeEnabled,
} from "../lib/stripe";
import type Stripe from "stripe";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Map tier name → env var holding the Stripe price ID */
function priceIdForTier(tier: string): string | null {
  const e = env as any;
  switch (tier) {
    case "base":
      return e.STRIPE_PRICE_BASE ?? null;
    case "pro":
      return e.STRIPE_PRICE_PRO ?? null;
    case "enterprise":
      return e.STRIPE_PRICE_ENTERPRISE ?? null;
    default:
      return null;
  }
}

export async function handleCreateCheckout(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    if (!isStripeEnabled()) {
      return json({ error: "Billing is not enabled" }, 400);
    }

    const body = (await request.json()) as Record<string, any>;

    // Only accept tier name — resolve to priceId server-side
    const tier: string | undefined = body.tier;
    if (!tier) {
      return json({ error: "tier is required" }, 400);
    }
    const priceId = priceIdForTier(tier);
    if (!priceId) {
      return json({ error: `Invalid tier: ${tier}` }, 400);
    }

    const db = createDb((env as any).DB);

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!userRecord) return json({ error: "User not found" }, 404);

    const origin = new URL(request.url).origin;

    const url = await createCheckoutSession(
      userId,
      userRecord.email,
      priceId,
      `${origin}/dashboard/billing?success=true`,
      `${origin}/dashboard/billing?canceled=true`
    );

    return json({ url });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleCreatePortal(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    if (!isStripeEnabled()) {
      return json({ error: "Billing is not enabled" }, 400);
    }

    const db = createDb((env as any).DB);

    const [sub] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    if (!sub?.stripeCustomerId) {
      return json({ error: "No billing account found" }, 404);
    }

    const origin = new URL(request.url).origin;
    const url = await createPortalSession(
      sub.stripeCustomerId,
      `${origin}/dashboard/billing`
    );

    return json({ url });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleWebhook(request: Request): Promise<Response> {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return json({ error: "Missing stripe-signature header" }, 400);
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature);
    } catch (e: any) {
      return json({ error: `Webhook signature verification failed: ${e.message}` }, 400);
    }

    // Extract common fields from the event for the workflow
    let workflowData: Record<string, any> = {};

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        workflowData = {
          userId: session.metadata?.userId,
          product: session.metadata?.product,
          customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        };
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        workflowData = {
          customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          priceId: sub.items.data[0]?.price?.id,
          subscriptionStatus: sub.status,
        };
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        workflowData = {
          customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
        };
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        workflowData = {
          customerId: typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as any)?.id,
        };
        break;
      }
      default:
        return json({ received: true, ignored: true });
    }

    // Dispatch to durable StripeWebhookWorkflow for reliable processing
    await (env as any).STRIPE_WEBHOOK_WORKFLOW.create({
      id: `stripe-${event.id}`,
      params: {
        eventType: event.type,
        eventId: event.id,
        data: workflowData,
      },
    });

    return json({ received: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
