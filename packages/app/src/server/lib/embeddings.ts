import { env } from "cloudflare:workers";
import { getCached, setCache, hashCacheKey } from "./cache";

const EMBEDDING_CACHE_TTL = 86400; // 24 hours

export async function generateEmbedding(text: string): Promise<number[]> {
  const hash = await hashCacheKey(text);
  const cacheKey = `emb:${hash}`;

  const cached = await getCached<number[]>(cacheKey);
  if (cached) return cached;

  const result = await (env as any).AI.run("@cf/baai/bge-base-en-v1.5", {
    text: [text],
  });
  const embedding = result.data[0];

  await setCache(cacheKey, embedding, EMBEDDING_CACHE_TTL);
  return embedding;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  // Workers AI supports batching up to 100 texts
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const result = await (env as any).AI.run("@cf/baai/bge-base-en-v1.5", {
      text: batch,
    });
    allEmbeddings.push(...result.data);
  }

  return allEmbeddings;
}
