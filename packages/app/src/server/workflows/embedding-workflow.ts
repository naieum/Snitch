import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

export interface EmbeddingParams {
  type: "rule" | "memory";
  id: string;
  text: string;
  metadata: Record<string, string>;
}

export class EmbeddingWorkflow extends WorkflowEntrypoint<Env, EmbeddingParams> {
  async run(event: WorkflowEvent<EmbeddingParams>, step: WorkflowStep) {
    const { type, id, text, metadata } = event.payload;

    // Step 1: Generate embedding via Workers AI
    const embedding = await step.do(
      `generate-embedding-${type}-${id}`,
      {
        retries: { limit: 3, delay: "5 seconds", backoff: "exponential" },
        timeout: "30 seconds",
      },
      async () => {
        const result = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: [text],
        });
        return (result as { data: number[][] }).data[0] as number[];
      }
    );

    // Step 2: Upsert to Vectorize
    await step.do(
      `vectorize-upsert-${type}-${id}`,
      {
        retries: { limit: 3, delay: "2 seconds", backoff: "exponential" },
        timeout: "15 seconds",
      },
      async () => {
        await this.env.VECTORIZE.upsert([
          { id, values: embedding, metadata },
        ]);
      }
    );

    // Step 3: Cache the embedding for future lookups
    await step.do(
      `cache-embedding-${id}`,
      {
        retries: { limit: 1, delay: "1 second" },
        timeout: "5 seconds",
      },
      async () => {
        const hash = await hashText(text);
        await this.env.CACHE.put(
          `emb:${hash}`,
          JSON.stringify(embedding),
          { expirationTtl: 86400 }
        );
      }
    );

    return { type, id, vectorized: true };
  }
}

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  CACHE: KVNamespace;
}
