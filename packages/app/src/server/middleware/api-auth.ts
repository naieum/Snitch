import { nanoid } from "nanoid";
import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq } from "drizzle-orm";
import { createAuth } from "../auth";

const PERMISSION_HIERARCHY: Record<string, number> = {
  read: 1,
  write: 2,
  admin: 3,
};

export async function validateApiKey(
  request: Request,
  requiredPermission: "read" | "write" | "admin" = "read"
): Promise<{ userId: string; keyId: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  if (!key.startsWith("snch_")) return null;

  const keyHash = await hashKey(key);
  const db = createDb((env as any).DB);

  const [apiKey] = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .limit(1);

  if (!apiKey) return null;

  // Permission hierarchy: admin > write > read
  const keyLevel = PERMISSION_HIERARCHY[apiKey.permissions ?? "read"] ?? 0;
  const requiredLevel = PERMISSION_HIERARCHY[requiredPermission] ?? 0;
  if (keyLevel < requiredLevel) return null;

  // Update last used timestamp (throttled to once per hour)
  const ONE_HOUR_MS = 3600_000;
  const lastUsed = apiKey.lastUsedAt
    ? new Date(apiKey.lastUsedAt).getTime()
    : 0;
  if (Date.now() - lastUsed > ONE_HOUR_MS) {
    await db
      .update(schema.apiKeys)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(schema.apiKeys.id, apiKey.id));
  }

  return { userId: apiKey.userId, keyId: apiKey.id };
}

export async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateApiKey(): string {
  return `snch_${nanoid(48)}`;
}

export async function resolveUser(
  request: Request
): Promise<{ userId: string; source: "apiKey" | "session" } | null> {
  // Try API key first
  const apiKeyResult = await validateApiKey(request, "read");
  if (apiKeyResult) {
    return { userId: apiKeyResult.userId, source: "apiKey" };
  }

  // Fall back to session auth
  try {
    const origin =
      request.headers.get("Origin") || new URL(request.url).origin;
    const auth = createAuth(env as any, origin);
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.id) {
      return { userId: session.user.id, source: "session" };
    }
  } catch {
    // Session auth failed
  }

  return null;
}
