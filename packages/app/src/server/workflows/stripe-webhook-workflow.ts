import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";

export interface StripeWebhookParams {
  eventType: string;
  eventId: string;
  data: Record<string, any>;
}

export class StripeWebhookWorkflow extends WorkflowEntrypoint<Env, StripeWebhookParams> {
  async run(event: WorkflowEvent<StripeWebhookParams>, step: WorkflowStep) {
    const { eventType, eventId, data } = event.payload;

    switch (eventType) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(step, data);
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(step, data);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(step, data);
        break;
      case "invoice.payment_failed":
        await this.handlePaymentFailed(step, data);
        break;
      default:
        throw new NonRetryableError(`Unhandled event type: ${eventType}`);
    }

    // Invalidate user tier cache
    const customerId = data.customerId;
    if (customerId) {
      await step.do("invalidate-tier-cache", async () => {
        await this.env.CACHE.delete(`user:${customerId}:tier`);
      });
    }

    return { eventType, eventId, processed: true };
  }

  private async handleCheckoutCompleted(step: WorkflowStep, data: Record<string, any>) {
    const { userId, customerId, subscriptionId, product } = data;

    // Handle one-time skill purchase
    if (product === "skill") {
      if (!userId) throw new NonRetryableError("Missing userId for skill purchase");

      await step.do(
        "record-skill-purchase",
        { retries: { limit: 3, delay: "2 seconds", backoff: "exponential" } },
        async () => {
          const db = drizzle(this.env.DB, { schema });
          await db
            .update(schema.user)
            .set({
              skillPurchasedAt: new Date(),
              skillVersion: "6.0.0",
              updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));
        }
      );

      await step.do(
        "track-skill-purchase-usage",
        { retries: { limit: 2, delay: "1 second" } },
        async () => {
          const db = drizzle(this.env.DB, { schema });
          const period = new Date().toISOString().slice(0, 7);
          await db.insert(schema.usageRecords).values({
            id: crypto.randomUUID(),
            userId,
            action: "skill_purchase",
            count: 1,
            period,
          });
        }
      );

      return;
    }

    // Handle subscription checkout
    if (!userId || !customerId || !subscriptionId) {
      throw new NonRetryableError("Missing required checkout data");
    }

    // Resolve tier from the subscription's priceId (server-side, never trust client metadata)
    const tier = await step.do("resolve-tier-from-subscription", async () => {
      const stripe = await import("stripe");
      const stripeClient = new stripe.default(this.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-02-24.acacia",
      });
      const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      return this.tierFromPriceId(priceId);
    });

    await step.do(
      "upsert-subscription",
      { retries: { limit: 3, delay: "2 seconds", backoff: "exponential" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        const now = new Date().toISOString();

        const [existing] = await db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.userId, userId))
          .limit(1);

        if (existing) {
          await db
            .update(schema.subscriptions)
            .set({ stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, status: "active", tier, updatedAt: now })
            .where(eq(schema.subscriptions.userId, userId));
        } else {
          await db.insert(schema.subscriptions).values({
            id: crypto.randomUUID(),
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: "active",
            tier,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    );

    await step.do(
      "update-user-tier",
      { retries: { limit: 3, delay: "1 second" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        await db
          .update(schema.user)
          .set({ subscriptionTier: tier, stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(schema.user.id, userId));
      }
    );
  }

  private async handleSubscriptionUpdated(step: WorkflowStep, data: Record<string, any>) {
    const { customerId, priceId, subscriptionStatus } = data;
    if (!customerId) throw new NonRetryableError("Missing customerId");

    const tier = this.tierFromPriceId(priceId);

    await step.do(
      "update-subscription-record",
      { retries: { limit: 3, delay: "2 seconds" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        const now = new Date().toISOString();
        await db
          .update(schema.subscriptions)
          .set({ tier, status: subscriptionStatus === "active" ? "active" : subscriptionStatus, updatedAt: now })
          .where(eq(schema.subscriptions.stripeCustomerId, customerId));
      }
    );

    await step.do(
      "sync-user-tier",
      { retries: { limit: 3, delay: "1 second" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        const [sub] = await db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.stripeCustomerId, customerId))
          .limit(1);

        if (sub?.userId) {
          await db
            .update(schema.user)
            .set({ subscriptionTier: tier, updatedAt: new Date() })
            .where(eq(schema.user.id, sub.userId));
        }
      }
    );
  }

  private async handleSubscriptionDeleted(step: WorkflowStep, data: Record<string, any>) {
    const { customerId } = data;
    if (!customerId) throw new NonRetryableError("Missing customerId");

    await step.do(
      "cancel-subscription",
      { retries: { limit: 3, delay: "2 seconds" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        const now = new Date().toISOString();
        await db
          .update(schema.subscriptions)
          .set({ tier: "free", status: "canceled", updatedAt: now })
          .where(eq(schema.subscriptions.stripeCustomerId, customerId));
      }
    );

    await step.do(
      "downgrade-user",
      { retries: { limit: 3, delay: "1 second" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        const [sub] = await db
          .select()
          .from(schema.subscriptions)
          .where(eq(schema.subscriptions.stripeCustomerId, customerId))
          .limit(1);

        if (sub?.userId) {
          await db
            .update(schema.user)
            .set({ subscriptionTier: "free", updatedAt: new Date() })
            .where(eq(schema.user.id, sub.userId));
        }
      }
    );
  }

  private async handlePaymentFailed(step: WorkflowStep, data: Record<string, any>) {
    const { customerId } = data;
    if (!customerId) throw new NonRetryableError("Missing customerId");

    await step.do(
      "mark-past-due",
      { retries: { limit: 3, delay: "2 seconds" } },
      async () => {
        const db = drizzle(this.env.DB, { schema });
        await db
          .update(schema.subscriptions)
          .set({ status: "past_due", updatedAt: new Date().toISOString() })
          .where(eq(schema.subscriptions.stripeCustomerId, customerId));
      }
    );
  }

  private tierFromPriceId(priceId?: string): string {
    if (!priceId) return "free";
    if (priceId === this.env.STRIPE_PRICE_BASE) return "base";
    if (priceId === this.env.STRIPE_PRICE_PRO) return "pro";
    if (priceId === this.env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
    return "free";
  }
}

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STRIPE_SECRET_KEY: string;
  STRIPE_PRICE_BASE: string;
  STRIPE_PRICE_PRO: string;
  STRIPE_PRICE_ENTERPRISE: string;
  STRIPE_PRICE_SKILL: string;
}
