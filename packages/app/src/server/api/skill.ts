import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq } from "drizzle-orm";
import { incrementUsage } from "../middleware/rate-limit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const CURRENT_SKILL_VERSION = "6.0.0";

export async function handleSkillDownload(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!userRecord) return json({ error: "User not found" }, 404);

    if (!userRecord.skillPurchasedAt) {
      return json(
        {
          error: "Skill not purchased",
          purchaseUrl: "https://snitch.live/plugin",
          message: "Purchase the Snitch skill at snitch.live/plugin for $39.99",
        },
        403
      );
    }

    // Serve zip from R2
    const bucket = (env as any).EXPORTS_BUCKET as R2Bucket;
    const object = await bucket.get(`skill-v${CURRENT_SKILL_VERSION}.zip`);

    if (!object) {
      return json({ error: "Skill archive not found" }, 404);
    }

    await incrementUsage(userId, "skill_download");

    return new Response(object.body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="snitch-skill-v${CURRENT_SKILL_VERSION}.zip"`,
      },
    });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleSkillVersion(): Promise<Response> {
  return json({ version: CURRENT_SKILL_VERSION });
}
