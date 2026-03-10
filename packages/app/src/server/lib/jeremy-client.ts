import { env } from "cloudflare:workers";

export interface JeremySearchResult {
  libraries: {
    id: string;
    name: string;
    description?: string;
    version?: string;
  }[];
}

export interface JeremyContextResult {
  chunks: {
    id: string;
    title: string;
    content: string;
    url?: string;
    tokenCount?: number;
  }[];
}

export async function jeremySearch(
  libraryName: string
): Promise<JeremySearchResult> {
  const apiKey = (env as any).JEREMY_API_KEY as string;
  const baseUrl =
    (env as any).JEREMY_API_URL ||
    "https://jeremy-app.ian-muench.workers.dev";

  const url = new URL(`${baseUrl}/api/search`);
  url.searchParams.set("libraryName", libraryName);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Jeremy API error: ${res.status}`);
  return res.json() as Promise<JeremySearchResult>;
}

export async function jeremyContext(
  libraryId: string,
  query: string,
  opts?: { topK?: number; maxTokens?: number }
): Promise<JeremyContextResult> {
  const apiKey = (env as any).JEREMY_API_KEY as string;
  const baseUrl =
    (env as any).JEREMY_API_URL ||
    "https://jeremy-app.ian-muench.workers.dev";

  const url = new URL(`${baseUrl}/api/context`);
  url.searchParams.set("libraryId", libraryId);
  url.searchParams.set("query", query);
  if (opts?.topK) url.searchParams.set("topK", String(opts.topK));
  if (opts?.maxTokens)
    url.searchParams.set("maxTokens", String(opts.maxTokens));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Jeremy API error: ${res.status}`);
  return res.json() as Promise<JeremyContextResult>;
}
