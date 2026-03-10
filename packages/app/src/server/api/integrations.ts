import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and } from "drizzle-orm";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const VALID_PLATFORMS = ["slack", "teams", "discord"];
const VALID_THRESHOLDS = ["critical", "high", "medium", "all"];

export async function handleCreateOrUpdateIntegration(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;

    const { platform, webhookUrl, threshold, weeklyDigest, id } = body;

    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return json({ error: "platform must be one of: slack, teams, discord" }, 400);
    }

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return json({ error: "webhookUrl is required" }, 400);
    }

    if (webhookUrl.length > 2000) {
      return json({ error: "webhookUrl must be under 2000 characters" }, 400);
    }

    try {
      const parsedUrl = new URL(webhookUrl);
      if (!["https:", "http:"].includes(parsedUrl.protocol)) {
        return new Response(JSON.stringify({ error: "Webhook URL must use http or https" }), { status: 400 });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid webhook URL" }), { status: 400 });
    }

    const resolvedThreshold = threshold && VALID_THRESHOLDS.includes(threshold) ? threshold : "high";
    const resolvedDigest = weeklyDigest === true;

    const db = createDb((env as any).DB);
    const now = new Date().toISOString();

    // Update existing integration
    if (id) {
      const [existing] = await db
        .select()
        .from(schema.integrations)
        .where(
          and(
            eq(schema.integrations.id, id),
            eq(schema.integrations.userId, userId)
          )
        )
        .limit(1);

      if (!existing) return json({ error: "Integration not found" }, 404);

      await db
        .update(schema.integrations)
        .set({
          platform,
          webhookUrl,
          threshold: resolvedThreshold,
          weeklyDigest: resolvedDigest ? 1 : 0,
          updatedAt: now,
        })
        .where(and(eq(schema.integrations.id, id), eq(schema.integrations.userId, userId)));

      return json({ id, updated: true });
    }

    // Create new integration
    const newId = crypto.randomUUID();

    await db.insert(schema.integrations).values({
      id: newId,
      userId,
      platform,
      webhookUrl,
      threshold: resolvedThreshold,
      weeklyDigest: resolvedDigest ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });

    return json({ id: newId, created: true }, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleListIntegrations(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const rows = await db
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.userId, userId));

    // Map weeklyDigest integer to boolean for frontend
    const result = rows.map((row) => ({
      ...row,
      weeklyDigest: row.weeklyDigest === 1,
    }));

    return json(result);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleDeleteIntegration(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [existing] = await db
      .select()
      .from(schema.integrations)
      .where(
        and(
          eq(schema.integrations.id, id),
          eq(schema.integrations.userId, userId)
        )
      )
      .limit(1);

    if (!existing) return json({ error: "Integration not found" }, 404);

    await db
      .delete(schema.integrations)
      .where(and(eq(schema.integrations.id, id), eq(schema.integrations.userId, userId)));

    return json({ deleted: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
