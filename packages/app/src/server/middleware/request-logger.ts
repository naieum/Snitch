import { createDb, schema } from "../db";

export async function logRequest(
  db: ReturnType<typeof createDb>,
  data: {
    userId?: string;
    method: string;
    path: string;
    statusCode: number;
    latency: number;
    userAgent?: string;
    ip?: string;
  }
): Promise<void> {
  const hashedIp = data.ip ? await hashIp(data.ip) : null;
  await db.insert(schema.requestLogs).values({
    id: crypto.randomUUID(),
    userId: data.userId ?? null,
    method: data.method,
    path: data.path,
    statusCode: data.statusCode,
    latency: data.latency,
    userAgent: data.userAgent ?? null,
    ip: hashedIp,
    timestamp: new Date().toISOString(),
  });
}

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "snitchmcp-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
