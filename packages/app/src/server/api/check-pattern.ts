import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, inArray } from "drizzle-orm";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

interface PatternMatch {
  ruleId: string;
  title: string;
  severity: string | null;
  description: string | null;
  line: number | null;
}

export async function handleCheckPattern(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;
    if (!body.code || typeof body.code !== "string") {
      return json({ error: "code is required" }, 400);
    }
    if (body.code.length > 100_000) {
      return json({ error: "code must be under 100,000 characters" }, 400);
    }

    const db = createDb((env as any).DB);

    // Get user's rulesets
    const userRulesets = await db
      .select({ id: schema.rulesets.id })
      .from(schema.rulesets)
      .where(eq(schema.rulesets.ownerId, userId));

    if (userRulesets.length === 0) {
      return json({ matches: [] });
    }

    const rulesetIds = userRulesets.map((r) => r.id);

    // Fetch all rules for user's rulesets
    let rules = await db
      .select()
      .from(schema.rules)
      .where(inArray(schema.rules.rulesetId, rulesetIds));

    // Filter by language if provided
    if (body.language) {
      rules = rules.filter(
        (r) => !r.language || r.language === body.language
      );
    }

    // Filter by file pattern if filePath provided
    if (body.filePath) {
      rules = rules.filter((r) => {
        if (!r.filePattern) return true;
        try {
          const regex = new RegExp(r.filePattern);
          return regex.test(body.filePath);
        } catch {
          return true;
        }
      });
    }

    const matches: PatternMatch[] = [];
    const lines = body.code.split("\n");

    for (const rule of rules) {
      if (!rule.pattern) continue;

      try {
        const regex = new RegExp(rule.pattern, "gm");
        let match: RegExpExecArray | null;
        let matchCount = 0;

        while ((match = regex.exec(body.code)) !== null) {
          if (++matchCount > 100) break;
          // Find line number
          const beforeMatch = body.code.slice(0, match.index);
          const lineNumber = beforeMatch.split("\n").length;

          matches.push({
            ruleId: rule.id,
            title: rule.title,
            severity: rule.severity,
            description: rule.description,
            line: lineNumber,
          });

          // Avoid infinite loops on zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } catch {
        // Invalid regex pattern, skip
      }
    }

    return json({ matches });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
