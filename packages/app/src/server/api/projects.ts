import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { checkLimit } from "../middleware/rate-limit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleListProjects(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.ownerId, userId));

    return json(rows);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleGetProject(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, userId)))
      .limit(1);

    if (!project) return json({ error: "Project not found" }, 404);

    // Get linked rulesets
    const linkedRulesets = await db
      .select({
        id: schema.rulesets.id,
        name: schema.rulesets.name,
        description: schema.rulesets.description,
        category: schema.rulesets.category,
        ruleCount: schema.rulesets.ruleCount,
      })
      .from(schema.projectRulesets)
      .innerJoin(
        schema.rulesets,
        eq(schema.projectRulesets.rulesetId, schema.rulesets.id)
      )
      .where(eq(schema.projectRulesets.projectId, id));

    return json({ ...project, rulesets: linkedRulesets });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleCreateProject(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;
    if (!body.name || typeof body.name !== "string") {
      return json({ error: "name is required" }, 400);
    }

    const db = createDb((env as any).DB);

    // Get user tier and check limits
    const [userRecord] = await db
      .select({ subscriptionTier: schema.user.subscriptionTier })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    const tier = userRecord?.subscriptionTier ?? "free";
    const limitCheck = await checkLimit(userId, "projects", tier);
    if (!limitCheck.allowed) {
      return json(
        { error: "Project limit reached", limit: limitCheck.limit, current: limitCheck.current },
        403
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(schema.projects).values({
      id,
      name: body.name,
      description: body.description ?? null,
      languages: body.languages ? JSON.stringify(body.languages) : null,
      frameworks: body.frameworks ? JSON.stringify(body.frameworks) : null,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    return json(created, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleUpdateProject(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, userId)))
      .limit(1);

    if (!existing) return json({ error: "Project not found" }, 404);

    const body = (await request.json()) as Record<string, any>;
    const now = new Date().toISOString();

    await db
      .update(schema.projects)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.languages !== undefined && { languages: Array.isArray(body.languages) ? JSON.stringify(body.languages) : body.languages }),
        ...(body.frameworks !== undefined && { frameworks: Array.isArray(body.frameworks) ? JSON.stringify(body.frameworks) : body.frameworks }),
        updatedAt: now,
      })
      .where(eq(schema.projects.id, id));

    const [updated] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);

    return json(updated);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleDeleteProject(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [existing] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, id), eq(schema.projects.ownerId, userId)))
      .limit(1);

    if (!existing) return json({ error: "Project not found" }, 404);

    // Cascade delete handled by DB foreign keys (memories, projectRulesets)
    await db.delete(schema.projects).where(eq(schema.projects.id, id));

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleGetProjectRulesets(
  request: Request,
  userId: string,
  projectId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify project ownership
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(
        and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, userId))
      )
      .limit(1);

    if (!project) return json({ error: "Project not found" }, 404);

    const linkedRulesets = await db
      .select({
        rulesetId: schema.rulesets.id,
        name: schema.rulesets.name,
        category: schema.rulesets.category,
      })
      .from(schema.projectRulesets)
      .innerJoin(
        schema.rulesets,
        eq(schema.projectRulesets.rulesetId, schema.rulesets.id)
      )
      .where(eq(schema.projectRulesets.projectId, projectId));

    return json(linkedRulesets);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleLinkRuleset(
  request: Request,
  userId: string,
  projectId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify project ownership
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(
        and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, userId))
      )
      .limit(1);

    if (!project) return json({ error: "Project not found" }, 404);

    const body = (await request.json()) as Record<string, any>;
    if (!body.rulesetId || typeof body.rulesetId !== "string") {
      return json({ error: "rulesetId is required" }, 400);
    }

    // Verify ruleset exists and user owns it (or it's public)
    const [ruleset] = await db
      .select()
      .from(schema.rulesets)
      .where(eq(schema.rulesets.id, body.rulesetId))
      .limit(1);

    if (!ruleset) return json({ error: "Ruleset not found" }, 404);
    if (ruleset.ownerId !== userId && !ruleset.isPublic) {
      return json({ error: "Ruleset not found" }, 404);
    }

    await db
      .insert(schema.projectRulesets)
      .values({ projectId, rulesetId: body.rulesetId })
      .onConflictDoNothing();

    return json({ success: true }, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleUnlinkRuleset(
  request: Request,
  userId: string,
  projectId: string,
  rulesetId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify project ownership
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(
        and(eq(schema.projects.id, projectId), eq(schema.projects.ownerId, userId))
      )
      .limit(1);

    if (!project) return json({ error: "Project not found" }, 404);

    await db
      .delete(schema.projectRulesets)
      .where(
        and(
          eq(schema.projectRulesets.projectId, projectId),
          eq(schema.projectRulesets.rulesetId, rulesetId)
        )
      );

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
