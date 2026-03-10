import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, or, sql } from "drizzle-orm";
import { deleteVectorsByMetadata } from "../lib/vectorize";
import { invalidatePrefix } from "../lib/cache";
import { checkLimit } from "../middleware/rate-limit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleListRules(
  request: Request,
  userId: string,
  rulesetId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify ownership or public system ruleset
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(
        and(
          eq(schema.rulesets.id, rulesetId),
          or(
            eq(schema.rulesets.ownerId, userId),
            eq(schema.rulesets.isPublic, 1)
          )
        )
      )
      .limit(1);

    if (!ruleset) return json({ error: "Ruleset not found" }, 404);

    const rows = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.rulesetId, rulesetId));

    return json(rows);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleGetRule(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [rule] = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id))
      .limit(1);

    if (!rule) return json({ error: "Rule not found" }, 404);

    // Verify ownership via ruleset
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(
        and(
          eq(schema.rulesets.id, rule.rulesetId!),
          eq(schema.rulesets.ownerId, userId)
        )
      )
      .limit(1);

    if (!ruleset) return json({ error: "Rule not found" }, 404);

    return json(rule);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleCreateRule(
  request: Request,
  userId: string,
  rulesetId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify ruleset ownership
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(
        and(eq(schema.rulesets.id, rulesetId), eq(schema.rulesets.ownerId, userId))
      )
      .limit(1);

    if (!ruleset) return json({ error: "Ruleset not found" }, 404);

    const body = (await request.json()) as Record<string, any>;
    if (!body.title || typeof body.title !== "string") {
      return json({ error: "title is required" }, 400);
    }
    if (body.title.length > 200) {
      return json({ error: "title must be under 200 characters" }, 400);
    }
    if (body.description && typeof body.description === "string" && body.description.length > 5000) {
      return json({ error: "description must be under 5000 characters" }, 400);
    }

    if (body.pattern !== undefined && body.pattern !== null) {
      if (typeof body.pattern !== "string" || body.pattern.length > 1000) {
        return json({ error: "pattern must be a string under 1000 characters" }, 400);
      }
      try {
        new RegExp(body.pattern);
      } catch {
        return json({ error: "Invalid regex pattern" }, 400);
      }
      // Reject patterns with nested quantifiers (ReDoS risk)
      if (/(\+|\*|\})\s*(\+|\*|\?)/.test(body.pattern) || /\([^)]*(\+|\*)[^)]*\)\s*(\+|\*|\?)/.test(body.pattern)) {
        return json({ error: "Pattern contains nested quantifiers (ReDoS risk)" }, 400);
      }
    }

    // Get user tier and check limits
    const [userRecord] = await db
      .select({ subscriptionTier: schema.user.subscriptionTier })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    const tier = userRecord?.subscriptionTier ?? "free";
    const limitCheck = await checkLimit(userId, "rules", tier);
    if (!limitCheck.allowed) {
      return json(
        { error: "Rule limit reached", limit: limitCheck.limit, current: limitCheck.current },
        403
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(schema.rules).values({
      id,
      rulesetId,
      title: body.title,
      description: body.description ?? null,
      severity: body.severity ?? "warning",
      language: body.language ?? null,
      framework: body.framework ?? null,
      filePattern: body.filePattern ?? null,
      pattern: body.pattern ?? null,
      goodExample: body.goodExample ?? null,
      badExample: body.badExample ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Dispatch embedding to durable Workflow (retries automatically)
    try {
      const textForEmbedding = [body.title, body.description, body.pattern, body.badExample]
        .filter(Boolean)
        .join(" ");

      await (env as any).EMBEDDING_WORKFLOW.create({
        id: `rule-embed-${id}`,
        params: {
          type: "rule",
          id,
          text: textForEmbedding,
          metadata: {
            ruleId: id,
            rulesetId,
            ownerId: userId,
            ...(body.language && { language: body.language }),
            ...(body.framework && { framework: body.framework }),
            ...(body.severity && { severity: body.severity }),
          },
        },
      });
    } catch (e) {
      console.warn("Embedding workflow dispatch failed:", e);
    }

    // Increment ruleset ruleCount
    await db
      .update(schema.rulesets)
      .set({ ruleCount: (ruleset.ruleCount ?? 0) + 1, updatedAt: now })
      .where(eq(schema.rulesets.id, rulesetId));

    const [created] = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id))
      .limit(1);

    return json(created, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleUpdateRule(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [rule] = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id))
      .limit(1);

    if (!rule) return json({ error: "Rule not found" }, 404);

    // Verify ownership via ruleset
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(
        and(
          eq(schema.rulesets.id, rule.rulesetId!),
          eq(schema.rulesets.ownerId, userId)
        )
      )
      .limit(1);

    if (!ruleset) return json({ error: "Rule not found" }, 404);

    const body = (await request.json()) as Record<string, any>;
    const now = new Date().toISOString();

    await db
      .update(schema.rules)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.severity !== undefined && { severity: body.severity }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.framework !== undefined && { framework: body.framework }),
        ...(body.filePattern !== undefined && { filePattern: body.filePattern }),
        ...(body.pattern !== undefined && { pattern: body.pattern }),
        ...(body.goodExample !== undefined && { goodExample: body.goodExample }),
        ...(body.badExample !== undefined && { badExample: body.badExample }),
        updatedAt: now,
      })
      .where(eq(schema.rules.id, id));

    // Re-embed via durable Workflow
    try {
      const updated = { ...rule, ...body };
      const textForEmbedding = [updated.title, updated.description, updated.pattern, updated.badExample]
        .filter(Boolean)
        .join(" ");

      await (env as any).EMBEDDING_WORKFLOW.create({
        id: `rule-embed-${id}-${Date.now()}`,
        params: {
          type: "rule",
          id,
          text: textForEmbedding,
          metadata: {
            ruleId: id,
            rulesetId: rule.rulesetId!,
            ownerId: userId,
            ...(updated.language && { language: updated.language }),
            ...(updated.framework && { framework: updated.framework }),
            ...(updated.severity && { severity: updated.severity }),
          },
        },
      });
    } catch (e) {
      console.warn("Embedding workflow dispatch failed:", e);
    }

    await invalidatePrefix(`rules:${userId}`);

    const [result] = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id))
      .limit(1);

    return json(result);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleDeleteRule(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [rule] = await db
      .select()
      .from(schema.rules)
      .where(eq(schema.rules.id, id))
      .limit(1);

    if (!rule) return json({ error: "Rule not found" }, 404);

    // Verify ownership via ruleset
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(
        and(
          eq(schema.rulesets.id, rule.rulesetId!),
          eq(schema.rulesets.ownerId, userId)
        )
      )
      .limit(1);

    if (!ruleset) return json({ error: "Rule not found" }, 404);

    // Delete vector
    try {
      await deleteVectorsByMetadata({ ruleId: id });
    } catch {
      // Vectorize may not be available
    }

    await db.delete(schema.rules).where(eq(schema.rules.id, id));

    // Decrement ruleset ruleCount
    const newCount = Math.max(0, (ruleset.ruleCount ?? 1) - 1);
    await db
      .update(schema.rulesets)
      .set({ ruleCount: newCount, updatedAt: new Date().toISOString() })
      .where(eq(schema.rulesets.id, rule.rulesetId!));

    await invalidatePrefix(`rules:${userId}`);

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
