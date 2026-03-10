import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, like, desc, or, isNull, sql } from "drizzle-orm";
import { invalidatePrefix } from "../lib/cache";
import { deleteVectorsByMetadata } from "../lib/vectorize";
import { checkLimit } from "../middleware/rate-limit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleListRulesets(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const db = createDb((env as any).DB);

    // Include user-owned rulesets + public system rulesets
    const ownershipCondition = or(
      eq(schema.rulesets.ownerId, userId),
      eq(schema.rulesets.isPublic, 1)
    )!;

    const conditions = [ownershipCondition];
    if (category) {
      conditions.push(eq(schema.rulesets.category, category));
    }

    const rows = await db
      .select()
      .from(schema.rulesets)
      .where(and(...conditions))
      .orderBy(desc(schema.rulesets.createdAt));

    return json(rows);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleGetRuleset(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Allow viewing owned rulesets OR public system rulesets
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(
        and(
          eq(schema.rulesets.id, id),
          or(
            eq(schema.rulesets.ownerId, userId),
            eq(schema.rulesets.isPublic, 1)
          )
        )
      )
      .limit(1);

    if (!ruleset) return json({ error: "Ruleset not found" }, 404);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rules)
      .where(eq(schema.rules.rulesetId, id));

    return json({ ...ruleset, ruleCount: countResult?.count ?? 0 });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleCreateRuleset(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;
    if (!body.name || typeof body.name !== "string") {
      return json({ error: "name is required" }, 400);
    }
    if (body.name.length > 200) {
      return json({ error: "name must be under 200 characters" }, 400);
    }
    if (body.description && typeof body.description === "string" && body.description.length > 2000) {
      return json({ error: "description must be under 2000 characters" }, 400);
    }

    const db = createDb((env as any).DB);

    // Get user tier
    const [userRecord] = await db
      .select({ subscriptionTier: schema.user.subscriptionTier })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    const tier = userRecord?.subscriptionTier ?? "free";

    // Check tier limit for rulesets
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rulesets)
      .where(eq(schema.rulesets.ownerId, userId));

    const limitCheck = await checkLimit(userId, "rulesets", tier);
    if (!limitCheck.allowed) {
      return json(
        { error: "Ruleset limit reached", limit: limitCheck.limit, current: limitCheck.current },
        403
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(schema.rulesets).values({
      id,
      name: body.name,
      description: body.description ?? null,
      category: body.category ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      isPublic: body.isPublic ? 1 : 0,
      ownerId: userId,
      ruleCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await db
      .select()
      .from(schema.rulesets)
      .where(eq(schema.rulesets.id, id))
      .limit(1);

    return json(created, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleUpdateRuleset(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(schema.rulesets)
      .where(and(eq(schema.rulesets.id, id), eq(schema.rulesets.ownerId, userId)))
      .limit(1);

    if (!existing) return json({ error: "Ruleset not found" }, 404);

    const body = (await request.json()) as Record<string, any>;
    const now = new Date().toISOString();

    await db
      .update(schema.rulesets)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic ? 1 : 0 }),
        updatedAt: now,
      })
      .where(eq(schema.rulesets.id, id));

    await invalidatePrefix(`rulesets:${userId}`);

    const [updated] = await db
      .select()
      .from(schema.rulesets)
      .where(eq(schema.rulesets.id, id))
      .limit(1);

    return json(updated);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleDeleteRuleset(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(schema.rulesets)
      .where(and(eq(schema.rulesets.id, id), eq(schema.rulesets.ownerId, userId)))
      .limit(1);

    if (!existing) return json({ error: "Ruleset not found" }, 404);

    // Delete vectors for this ruleset
    try {
      await deleteVectorsByMetadata({ rulesetId: id });
    } catch {
      // Vectorize may not be available; continue
    }

    // Cascade delete handled by DB foreign keys
    await db.delete(schema.rulesets).where(eq(schema.rulesets.id, id));

    await invalidatePrefix(`rulesets:${userId}`);

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
