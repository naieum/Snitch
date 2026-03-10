import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";

export interface BulkEmbeddingParams {
  items: {
    id: string;
    text: string;
    metadata: Record<string, string>;
  }[];
}

export class BulkEmbeddingWorkflow extends WorkflowEntrypoint<Env, BulkEmbeddingParams> {
  async run(event: WorkflowEvent<BulkEmbeddingParams>, step: WorkflowStep) {
    const { items } = event.payload;

    // Step 1: Generate embeddings in batches of 100 (Workers AI limit)
    const batchSize = 100;
    const allVectors: { id: string; values: number[]; metadata: Record<string, string> }[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize);

      const embeddings = await step.do(
        `generate-embeddings-batch-${batchNum}`,
        {
          retries: { limit: 3, delay: "10 seconds", backoff: "exponential" },
          timeout: "60 seconds",
        },
        async () => {
          const texts = batch.map((item) => item.text);
          const result = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
            text: texts,
          });
          return (result as { data: number[][] }).data;
        }
      );

      for (let j = 0; j < batch.length; j++) {
        allVectors.push({
          id: batch[j].id,
          values: embeddings[j],
          metadata: batch[j].metadata,
        });
      }
    }

    // Step 2: Upsert vectors in batches of 1000 (Vectorize limit)
    const vectorBatchSize = 1000;
    for (let i = 0; i < allVectors.length; i += vectorBatchSize) {
      const batch = allVectors.slice(i, i + vectorBatchSize);
      const batchNum = Math.floor(i / vectorBatchSize);

      await step.do(
        `vectorize-upsert-batch-${batchNum}`,
        {
          retries: { limit: 3, delay: "5 seconds", backoff: "exponential" },
          timeout: "30 seconds",
        },
        async () => {
          await this.env.VECTORIZE.upsert(batch);
        }
      );
    }

    return { processed: items.length, vectorized: allVectors.length };
  }
}

interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
}
