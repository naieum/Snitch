import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and } from "drizzle-orm";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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

export async function handleGetUsage(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);
    const period = new Date().toISOString().slice(0, 7);

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!userRecord) return json({ error: "User not found" }, 404);

    const tier = userRecord.subscriptionTier ?? "free";
    const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

    // Get usage records for current period
    const records = await db
      .select()
      .from(schema.usageRecords)
      .where(
        and(
          eq(schema.usageRecords.userId, userId),
          eq(schema.usageRecords.period, period)
        )
      );

    // Build actions list with limits
    const trackedActions = ["rulesets", "rules", "projects", "searches", "mcp_calls", "skill_download"];
    const actions = trackedActions.map((action) => {
      const record = records.find((r) => r.action === action);
      const rawLimit = limits[action] ?? 0;
      return {
        action,
        count: record?.count ?? 0,
        limit: rawLimit === Infinity ? -1 : rawLimit,
      };
    });

    // Count skill downloads
    const downloadRecord = records.find((r) => r.action === "skill_download");

    return json({
      tier,
      actions,
      skillPurchased: !!userRecord.skillPurchasedAt,
      skillVersion: userRecord.skillVersion,
      downloads: downloadRecord?.count ?? 0,
    });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
