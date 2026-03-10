import { env } from "cloudflare:workers";
import { createDb, schema } from "../db";
import { eq, and, desc } from "drizzle-orm";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function handleCreateScan(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, any>;

    const {
      scanType,
      categoriesScanned,
      totalFindings,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      source,
      findings,
      projectId,
    } = body;

    if (!scanType || typeof scanType !== "string") {
      return json({ error: "scanType is required" }, 400);
    }

    if (totalFindings == null || typeof totalFindings !== "number") {
      return json({ error: "totalFindings is required and must be a number" }, 400);
    }

    const db = createDb((env as any).DB);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Resolve project name if projectId is provided
    let projectName = body.projectName ?? "Unknown";
    if (projectId) {
      const [project] = await db
        .select({ name: schema.projects.name })
        .from(schema.projects)
        .where(
          and(
            eq(schema.projects.id, projectId),
            eq(schema.projects.ownerId, userId)
          )
        )
        .limit(1);
      if (project) projectName = project.name;
    }

    await db.insert(schema.scans).values({
      id,
      userId,
      projectId: projectId ?? null,
      projectName,
      scanType,
      categoriesScanned: categoriesScanned ?? null,
      totalFindings,
      criticalCount: criticalCount ?? 0,
      highCount: highCount ?? 0,
      mediumCount: mediumCount ?? 0,
      lowCount: lowCount ?? 0,
      source: source ?? "mcp",
      findings: findings ? JSON.stringify(findings) : null,
      createdAt: now,
    });

    return json({ id, createdAt: now }, 201);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleListScans(
  request: Request,
  userId: string
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const db = createDb((env as any).DB);

    const conditions = [eq(schema.scans.userId, userId)];
    if (projectId) {
      conditions.push(eq(schema.scans.projectId, projectId));
    }

    const rows = await db
      .select()
      .from(schema.scans)
      .where(and(...conditions))
      .orderBy(desc(schema.scans.createdAt));

    // Parse findings JSON for each row
    const result = rows.map((row) => {
      let parsedFindings = [];
      try { parsedFindings = JSON.parse(row.findings); } catch { parsedFindings = []; }
      return {
        ...row,
        findings: parsedFindings,
      };
    });

    return json(result);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}

export async function handleGetScan(
  request: Request,
  userId: string,
  id: string
): Promise<Response> {
  try {
    const db = createDb((env as any).DB);

    const [scan] = await db
      .select()
      .from(schema.scans)
      .where(and(eq(schema.scans.id, id), eq(schema.scans.userId, userId)))
      .limit(1);

    if (!scan) return json({ error: "Scan not found" }, 404);

    let parsedFindings = [];
    try { parsedFindings = JSON.parse(scan.findings); } catch { parsedFindings = []; }

    return json({
      ...scan,
      findings: parsedFindings,
    });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
}
