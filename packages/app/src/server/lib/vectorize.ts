import { env } from "cloudflare:workers";

export interface RuleVectorMetadata {
  ruleId: string;
  rulesetId: string;
  ownerId: string;
  language?: string;
  framework?: string;
  severity?: string;
}

export interface MemoryVectorMetadata {
  memoryId: string;
  projectId: string;
  ownerId: string;
}

export async function upsertVectors(
  vectors: {
    id: string;
    values: number[];
    metadata: Record<string, string>;
  }[]
) {
  // Vectorize supports up to 1000 vectors per upsert
  const batchSize = 1000;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await (env as any).VECTORIZE.upsert(vectors.slice(i, i + batchSize));
  }
}

export async function queryVectors(
  vector: number[],
  options: {
    topK?: number;
    filter?: Record<string, string>;
  } = {}
) {
  const results = await (env as any).VECTORIZE.query(vector, {
    topK: options.topK ?? 5,
    returnMetadata: "all",
    filter: options.filter,
  });
  return results.matches;
}

export async function deleteVectorsByMetadata(
  filter: Record<string, string>
) {
  await (env as any).VECTORIZE.deleteByMetadata(filter);
}
