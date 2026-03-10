/**
 * Snitch MCP client — calls the Snitch MCP server to get audit methodology
 * Reused from snitch-action with identical MCP logic.
 */

const MCP_BASE = "https://mcp.snitch.live";

interface McpResponse {
  jsonrpc: string;
  result?: {
    content?: Array<{ type: string; text: string }>;
  };
  error?: { code: number; message: string };
  id: number;
}

async function mcpCall(
  method: string,
  params: Record<string, any>,
  apiKey: string
): Promise<McpResponse> {
  const res = await fetch(`${MCP_BASE}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });

  if (!res.ok) {
    throw new Error(`MCP request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<McpResponse>;
}

export async function startAudit(
  apiKey: string,
  scanType: string,
  categories?: number[]
): Promise<string> {
  const args: Record<string, any> = { scanType, scope: "diff" };
  if (categories && categories.length > 0) {
    args.categories = categories;
  }

  const response = await mcpCall(
    "tools/call",
    { name: "start-audit", arguments: args },
    apiKey
  );

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  const text = response.result?.content?.[0]?.text;
  if (!text) {
    throw new Error("No methodology returned from start-audit");
  }

  return text;
}

export async function getSubscriptionStatus(
  apiKey: string
): Promise<{ tier: string; categories: number[]; totalCategories: number }> {
  const response = await mcpCall(
    "tools/call",
    { name: "get-subscription-status", arguments: {} },
    apiKey
  );

  if (response.error) {
    throw new Error(`MCP error: ${response.error.message}`);
  }

  const text = response.result?.content?.[0]?.text;
  if (!text) {
    throw new Error("No response from get-subscription-status");
  }

  return JSON.parse(text);
}
