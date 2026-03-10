import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { generateEmbedding } from "../lib/embeddings";
import { queryVectors } from "../lib/vectorize";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleCreateMemory(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;
    if (!body.projectId || typeof body.projectId !== "string") {
      return json({ error: "projectId is required" }, 400);
    }
    if (!body.content || typeof body.content !== "string") {
      return json({ error: "content is required" }, 400);
    }
    if (body.content.length > 10_000) {
      return json({ error: "content must be under 10,000 characters" }, 400);
    }

    const db = createDb((env as any).DB);

    // Verify project ownership
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(
        and(
          eq(schema.projects.id, body.projectId),
          eq(schema.projects.ownerId, userId)
        )
      )
      .limit(1);

    if (!project) return json({ error: "Project not found" }, 404);

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.insert(schema.memories).values({
      id,
      projectId: body.projectId,
      content: body.content,
      context: body.context ?? null,
      source: body.source ?? null,
      createdAt: now,
    });

    // Dispatch embedding to durable Workflow
    try {
      const textForEmbedding = [body.content, body.context].filter(Boolean).join(" ");
      await (env as any).EMBEDDING_WORKFLOW.create({
        id: `memory-embed-${id}`,
        params: {
          type: "memory",
          id,
          text: textForEmbedding,
          metadata: {
            memoryId: id,
            projectId: body.projectId,
            ownerId: userId,
          },
        },
      });
    } catch (e) {
      console.warn("Embedding workflow dispatch failed:", e);
    }

    const [created] = await db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.id, id))
      .limit(1);

    return json(created, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleListMemories(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const query = url.searchParams.get("query");

    if (!projectId) {
      return json({ error: "projectId query parameter is required" }, 400);
    }

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

    // Semantic search if query provided
    if (query) {
      try {
        const embedding = await generateEmbedding(query);
        const matches = await queryVectors(embedding, {
          topK: 20,
          filter: { projectId },
        });

        if (matches.length > 0) {
          const memoryIds = matches.map(
            (m: any) => m.metadata?.memoryId as string
          ).filter(Boolean);

          const memories = await db
            .select()
            .from(schema.memories)
            .where(eq(schema.memories.projectId, projectId));

          // Order by vector relevance
          const memoryMap = new Map(memories.map((m) => [m.id, m]));
          const ordered = memoryIds
            .map((id: string) => memoryMap.get(id))
            .filter(Boolean);

          // Include any memories not in vector results at the end
          const remainingIds = new Set(memoryIds);
          const remaining = memories.filter((m) => !remainingIds.has(m.id));

          return json([...ordered, ...remaining]);
        }
      } catch (e) {
        console.warn("Vector search failed, falling back to list:", e);
      }
    }

    // Default: list all memories for project
    const rows = await db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.projectId, projectId))
      .orderBy(desc(schema.memories.createdAt));

    return json(rows);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
