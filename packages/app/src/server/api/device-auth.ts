import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const deviceCodeAttempts = new Map<string, { count: number; resetAt: number }>();

function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * POST /api/auth/device — Request a device code (no auth required)
 */
export async function handleDeviceCodeRequest(
  request: Request
): Promise<Response> {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const nowMs = Date.now();
    const attempt = deviceCodeAttempts.get(ip);
    if (attempt && attempt.resetAt > nowMs && attempt.count >= 10) {
      return json({ error: "Too many requests. Try again later." }, 429);
    }
    if (!attempt || attempt.resetAt <= nowMs) {
      deviceCodeAttempts.set(ip, { count: 1, resetAt: nowMs + 60_000 });
    } else {
      attempt.count++;
    }

    const body = await request.json().catch(() => ({})) as {
      client_type?: string;
      fingerprint?: string;
      components?: string[];
      machine_label?: string;
    };

    // Validate input lengths
    if (body.fingerprint && (typeof body.fingerprint !== 'string' || body.fingerprint.length > 256)) {
      return json({ error: "Invalid fingerprint" }, 400);
    }
    if (body.machine_label && (typeof body.machine_label !== 'string' || body.machine_label.length > 128)) {
      return json({ error: "Invalid machine label" }, 400);
    }
    if (body.components) {
      if (!Array.isArray(body.components) || body.components.length > 10) {
        return json({ error: "Invalid components" }, 400);
      }
      for (const c of body.components) {
        if (typeof c !== 'string' || c.length > 256) {
          return json({ error: "Invalid component" }, 400);
        }
      }
    }

    const db = createDb((env as any).DB);
    const deviceCode = nanoid(48);
    const userCode = generateUserCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    await db.insert(schema.deviceCodes).values({
      deviceCode,
      userCode,
      expiresAt,
      status: "pending",
      createdAt: now,
      clientType: body.client_type || "mcp",
      machineFingerprint: body.fingerprint || null,
      fingerprintComponents: body.components ? JSON.stringify(body.components) : null,
      machineLabel: body.machine_label || null,
    });

    return json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: "https://snitch.live/pair",
      expires_in: 900,
      interval: 5,
    });
  } catch (e: any) {
    console.error("device-auth error:", e);
    return json({ error: "Internal server error" }, 500);
  }
}

/**
 * POST /api/auth/device/token — Poll for token (no auth required)
 */
export async function handleDeviceTokenPoll(
  request: Request
): Promise<Response> {
  try {
    const body = await request.json();
    const { device_code } = body as { device_code: string };

    if (!device_code) {
      return json({ error: "device_code is required" }, 400);
    }

    const db = createDb((env as any).DB);
    const [record] = await db
      .select()
      .from(schema.deviceCodes)
      .where(eq(schema.deviceCodes.deviceCode, device_code))
      .limit(1);

    if (!record) {
      return json({ error: "invalid_device_code" }, 404);
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      await db
        .delete(schema.deviceCodes)
        .where(eq(schema.deviceCodes.deviceCode, device_code));
      return json({ error: "expired_token" }, 400);
    }

    if (record.status === "pending") {
      return json({ error: "authorization_pending" }, 400);
    }

    if (record.status === "paired" && record.accessToken) {
      // Clean up used device code
      await db
        .delete(schema.deviceCodes)
        .where(eq(schema.deviceCodes.deviceCode, device_code));

      return json({
        access_token: record.accessToken,
        token_type: "Bearer",
      });
    }

    return json({ error: "authorization_pending" }, 400);
  } catch (e: any) {
    console.error("device-auth error:", e);
    return json({ error: "Internal server error" }, 500);
  }
}

/**
 * POST /api/auth/device/pair — Pair a device code with a user (requires session auth)
 */
export async function handleDevicePair(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = await request.json();
    const { user_code } = body as { user_code: string };

    if (!user_code) {
      return json({ error: "user_code is required" }, 400);
    }

    const db = createDb((env as any).DB);
    const [record] = await db
      .select()
      .from(schema.deviceCodes)
      .where(eq(schema.deviceCodes.userCode, user_code.toUpperCase()))
      .limit(1);

    if (!record) {
      return json({ error: "Invalid pairing code" }, 404);
    }

    if (new Date() > record.expiresAt) {
      await db
        .delete(schema.deviceCodes)
        .where(eq(schema.deviceCodes.deviceCode, record.deviceCode));
      return json({ error: "Pairing code expired" }, 400);
    }

    if (record.status !== "pending") {
      return json({ error: "Code already used" }, 400);
    }

    // Desktop client checks
    if (record.clientType === "desktop") {
      // Verify user has purchased Snitch
      const [userRecord] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, userId))
        .limit(1);

      if (!userRecord?.skillPurchasedAt) {
        return json({ error: "Purchase required. Buy Snitch at snitch.live/plugin" }, 403);
      }

      // Check activation limit (max 3 desktop activations)
      const activationResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, userId),
            eq(schema.apiKeys.clientType, "desktop")
          )
        );
      const activationsUsed = activationResult[0]?.count || 0;

      if (activationsUsed >= 3) {
        return json({ error: "Activation limit reached. Max 3 machines." }, 403);
      }
    }

    // Generate a long-lived API token
    const prefix = record.clientType === "desktop" ? "snch_desktop_" : "snch_mcp_";
    const accessToken = `${prefix}${nanoid(48)}`;

    await db
      .update(schema.deviceCodes)
      .set({
        userId,
        accessToken,
        status: "paired",
      })
      .where(eq(schema.deviceCodes.deviceCode, record.deviceCode));

    // Also store as an API key so it works with resolveUser()
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(accessToken)
    );
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await db.insert(schema.apiKeys).values({
      id: crypto.randomUUID(),
      userId,
      name: record.clientType === "desktop"
        ? `Desktop: ${record.machineLabel || "Unknown machine"}`
        : "MCP Device Pairing",
      keyHash,
      keyPrefix: accessToken.slice(0, 12),
      permissions: "read",
      createdAt: new Date().toISOString(),
      clientType: record.clientType || "mcp",
      machineFingerprint: record.machineFingerprint || null,
      fingerprintComponents: record.fingerprintComponents || null,
      machineLabel: record.machineLabel || null,
    });

    // Re-verify activation count after insert (close TOCTOU window)
    if (record.clientType === "desktop") {
      const postInsertCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.userId, userId),
            eq(schema.apiKeys.clientType, "desktop")
          )
        );
      if ((postInsertCount[0]?.count || 0) > 3) {
        // Race condition detected — roll back by deleting the just-created key
        await db
          .delete(schema.apiKeys)
          .where(eq(schema.apiKeys.keyHash, keyHash));
        return json({ error: "Activation limit reached. Max 3 machines." }, 403);
      }
    }

    return json({ success: true, message: "Device paired successfully" });
  } catch (e: any) {
    console.error("device-auth error:", e);
    return json({ error: "Internal server error" }, 500);
  }
}
