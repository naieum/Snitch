import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq } from "drizzle-orm";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleGetBilling(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!userRecord) return json({ error: "User not found" }, 404);

    // Look up subscription record
    const [sub] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    const tier = userRecord.subscriptionTier ?? "free";
    const isGranted = tier !== "free" && (!sub || sub.status !== "active");

    return json({
      tier,
      stripeCustomerId: sub?.stripeCustomerId ?? null,
      stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
      status: sub?.status ?? null,
      granted: isGranted,
    });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
