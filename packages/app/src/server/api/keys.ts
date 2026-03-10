import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, gt } from "drizzle-orm";
import { generateApiKey, hashKey } from "../middleware/api-auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleListKeys(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const keys = await db
      .select({
        id: schema.apiKeys.id,
        name: schema.apiKeys.name,
        keyPrefix: schema.apiKeys.keyPrefix,
        permissions: schema.apiKeys.permissions,
        lastUsedAt: schema.apiKeys.lastUsedAt,
        createdAt: schema.apiKeys.createdAt,
        clientType: schema.apiKeys.clientType,
        machineLabel: schema.apiKeys.machineLabel,
        lastHeartbeat: schema.apiKeys.lastHeartbeat,
      })
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, userId));

    return json(keys);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleListSessions(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const sessions = await db
      .select({
        id: schema.session.id,
        createdAt: schema.session.createdAt,
        expiresAt: schema.session.expiresAt,
        ipAddress: schema.session.ipAddress,
        userAgent: schema.session.userAgent,
      })
      .from(schema.session)
      .where(
        and(
          eq(schema.session.userId, userId),
          gt(schema.session.expiresAt, new Date())
        )
      );

    return json(sessions);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleDeleteSession(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [existing] = await db
      .select()
      .from(schema.session)
      .where(
        and(eq(schema.session.id, id), eq(schema.session.userId, userId))
      )
      .limit(1);

    if (!existing) return json({ error: "Session not found" }, 404);

    await db.delete(schema.session).where(eq(schema.session.id, id));

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleCreateToken(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;
    const name = typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "MCP Token";

    const db = createDb((env as any).DB);

    const rawKey = generateApiKey();
    const keyHashValue = await hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(schema.apiKeys).values({
      id,
      userId,
      name,
      keyHash: keyHashValue,
      keyPrefix,
      permissions: "read",
      createdAt: now,
      clientType: "mcp",
    });

    // Return the raw token ONCE — it cannot be retrieved again
    return json({ id, name, token: rawKey, keyPrefix, createdAt: now }, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleDeleteKey(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(schema.apiKeys)
      .where(and(eq(schema.apiKeys.id, id), eq(schema.apiKeys.userId, userId)))
      .limit(1);

    if (!existing) return json({ error: "API key not found" }, 404);

    await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));

    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
