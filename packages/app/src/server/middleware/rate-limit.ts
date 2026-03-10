import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and } from "drizzle-orm";

const TIER_LIMITS: Record<string, Record<string, number>> = {
  free: { rulesets: 3, rules: 50, projects: 1, searches: 100, mcp_calls: 50 },
  base: { rulesets: 10, rules: 200, projects: 5, searches: 2000, mcp_calls: 2000 },
  pro: { rulesets: 25, rules: 500, projects: 10, searches: 5000, mcp_calls: 5000 },
  enterprise: {
    rulesets: Infinity,
    rules: Infinity,
    projects: Infinity,
    searches: Infinity,
    mcp_calls: Infinity,
  },
};

export async function checkLimit(
  userId: string,
  action: string,
  tier: string
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // If Stripe is disabled, everyone gets team tier
  if ((env as any).STRIPE_ENABLED !== "true") {
    return { allowed: true, limit: Infinity, current: 0 };
  }

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const limit = limits[action];
  if (limit === undefined) return { allowed: false, limit: 0, current: 0 };
  if (limit === Infinity) return { allowed: true, limit, current: 0 };

  const db = createDb((env as any).DB);
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [record] = await db
    .select()
    .from(schema.usageRecords)
    .where(
      and(
        eq(schema.usageRecords.userId, userId),
        eq(schema.usageRecords.action, action),
        eq(schema.usageRecords.period, period)
      )
    )
    .limit(1);

  const current = record?.count ?? 0;
  return { allowed: current < limit, limit, current };
}

export async function incrementUsage(
  userId: string,
  action: string
): Promise<void> {
  const db = createDb((env as any).DB);
  const period = new Date().toISOString().slice(0, 7);

  const [existing] = await db
    .select()
    .from(schema.usageRecords)
    .where(
      and(
        eq(schema.usageRecords.userId, userId),
        eq(schema.usageRecords.action, action),
        eq(schema.usageRecords.period, period)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(schema.usageRecords)
      .set({ count: (existing.count ?? 0) + 1 })
      .where(eq(schema.usageRecords.id, existing.id));
  } else {
    await db.insert(schema.usageRecords).values({
      id: crypto.randomUUID(),
      userId,
      action,
      count: 1,
      period,
    });
  }
}
