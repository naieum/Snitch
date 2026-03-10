import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, or, sql } from "drizzle-orm";
import { resolveUser } from "../middleware/api-auth";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleHeartbeat(request: Request): Promise<Response> {
  try {
    // Resolve user from Bearer token
    const user = await resolveUser(request);
    if (!user) {
      return json({ error: "Invalid or expired token" }, 401);
    }
    const { userId } = user;

    const body = (await request.json()) as {
      fingerprint?: string;
      components?: string[];
    };

    const db = createDb((env as any).DB);

    // Get the authorization header to find the specific API key
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Hash the token to find the matching API key
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(token)
    );
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Find the API key record
    const [apiKey] = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.keyHash, keyHash))
      .limit(1);

    if (!apiKey || apiKey.clientType !== "desktop") {
      return json({ error: "Not a desktop activation" }, 400);
    }

    // Fingerprint drift check (3-of-5 components must match)
    if (apiKey.fingerprintComponents) {
      if (!body.components || !Array.isArray(body.components) || body.components.length !== 5) {
        return json({ error: "Fingerprint components required" }, 400);
      }

      let storedComponents: string[];
      try {
        storedComponents = JSON.parse(apiKey.fingerprintComponents);
        if (!Array.isArray(storedComponents) || storedComponents.length !== 5) {
          return json({ error: "Activation data corrupted. Please re-pair this device." }, 500);
        }
      } catch {
        return json({ error: "Activation data corrupted. Please re-pair this device." }, 500);
      }

      let matches = 0;
      for (let i = 0; i < 5; i++) {
        if (body.components[i] === storedComponents[i]) matches++;
      }
      if (matches < 3) {
        return json(
          { error: "Fingerprint drift too high. This token was activated on a different machine." },
          403
        );
      }
    }

    // Update last heartbeat
    await db
      .update(schema.apiKeys)
      .set({ lastHeartbeat: new Date().toISOString() })
      .where(eq(schema.apiKeys.keyHash, keyHash));

    // Get user details for response
    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    // Count desktop activations
    const activationResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.apiKeys)
      .where(
        and(
          eq(schema.apiKeys.userId, userId),
          eq(schema.apiKeys.clientType, "desktop")
        )
      );
    const activationsUsed = activationResult[0]?.count || 1;

    // Use the user's subscriptionTier directly (covers both Stripe and admin-granted)
    const tier = userRecord?.subscriptionTier ?? "free";

    return json({
      status: "active",
      tier,
      email: userRecord?.email || null,
      activations_used: activationsUsed,
      activations_max: 3,
    });
  } catch (e: any) {
    console.error("heartbeat error:", e);
    return json({ error: "Internal server error" }, 500);
  }
}

export async function handleSubscriptionStatus(
  request: Request
): Promise<Response> {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return json({ error: "Invalid or expired token" }, 401);
    }
    const { userId } = user;

    const db = createDb((env as any).DB);

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!userRecord) return json({ error: "User not found" }, 404);

    // Use user's subscriptionTier directly (covers Stripe subscriptions + admin-granted)
    const tier = userRecord.subscriptionTier ?? "free";

    // Check if there's a Stripe subscription backing this tier
    const [sub] = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId))
      .limit(1);

    const isGranted = tier !== "free" && (!sub || sub.status !== "active");

    // Count user's rules (from their rulesets + public rulesets)
    const userRulesets = await db
      .select({ id: schema.rulesets.id })
      .from(schema.rulesets)
      .where(
        or(
          eq(schema.rulesets.ownerId, userId),
          eq(schema.rulesets.isPublic, 1)
        )
      );
    let rulesAvailable = 0;
    for (const rs of userRulesets) {
      const [result] = await db
        .select({ total: sql<number>`count(*)` })
        .from(schema.rules)
        .where(eq(schema.rules.rulesetId, rs.id));
      rulesAvailable += result?.total || 0;
    }
    const categoriesAvailable = userRulesets.length;

    return json({
      tier,
      granted: isGranted,
      rulesAvailable,
      categoriesAvailable,
      skillPurchased: !!userRecord.skillPurchasedAt,
    });
  } catch (e: any) {
    console.error("subscription status error:", e);
    return json({ error: "Internal server error" }, 500);
  }
}
