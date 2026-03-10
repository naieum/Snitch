import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { validateAdminAccess } from "../middleware/admin-auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function withAdmin(
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const admin = await validateAdminAccess(request);
    if (!admin) return json({ error: "Forbidden" }, 403);
    return handler(request);
  };
}

export const handleAdminStripe = withAdmin(async (request: Request) => {
  const db = createDb((env as any).DB);

  // Subscriptions by tier
  const subs = await db
    .select({
      tier: schema.subscriptions.tier,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.status, "active"))
    .groupBy(schema.subscriptions.tier);

  const tierPrices: Record<string, number> = { free: 0, base: 12.99, pro: 19.99, enterprise: 79.99 };
  let mrr = 0;
  let totalActive = 0;
  for (const s of subs) {
    mrr += s.count * (tierPrices[s.tier ?? "free"] ?? 0);
    totalActive += s.count;
  }

  // Skill purchases
  const [skillStats] = await db
    .select({
      count: sql<number>`count(*)`.as("count"),
    })
    .from(schema.user)
    .where(isNotNull(schema.user.skillPurchasedAt));

  const skillPurchases = skillStats?.count ?? 0;
  const skillRevenue = skillPurchases * 39.99;

  return json({
    subscriptionsByTier: subs,
    totalActive,
    mrr,
    skillPurchases,
    skillRevenue,
  });
});

export const handleAdminUsage = withAdmin(async (request: Request) => {
  const db = createDb((env as any).DB);

  // Tier distribution
  const tierDist = await db
    .select({
      tier: schema.user.subscriptionTier,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(schema.user)
    .groupBy(schema.user.subscriptionTier);

  // Top endpoints
  const topEndpoints = await db
    .select({
      path: schema.requestLogs.path,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(schema.requestLogs)
    .groupBy(schema.requestLogs.path)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  // Recent usage (last 3 months)
  const recentUsage = await db
    .select({
      period: schema.usageRecords.period,
      action: schema.usageRecords.action,
      total: sql<number>`sum(${schema.usageRecords.count})`.as("total"),
    })
    .from(schema.usageRecords)
    .groupBy(schema.usageRecords.period, schema.usageRecords.action)
    .orderBy(sql`${schema.usageRecords.period} DESC`)
    .limit(30);

  return json({
    tierDistribution: tierDist,
    topEndpoints,
    recentUsage,
  });
});

export const handleAdminStats = withAdmin(async (request: Request) => {
  const db = createDb((env as any).DB);

  const [userCount] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(schema.user);

  const [rulesetCount] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(schema.rulesets);

  const [ruleCount] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(schema.rules);

  const [projectCount] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(schema.projects);

  return json({
    users: userCount?.count ?? 0,
    rulesets: rulesetCount?.count ?? 0,
    rules: ruleCount?.count ?? 0,
    projects: projectCount?.count ?? 0,
  });
});

export const handleAdminUsers = withAdmin(async (request: Request) => {
  const db = createDb((env as any).DB);
  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      tier: schema.user.subscriptionTier,
      skillPurchased: schema.user.skillPurchasedAt,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(sql`${schema.user.createdAt} DESC`)
    .limit(100);

  return json(users);
});

export const handleAdminUserDetail = withAdmin(async (request: Request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const userId = segments[segments.length - 1];

  const db = createDb((env as any).DB);

  const [userRecord] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!userRecord) return json({ error: "User not found" }, 404);

  const keys = await db
    .select({ id: schema.apiKeys.id, name: schema.apiKeys.name, keyPrefix: schema.apiKeys.keyPrefix, permissions: schema.apiKeys.permissions })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, userId));

  const [sub] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(1);

  return json({ user: userRecord, keys, subscription: sub ?? null });
});

export const handleAdminUpdateUserTier = withAdmin(async (request: Request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // /api/admin/users/:id/tier → segments = [api, admin, users, :id, tier]
  const userId = segments[3];

  const body = await request.json() as { tier: string };
  if (!body.tier || !["free", "base", "pro", "enterprise"].includes(body.tier)) {
    return json({ error: "Invalid tier" }, 400);
  }

  const db = createDb((env as any).DB);
  await db
    .update(schema.user)
    .set({ subscriptionTier: body.tier, updatedAt: new Date() })
    .where(eq(schema.user.id, userId));

  return json({ success: true, tier: body.tier });
});

export const handleAdminRulesets = withAdmin(async (request: Request) => {
  const db = createDb((env as any).DB);
  const rulesets = await db
    .select({
      id: schema.rulesets.id,
      name: schema.rulesets.name,
      category: schema.rulesets.category,
      ownerId: schema.rulesets.ownerId,
      ruleCount: schema.rulesets.ruleCount,
      isPublic: schema.rulesets.isPublic,
      createdAt: schema.rulesets.createdAt,
    })
    .from(schema.rulesets)
    .orderBy(sql`${schema.rulesets.createdAt} DESC`)
    .limit(100);

  return json(rulesets);
});

export const handleAdminLogs = withAdmin(async (request: Request) => {
  const db = createDb((env as any).DB);
  const logs = await db
    .select()
    .from(schema.requestLogs)
    .orderBy(sql`${schema.requestLogs.timestamp} DESC`)
    .limit(100);

  return json(logs);
});

export const handleAdminSystem = withAdmin(async (request: Request) => {
  return json({
    version: "6.0.0",
    environment: (env as any).STRIPE_MODE ?? "unknown",
    stripeEnabled: (env as any).STRIPE_ENABLED === "true",
    baseUrl: (env as any).BASE_URL ?? "unknown",
  });
});
