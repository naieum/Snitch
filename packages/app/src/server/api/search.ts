import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, like, or, inArray } from "drizzle-orm";
import { generateEmbedding } from "../lib/embeddings";
import { queryVectors } from "../lib/vectorize";
import { incrementUsage } from "../middleware/rate-limit";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleSearch(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const language = url.searchParams.get("language");
    const framework = url.searchParams.get("framework");
    const topK = parseInt(url.searchParams.get("topK") ?? "10", 10);

    if (!query) {
      return json({ error: "query parameter is required" }, 400);
    }

    const db = createDb((env as any).DB);

    // Try vector search first
    try {
      const embedding = await generateEmbedding(query);

      const filter: Record<string, string> = { ownerId: userId };
      if (language) filter.language = language;
      if (framework) filter.framework = framework;

      const matches = await queryVectors(embedding, {
        topK,
        filter,
      });

      if (matches.length > 0) {
        const ruleIds = matches
          .map((m: any) => m.metadata?.ruleId as string)
          .filter(Boolean);

        const rules = await db
          .select()
          .from(schema.rules)
          .where(inArray(schema.rules.id, ruleIds));

        // Order by vector relevance
        const ruleMap = new Map(rules.map((r) => [r.id, r]));
        const orderedRules = ruleIds
          .map((id: string) => ruleMap.get(id))
          .filter(Boolean);

        await incrementUsage(userId, "searches");

        return json({ rules: orderedRules });
      }
    } catch (e) {
      console.warn("Vector search failed, falling back to D1:", e);
    }

    // Fallback: D1 LIKE search
    const searchPattern = `%${query}%`;

    // Get user's rulesets first
    const userRulesets = await db
      .select({ id: schema.rulesets.id })
      .from(schema.rulesets)
      .where(eq(schema.rulesets.ownerId, userId));

    if (userRulesets.length === 0) {
      await incrementUsage(userId, "searches");
      return json({ rules: [] });
    }

    const rulesetIds = userRulesets.map((r) => r.id);

    let rules = await db
      .select()
      .from(schema.rules)
      .where(
        and(
          inArray(schema.rules.rulesetId, rulesetIds),
          or(
            like(schema.rules.title, searchPattern),
            like(schema.rules.description, searchPattern)
          )
        )
      );

    // Apply optional filters
    if (language) {
      rules = rules.filter((r) => r.language === language);
    }
    if (framework) {
      rules = rules.filter((r) => r.framework === framework);
    }

    await incrementUsage(userId, "searches");

    return json({ rules: rules.slice(0, topK) });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

