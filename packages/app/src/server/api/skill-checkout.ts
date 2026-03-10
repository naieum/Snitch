import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq } from "drizzle-orm";
import {
  createSkillCheckoutSession,
  isStripeEnabled,
} from "../lib/stripe";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleSkillCheckout(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    if (!isStripeEnabled()) {
      return json({ error: "Billing is not enabled" }, 400);
    }

    const db = createDb((env as any).DB);

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!userRecord) return json({ error: "User not found" }, 404);

    if (userRecord.skillPurchasedAt) {
      return json({ error: "Skill already purchased" }, 400);
    }

    const origin = new URL(request.url).origin;
    const url = await createSkillCheckoutSession(
      userId,
      userRecord.email,
      `${origin}/dashboard?skill_purchased=true`,
      `${origin}/plugin?canceled=true`
    );

    return json({ url });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
