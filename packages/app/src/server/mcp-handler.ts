import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { resolveUser } from "./middleware/api-auth";
import { checkLimit, incrementUsage } from "./middleware/rate-limit";
import { createDb, schema } from "./db";
import { env } from "cloudflare:workers";
import { eq, and, like, or, isNull } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Audit methodology constants (extracted from SKILL.md)
// ---------------------------------------------------------------------------

const SYSTEM_RULESET_ID = "snitch-default-v1";

const ANTI_HALLUCINATION_RULES = `## ANTI-HALLUCINATION RULES (CRITICAL)

These rules prevent false claims. Violating them invalidates your audit.

### Rule 1: No Findings Without Evidence
- You MUST use your file-reading tools (Read, cat, etc.) or search tools (Grep, rg, etc.) before claiming ANY finding
- You MUST quote the EXACT code snippet from the file
- You MUST include file path AND line number
- If you cannot find evidence in the actual file, it is NOT a finding

### Rule 2: No Summary Claims
- NEVER say "I found X issues" without listing each one with evidence
- NEVER say "there may be issues with..." without showing the code
- Each finding must be individually proven with quoted code

### Rule 3: Verify Your Claims
- After every file read, verify the code matches what you are claiming
- If the code does not show the vulnerability, retract the claim
- Quote the vulnerable line directly with its line number

### Rule 4: Context Matters
- Read surrounding code before deciding if something is vulnerable
- A pattern in a test file is NOT the same as production code
- A pattern in a comment or string literal is NOT vulnerable code
- Check if there are mitigations nearby (validation, sanitization)

### Rule 5: Never Expose Secrets
- When quoting code containing secrets, ALWAYS replace the secret value with X's
- Example: \`sk_live_abc123xyz\` becomes \`sk_live_XXXXXXXXXXXX\`
- This applies to API keys, tokens, passwords, connection strings, and any sensitive values

### Rule 6: Redact Dangerous Patterns in ALL Output
- NEVER write literal dangerous pattern names anywhere in your output
- Instead, use generic descriptions like "uses dynamic code evaluation" or "shell command with user input"
- Reference findings by file path, line number, and describe the pattern type

### Rule 7: Never Auto-Fix — Report First, Fix Only on Explicit Request
- NEVER edit, patch, or modify any file during the scan or while generating the report
- Complete the FULL scan and report FIRST, then offer fix options
- Scanning and fixing are ALWAYS two separate phases — the scan phase is strictly read-only`;

const EXECUTION_FLOW = `## EXECUTION FLOW

For EACH security category in your scan:

1. **Search** — Use your search tools (Grep, rg, ripgrep, etc.) and file-finding tools (Glob, find, etc.) to locate relevant patterns described in the category guidance
2. **Read** — Use your file-reading tools (Read, cat, etc.) to see the actual code in context
3. **Analyze** — Apply the context rules to determine if the pattern represents a real vulnerability
4. **Report** — Only report findings with quoted evidence

Example finding format:
\`\`\`
## Finding: SQL Injection in User Query
- **File:** src/db/users.js:47
- **Code:** [quote the exact line, redact any secrets with X's]
- **Why it is vulnerable:** User input concatenated into SQL query
- **Fix:** Use parameterized query with placeholders
\`\`\``;

const REPORT_FORMAT = `## REPORT FORMAT

\`\`\`markdown
# Security Audit Report

## Summary
- **Overall Risk:** [Critical/High/Medium/Low]
- **Findings:** X Critical, X High, X Medium, X Low
- **Standards:** CWE Top 25 (2025), OWASP Top 10 (2025), CVSS 4.0

## Critical Findings

### 1. [Title]
- **Severity:** [Critical/High/Medium/Low] | CVSS 4.0: ~[score]
- **CWE:** CWE-[id] ([name])
- **OWASP:** A[nn]:2025 [category name]
- **File:** path/to/file.js:47
- **Evidence:** [exact code from file, secrets replaced with X's]
- **Risk:** [What could happen]
- **Fix:** [Specific remediation]

## Passed Checks
- [ ] Category X — no issues found
\`\`\`

Tag each finding with CWE, OWASP Top 10:2025 category, and approximate CVSS 4.0 score. Non-security categories (24-26) have no standards mapping.`;

const REMEMBER_RULES = `## REMEMBER

1. **No evidence = No finding.** Cannot show code? Do not report it.
2. **Context matters.** Test file is not production code.
3. **Check mitigations.** Look for validation nearby.
4. **Be specific.** File, line number, exact code.
5. **Quality over quantity.** 5 real findings beat 50 false positives.
6. **Detect before checking.** Confirm a service is used before auditing it.
7. **Server vs Client matters.** Secrets in server-only code are often fine.
8. **Redact all secrets.** Replace actual values with X's in all output.
9. **Stay in scope.** Only report on selected categories.
10. **Never auto-fix.** Scan phase is strictly read-only.
11. **Tag findings.** Include CWE, OWASP, and approximate CVSS.`;

/** Tier → accessible category numbers */
const TIER_CATEGORIES: Record<string, number[]> = {
  base: [1,2,3,4,5,7,8,9,10,11,12,17,27,28,29,30,31,32,33,39],
  pro: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,24,25,26,27,28,29,30,31,32,33,39,40,42,43,44,45],
  enterprise: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45],
};

/** Scan type → category number mappings */
const SCAN_TYPE_CATEGORIES: Record<string, number[]> = {
  quick: [1, 2, 3, 4], // base set; detect-stack adds more
  web: [1, 2, 5, 8, 10, 12],
  secrets: [3, 4, 7, 39],
  modern: [6, 11, 13, 14, 15, 16, 17, 18, 19, 39],
  compliance: [20, 21, 22, 23],
  performance: [24, 25, 26],
  infrastructure: [27, 28, 29, 30, 31, 32, 33, 40, 42, 43],
  governance: [34, 35, 36, 37, 38],
  "api-security": [44, 45],
  full: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45],
};

/** OWASP / CWE reference table for findings */
const STANDARDS_MAP: Record<number, { owasp: string; cwe: string }> = {
  1:  { owasp: "A05 Injection", cwe: "CWE-89" },
  2:  { owasp: "A05 Injection", cwe: "CWE-79" },
  3:  { owasp: "A07 Authentication Failures", cwe: "CWE-798" },
  4:  { owasp: "A07 Authentication Failures", cwe: "CWE-287" },
  5:  { owasp: "A10 Server-Side Request Forgery", cwe: "CWE-918" },
  6:  { owasp: "A01 Broken Access Control", cwe: "CWE-862" },
  7:  { owasp: "A04 Insecure Design", cwe: "CWE-770" },
  8:  { owasp: "A05 Injection", cwe: "CWE-346" },
  9:  { owasp: "A04 Cryptographic Failures", cwe: "CWE-327" },
  10: { owasp: "A05 Injection", cwe: "CWE-94" },
  11: { owasp: "A02 Security Misconfiguration", cwe: "CWE-16" },
  12: { owasp: "A09 Security Logging and Alerting Failures", cwe: "CWE-532" },
  13: { owasp: "A07 Authentication Failures", cwe: "CWE-798" },
  14: { owasp: "A07 Authentication Failures", cwe: "CWE-287" },
  15: { owasp: "A07 Authentication Failures", cwe: "CWE-798" },
  16: { owasp: "A07 Authentication Failures", cwe: "CWE-798" },
  17: { owasp: "A05 Injection", cwe: "CWE-89" },
  18: { owasp: "A04 Cryptographic Failures", cwe: "CWE-312" },
  19: { owasp: "A07 Authentication Failures", cwe: "CWE-798" },
  20: { owasp: "A02 Security Misconfiguration", cwe: "CWE-200" },
  21: { owasp: "A09 Security Logging and Alerting Failures", cwe: "CWE-778" },
  22: { owasp: "A04 Cryptographic Failures", cwe: "CWE-311" },
  23: { owasp: "A01 Broken Access Control", cwe: "CWE-359" },
  27: { owasp: "A03 Software Supply Chain Failures", cwe: "CWE-1395" },
  28: { owasp: "A01 Broken Access Control", cwe: "CWE-639" },
  29: { owasp: "A04 Insecure Design", cwe: "CWE-434" },
  30: { owasp: "A05 Injection", cwe: "CWE-20" },
  31: { owasp: "A02 Security Misconfiguration", cwe: "CWE-200" },
  32: { owasp: "A02 Security Misconfiguration", cwe: "CWE-693" },
  33: { owasp: "A03 Software Supply Chain Failures", cwe: "CWE-1104" },
  34: { owasp: "A04 Cryptographic Failures", cwe: "CWE-327" },
  35: { owasp: "A02 Security Misconfiguration", cwe: "CWE-693" },
  36: { owasp: "A02 Security Misconfiguration", cwe: "CWE-636" },
  37: { owasp: "A09 Security Logging and Alerting Failures", cwe: "CWE-778" },
  38: { owasp: "A01 Broken Access Control", cwe: "CWE-200" },
  39: { owasp: "A07 Authentication Failures", cwe: "CWE-613" },
  40: { owasp: "A02 Security Misconfiguration", cwe: "CWE-200" },
  41: { owasp: "A03 Software Supply Chain Failures", cwe: "CWE-1395" },
  42: { owasp: "A02 Security Misconfiguration", cwe: "CWE-250" },
  43: { owasp: "A02 Security Misconfiguration", cwe: "CWE-16" },
  44: { owasp: "A01 Broken Access Control", cwe: "CWE-862" },
  45: { owasp: "A08 Software and Data Integrity Failures", cwe: "CWE-506" },
};

/** Dependency name → categories to add (for smart detection) */
const DEPENDENCY_CATEGORY_MAP: Record<string, number[]> = {
  // Payment
  "stripe": [13],
  "@stripe/stripe-js": [13],
  // Supabase
  "@supabase/supabase-js": [6],
  "@supabase/ssr": [6],
  // AI
  "openai": [15],
  "@anthropic-ai/sdk": [15],
  "ai": [15],
  "@ai-sdk/openai": [15],
  "@langchain/core": [15],
  "langchain": [15],
  "@google/generative-ai": [15],
  "cohere-ai": [15],
  "@modelcontextprotocol/sdk": [15],
  "llamaindex": [15],
  // Email
  "resend": [16],
  "@sendgrid/mail": [16],
  "postmark": [16],
  // Redis
  "@upstash/redis": [18],
  "ioredis": [18],
  "redis": [18],
  // SMS
  "twilio": [19],
  // Auth providers
  "@clerk/nextjs": [14, 7, 39],
  "@auth0/nextjs-auth0": [14, 7, 39],
  "next-auth": [14, 7, 39],
  // Cloud
  "@aws-sdk/client-s3": [11],
  "@google-cloud/storage": [11],
  "@azure/storage-blob": [11],
  // Database
  "pg": [1, 17],
  "mysql2": [1, 17],
  "@prisma/client": [1, 17, 24, 25, 28],
  "drizzle-orm": [1, 17, 25, 28],
  "typeorm": [25],
  "sequelize": [25],
  "mongoose": [17, 24, 25],
  // HTTP clients → SSRF
  "axios": [5],
  "got": [5],
  "node-fetch": [5],
  // Auth/session
  "jsonwebtoken": [4, 7, 39],
  "jose": [39],
  "passport": [4, 7],
  "better-auth": [4, 7, 39],
  "express-session": [4, 7, 39],
  "@auth/core": [39],
  "iron-session": [39],
  "lucia": [39],
  // CORS
  "cors": [8],
  // Web frameworks
  "next": [2, 26, 30, 32],
  "express": [26, 28, 30, 32],
  "fastify": [26, 28, 30, 32],
  "koa": [30],
  "hono": [30],
  // File uploads
  "multer": [29],
  "formidable": [29],
  "busboy": [29],
  // Monitoring
  "@sentry/node": [37],
  "@datadog/datadog-api-client": [37],
  "newrelic": [37],
  "prom-client": [37],
  "dd-trace": [37],
  // Resilience
  "opossum": [36],
  "cockatiel": [36],
  // Container/Docker
  "dockerode": [42],
  // IaC
  "@pulumi/pulumi": [43],
  "@pulumi/aws": [43],
  "cdktf": [43],
  // API
  "swagger-jsdoc": [44],
  "swagger-ui-express": [44],
  "@nestjs/swagger": [44],
  "express-openapi-validator": [44],
  "graphql": [44],
  "apollo-server": [44],
  "@apollo/server": [44],
  // AI Tool Supply Chain
  "@anthropic-ai/claude-code": [45],
};

function corsOrigin(request: Request): string {
  const origin = request.headers.get("Origin") || "";
  const allowed = ["https://snitch.live", "https://mcp.snitch.live"];
  return allowed.includes(origin) ? origin : allowed[0];
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function getUserTier(userId: string): Promise<string> {
  try {
    const db = createDb((env as any).DB);
    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    return userRecord?.subscriptionTier ?? "free";
  } catch {
    return "free";
  }
}

/**
 * Handle all requests to mcp.snitch.live
 */
export async function handleMcpRequest(
  request: Request,
  envObj: any,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": corsOrigin(request),
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin",
      },
    });
  }

  // Health check
  if (path === "/" || path === "/health") {
    return jsonResponse({
      service: "snitch-mcp",
      status: "ok",
      version: "1.0.0",
    });
  }

  // SSE endpoint for MCP
  if (path === "/sse" && request.method === "GET") {
    return handleSSE(request, ctx);
  }

  // Message endpoint for MCP
  if (path === "/message" && request.method === "POST") {
    return handleMessage(request);
  }

  // JSON-RPC endpoint (Streamable HTTP transport)
  if (path === "/mcp" && request.method === "POST") {
    return handleStreamableHttp(request);
  }

  return jsonResponse({ error: "Not found" }, 404);
}

/**
 * Streamable HTTP transport — single POST endpoint for JSON-RPC
 */
async function handleStreamableHttp(request: Request): Promise<Response> {
  const user = await resolveUser(request);
  if (!user) {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Unauthorized. Provide a Bearer token or pair your device at snitch.live/pair" },
        id: null,
      },
      401
    );
  }

  const tier = await getUserTier(user.userId);
  const limitCheck = await checkLimit(user.userId, "mcp_calls", tier);
  if (!limitCheck.allowed) {
    return jsonResponse(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: `Rate limit exceeded (${limitCheck.current}/${limitCheck.limit} calls this month). Upgrade at snitch.live`,
        },
        id: null,
      },
      429
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error: invalid JSON" }, id: null },
      400
    );
  }
  const result = await processJsonRpc(body, user.userId);
  await incrementUsage(user.userId, "mcp_calls");

  return jsonResponse(result);
}

/**
 * SSE transport — establish connection
 */
async function handleSSE(
  request: Request,
  ctx: ExecutionContext
): Promise<Response> {
  const user = await resolveUser(request);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection event
  const sessionId = crypto.randomUUID();
  ctx.waitUntil(
    (async () => {
      await writer.write(
        encoder.encode(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`)
      );
      // Keep connection alive with periodic pings
      const interval = setInterval(async () => {
        try {
          await writer.write(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 30000);
    })()
  );

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": corsOrigin(request),
      "Vary": "Origin",
    },
  });
}

/**
 * Handle SSE message posts
 */
async function handleMessage(request: Request): Promise<Response> {
  const user = await resolveUser(request);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const tier = await getUserTier(user.userId);
  const limitCheck = await checkLimit(user.userId, "mcp_calls", tier);
  if (!limitCheck.allowed) {
    return jsonResponse({ error: "Rate limit exceeded" }, 429);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  const result = await processJsonRpc(body, user.userId);
  await incrementUsage(user.userId, "mcp_calls");

  return jsonResponse(result);
}

/**
 * Process a JSON-RPC request and route to the appropriate tool
 */
async function processJsonRpc(body: any, userId: string): Promise<any> {
  const { method, params, id } = body;

  // MCP protocol methods
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "snitch-mcp", version: "1.0.0" },
      },
      id,
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      result: { tools: getToolDefinitions() },
      id,
    };
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = params?.arguments ?? {};

    try {
      const result = await executeTool(toolName, toolArgs, userId);
      await incrementUsage(userId, `mcp_${toolName.replace(/-/g, "_")}`);
      return { jsonrpc: "2.0", result, id };
    } catch (e: any) {
      return {
        jsonrpc: "2.0",
        error: { code: -32000, message: e.message },
        id,
      };
    }
  }

  if (method === "notifications/initialized" || method === "ping") {
    return { jsonrpc: "2.0", result: {}, id };
  }

  return {
    jsonrpc: "2.0",
    error: { code: -32601, message: `Method not found: ${method}` },
    id,
  };
}

function getToolDefinitions() {
  return [
    {
      name: "get-rules",
      description: "Retrieve security rules with optional filters",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Filter rules by project ID" },
          language: { type: "string", description: "Filter by language" },
          framework: { type: "string", description: "Filter by framework" },
          filePattern: { type: "string", description: "Filter by file pattern" },
          query: { type: "string", description: "Search query" },
        },
      },
    },
    {
      name: "search-rules",
      description: "Semantic search for security rules",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          topK: { type: "number", description: "Max results" },
        },
        required: ["query"],
      },
    },
    {
      name: "check-pattern",
      description: "Check code for security patterns",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Code snippet to check" },
          language: { type: "string", description: "Programming language" },
          filePath: { type: "string", description: "File path for context" },
        },
        required: ["code"],
      },
    },
    {
      name: "add-memory",
      description: "Store a project memory",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
          content: { type: "string", description: "Memory content" },
          context: { type: "string", description: "Optional context" },
        },
        required: ["projectId", "content"],
      },
    },
    {
      name: "get-memories",
      description: "Retrieve project memories",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "Project ID" },
          query: { type: "string", description: "Optional search query" },
        },
        required: ["projectId"],
      },
    },
    {
      name: "start-audit",
      description:
        "Start a security audit. Returns the full audit methodology — anti-hallucination rules, execution flow, report format, and category guidance — so you can perform an intelligent, evidence-based security scan using YOUR OWN tools (Grep, Read, Glob, etc.). The MCP instructs; you execute.",
      inputSchema: {
        type: "object",
        properties: {
          scanType: {
            type: "string",
            enum: ["quick", "web", "secrets", "modern", "compliance", "performance", "infrastructure", "governance", "full", "custom"],
            description: "Scan preset. 'quick' auto-detects relevant categories from your tech stack. 'custom' requires the categories array.",
          },
          categories: {
            type: "array",
            items: { type: "number" },
            description: "Category numbers to scan (1-45). Required when scanType is 'custom'. Optional for other types to add extras.",
          },
          scope: {
            type: "string",
            enum: ["all", "diff"],
            description: "Scan scope. 'all' scans the entire codebase (default). 'diff' restricts to files changed since last commit.",
          },
        },
        required: ["scanType"],
      },
    },
    {
      name: "detect-stack",
      description:
        "Detect tech stack from a package.json (or equivalent) and return recommended security audit categories. Mirrors the Quick Scan smart detection logic.",
      inputSchema: {
        type: "object",
        properties: {
          packageJson: {
            type: "string",
            description: "Stringified package.json content (or equivalent manifest).",
          },
        },
        required: ["packageJson"],
      },
    },
    {
      name: "get-category",
      description:
        "Get the full audit methodology for a single security category. Returns detection guidance, search patterns, context checks, and what files to examine.",
      inputSchema: {
        type: "object",
        properties: {
          categoryNumber: {
            type: "number",
            description: "Category number (1-45).",
          },
          categoryName: {
            type: "string",
            description: "Category name (e.g. 'SQL Injection', 'XSS'). Used if categoryNumber is not provided.",
          },
        },
      },
    },
    {
      name: "get-subscription-status",
      description:
        "Get the current user's subscription tier, accessible categories, and feature availability.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ];
}

/**
 * Execute a tool and return the MCP result
 */
async function executeTool(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<any> {
  const db = createDb((env as any).DB);

  switch (name) {
    case "get-rules": {
      let query = db.select().from(schema.rules).$dynamic();
      const conditions: any[] = [];

      if (args.language) {
        conditions.push(eq(schema.rules.language, args.language));
      }
      if (args.framework) {
        conditions.push(eq(schema.rules.framework, args.framework));
      }

      // Get rules from user's rulesets + public/system rulesets
      const userRulesets = await db
        .select({ id: schema.rulesets.id })
        .from(schema.rulesets)
        .where(
          or(
            eq(schema.rulesets.ownerId, userId),
            eq(schema.rulesets.isPublic, 1)
          )
        );

      const rulesetIds = userRulesets.map((r) => r.id);
      if (rulesetIds.length === 0) {
        return {
          content: [{ type: "text", text: "No rulesets found. Create rulesets at snitch.live/dashboard/rulesets" }],
        };
      }

      const allRules = [];
      for (const rulesetId of rulesetIds) {
        const rules = await db
          .select()
          .from(schema.rules)
          .where(eq(schema.rules.rulesetId, rulesetId));
        allRules.push(...rules);
      }

      // Apply filters
      let filtered = allRules;
      if (args.language) {
        filtered = filtered.filter((r) => r.language === args.language);
      }
      if (args.framework) {
        filtered = filtered.filter((r) => r.framework === args.framework);
      }
      if (args.query) {
        const q = args.query.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
      }

      if (filtered.length === 0) {
        return {
          content: [{ type: "text", text: "No rules found matching the given criteria." }],
        };
      }

      const text = filtered
        .map(
          (r) =>
            `## ${r.title}\n**Severity**: ${r.severity}\n**Language**: ${r.language ?? "any"}\n${r.description ?? ""}\n${r.pattern ? `**Pattern**: \`${r.pattern}\`` : ""}`
        )
        .join("\n\n---\n\n");

      return { content: [{ type: "text", text }] };
    }

    case "search-rules": {
      const tier = await getUserTier(userId);
      if (tier !== "pro" && tier !== "enterprise") {
        return {
          content: [{ type: "text", text: "Error: search-rules requires Pro or Enterprise tier. Upgrade at snitch.live/dashboard/billing" }],
        };
      }

      // Use vector search if available, fall back to text search
      try {
        const vectorize = (env as any).VECTORIZE;
        const ai = (env as any).AI;

        if (vectorize && ai) {
          const embeddingResult = await ai.run("@cf/baai/bge-base-en-v1.5", {
            text: [args.query],
          });

          const queryResult = await vectorize.query(embeddingResult.data[0], {
            topK: args.topK ?? 10,
            filter: { ownerId: userId },
          });

          if (queryResult.matches?.length > 0) {
            const ruleIds = queryResult.matches.map((m: any) => m.id);
            const rules = [];
            for (const ruleId of ruleIds) {
              const [rule] = await db
                .select()
                .from(schema.rules)
                .where(eq(schema.rules.id, ruleId))
                .limit(1);
              if (rule) rules.push(rule);
            }

            const text = rules
              .map(
                (r) =>
                  `## ${r.title}\n**Severity**: ${r.severity}\n${r.description ?? ""}`
              )
              .join("\n\n---\n\n");

            return { content: [{ type: "text", text }] };
          }
        }
      } catch {
        // Fall through to text search
      }

      // Text search fallback
      const userRulesets = await db
        .select({ id: schema.rulesets.id })
        .from(schema.rulesets)
        .where(
          or(
            eq(schema.rulesets.ownerId, userId),
            eq(schema.rulesets.isPublic, 1)
          )
        );

      const allRules = [];
      for (const rs of userRulesets) {
        const rules = await db
          .select()
          .from(schema.rules)
          .where(eq(schema.rules.rulesetId, rs.id));
        allRules.push(...rules);
      }

      const q = args.query.toLowerCase();
      const matched = allRules
        .filter(
          (r) =>
            r.title?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        )
        .slice(0, args.topK ?? 10);

      if (matched.length === 0) {
        return {
          content: [{ type: "text", text: `No rules found matching "${args.query}".` }],
        };
      }

      const text = matched
        .map(
          (r) =>
            `## ${r.title}\n**Severity**: ${r.severity}\n${r.description ?? ""}`
        )
        .join("\n\n---\n\n");

      return { content: [{ type: "text", text }] };
    }

    case "check-pattern": {
      // Get all user's rules + system rules and match patterns against code
      const userRulesets = await db
        .select({ id: schema.rulesets.id })
        .from(schema.rulesets)
        .where(
          or(
            eq(schema.rulesets.ownerId, userId),
            eq(schema.rulesets.isPublic, 1)
          )
        );

      const allRules = [];
      for (const rs of userRulesets) {
        const rules = await db
          .select()
          .from(schema.rules)
          .where(eq(schema.rules.rulesetId, rs.id));
        allRules.push(...rules);
      }

      // Filter by language if provided
      let applicable = allRules;
      if (args.language) {
        applicable = applicable.filter(
          (r) => !r.language || r.language === args.language
        );
      }

      const matches: string[] = [];
      const lines = args.code.split("\n");
      let totalMatches = 0;

      for (const rule of applicable) {
        if (!rule.pattern || rule.pattern.length > 500) continue;
        if (totalMatches > 100) break;
        try {
          const regex = new RegExp(rule.pattern, "gm");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 2000) continue;
            if (regex.test(lines[i])) {
              matches.push(
                `**${rule.title}** (${rule.severity})\n  Line ${i + 1}: pattern match\n  ${rule.description ?? ""}`
              );
              if (++totalMatches > 100) break;
              regex.lastIndex = 0;
            }
          }
        } catch {
          // Invalid regex, skip
        }
      }

      if (matches.length === 0) {
        return {
          content: [{ type: "text", text: "No security patterns matched in the provided code." }],
        };
      }

      return {
        content: [{ type: "text", text: matches.join("\n\n") }],
      };
    }

    case "add-memory": {
      // Verify project ownership
      const [project] = await db
        .select({ ownerId: schema.projects.ownerId })
        .from(schema.projects)
        .where(eq(schema.projects.id, args.projectId))
        .limit(1);
      if (!project || project.ownerId !== userId) {
        return {
          content: [{ type: "text", text: "Error: Project not found or access denied." }],
        };
      }

      const memory = await db
        .insert(schema.memories)
        .values({
          id: crypto.randomUUID(),
          projectId: args.projectId,
          content: args.content,
          context: args.context,
          createdAt: new Date().toISOString(),
        })
        .returning();

      return {
        content: [{ type: "text", text: `Memory saved (id: ${memory[0].id}).` }],
      };
    }

    case "get-memories": {
      // Verify project ownership
      const [memProject] = await db
        .select({ ownerId: schema.projects.ownerId })
        .from(schema.projects)
        .where(eq(schema.projects.id, args.projectId))
        .limit(1);
      if (!memProject || memProject.ownerId !== userId) {
        return {
          content: [{ type: "text", text: "Error: Project not found or access denied." }],
        };
      }

      let mems = await db
        .select()
        .from(schema.memories)
        .where(eq(schema.memories.projectId, args.projectId));

      if (args.query) {
        const q = args.query.toLowerCase();
        mems = mems.filter(
          (m) =>
            m.content.toLowerCase().includes(q) ||
            m.context?.toLowerCase().includes(q)
        );
      }

      if (mems.length === 0) {
        return {
          content: [{ type: "text", text: `No memories found for project "${args.projectId}".` }],
        };
      }

      const text = mems
        .map(
          (m) =>
            `**Memory** (${m.id})\n${m.context ? `Context: ${m.context}\n` : ""}${m.content}`
        )
        .join("\n\n---\n\n");

      return { content: [{ type: "text", text }] };
    }

    // -----------------------------------------------------------------
    // New methodology tools
    // -----------------------------------------------------------------

    case "start-audit": {
      const tier = await getUserTier(userId);
      if (tier === "free") {
        return {
          content: [{ type: "text", text: "Error: start-audit requires an active subscription (Base, Pro, or Enterprise). Upgrade at snitch.live/dashboard/billing" }],
        };
      }

      const scanType: string = args.scanType ?? "quick";
      const extraCategories: number[] = args.categories ?? [];
      const scope: string = args.scope ?? "all";

      // Resolve category set
      let categoryNumbers: number[];
      if (scanType === "custom") {
        if (extraCategories.length === 0) {
          return {
            content: [{ type: "text", text: "Error: scanType 'custom' requires a non-empty 'categories' array." }],
          };
        }
        categoryNumbers = Array.from(new Set(extraCategories)).sort((a, b) => a - b);
      } else {
        const base = SCAN_TYPE_CATEGORIES[scanType] ?? SCAN_TYPE_CATEGORIES.full;
        categoryNumbers = Array.from(new Set([...base, ...extraCategories])).sort((a, b) => a - b);
      }

      // Filter to only categories accessible by user's tier
      const allowedCategories = TIER_CATEGORIES[tier] ?? TIER_CATEGORIES.base;
      const blocked = categoryNumbers.filter((n) => !allowedCategories.includes(n));
      categoryNumbers = categoryNumbers.filter((n) => allowedCategories.includes(n));

      if (categoryNumbers.length === 0) {
        return {
          content: [{ type: "text", text: "Error: None of the requested categories are available on your tier. Upgrade at snitch.live/dashboard/billing" }],
        };
      }

      // Fetch category guidance from DB (system ruleset)
      const categoryRules = await fetchCategoryRules(db, categoryNumbers);

      // Build the standards reference for selected categories
      const standardsRef = categoryNumbers
        .filter((n) => STANDARDS_MAP[n])
        .map((n) => {
          const s = STANDARDS_MAP[n];
          const rule = categoryRules.find((r) => r.id === `snitch-cat-${String(n).padStart(2, "0")}`);
          return `| ${n} | ${rule?.title ?? `Category ${n}`} | ${s.owasp} | ${s.cwe} |`;
        })
        .join("\n");

      // Build category guidance section
      const categoryGuidance = categoryRules.map((r) => {
        // The description field contains the full category .md content
        return r.description ?? `## ${r.title}\nNo detailed guidance available.`;
      }).join("\n\n---\n\n");

      // Scope instructions
      const scopeInstructions = scope === "diff"
        ? `\n## SCOPE\nScan ONLY files changed since the last commit. Run \`git diff HEAD --name-only\` first to get the file list, then restrict all searches to those files.\n`
        : `\n## SCOPE\nScan the entire codebase.\n`;

      // Quick scan hint
      const quickScanHint = scanType === "quick"
        ? `\n## QUICK SCAN NOTE\nYou are running a Quick Scan. Before scanning, read the project's \`package.json\` (or equivalent manifest) and call the \`detect-stack\` tool with its contents. This will return additional recommended categories based on the detected tech stack. Add those categories to your scan.\n`
        : "";

      // Assemble the full methodology prompt
      const methodology = `# Snitch Security Audit — Methodology

You are a security expert performing a comprehensive security audit. The Snitch MCP server is providing you with the audit methodology and category guidance. **You** perform the actual scanning using YOUR tools (Grep, Read, Glob, file search, etc.).

---

${ANTI_HALLUCINATION_RULES}

---

${EXECUTION_FLOW}

For suspicious code snippets, you may also call the \`check-pattern\` MCP tool to match against Snitch's pattern database for additional signal.

---
${scopeInstructions}
${quickScanHint}
## STANDARDS REFERENCE

| Cat | Name | OWASP Top 10:2025 | Primary CWE |
|-----|------|--------------------|-------------|
${standardsRef}

### CVSS 4.0 Severity Alignment

| Severity | CVSS 4.0 Range | Example |
|----------|---------------|---------|
| Critical | 9.0 – 10.0 | RCE, auth bypass, mass data leak |
| High | 7.0 – 8.9 | SQLi, stored XSS, SSRF to internal |
| Medium | 4.0 – 6.9 | Reflected XSS, CORS miscfg, missing headers |
| Low | 0.1 – 3.9 | Info disclosure, verbose errors |

---

${REPORT_FORMAT}

---

${REMEMBER_RULES}

---

## CATEGORY GUIDANCE

The following ${categoryRules.length} categories are included in this ${scanType} scan. For each one, follow its Detection, Search, Context, and Files to Check sections.

---

${categoryGuidance}

---

*Powered by Snitch MCP — ${categoryRules.length} categories loaded*${blocked.length > 0 ? `\n\n> Note: Categories ${blocked.join(", ")} were excluded — they require a higher tier. Upgrade at snitch.live/dashboard/billing` : ""}`;

      return {
        content: [{ type: "text", text: methodology }],
      };
    }

    case "detect-stack": {
      const tier = await getUserTier(userId);
      if (tier === "free") {
        return {
          content: [{ type: "text", text: "Error: detect-stack requires an active subscription. Upgrade at snitch.live/dashboard/billing" }],
        };
      }

      let pkg: any;
      try {
        pkg = JSON.parse(args.packageJson);
      } catch {
        return {
          content: [{ type: "text", text: "Error: Could not parse packageJson. Provide valid JSON." }],
        };
      }

      const allDeps: Record<string, string> = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
      };
      const depNames = Object.keys(allDeps);

      // Always-include categories
      const detected = new Set<number>([1, 2, 3, 4, 12, 27, 33]);
      const detectedStack: string[] = [];

      // Match dependencies against the mapping
      for (const dep of depNames) {
        // Exact match
        if (DEPENDENCY_CATEGORY_MAP[dep]) {
          for (const cat of DEPENDENCY_CATEGORY_MAP[dep]) {
            detected.add(cat);
          }
        }
        // Prefix match for scoped packages like @aws-sdk/*
        if (dep.startsWith("@aws-sdk/")) { detected.add(11); detectedStack.push("AWS SDK"); }
        if (dep.startsWith("@google-cloud/")) { detected.add(11); detectedStack.push("Google Cloud"); }
        if (dep.startsWith("@azure/")) { detected.add(11); detectedStack.push("Azure"); }
        if (dep.startsWith("@uploadthing/")) { detected.add(29); }
        if (dep.startsWith("@opentelemetry/")) { detected.add(37); }
        if (dep.startsWith("@grafana/")) { detected.add(37); }
      }

      // Build human-readable stack labels
      if (depNames.includes("next")) detectedStack.push("Next.js");
      if (depNames.includes("express")) detectedStack.push("Express");
      if (depNames.includes("fastify")) detectedStack.push("Fastify");
      if (depNames.includes("@prisma/client")) detectedStack.push("Prisma");
      if (depNames.includes("drizzle-orm")) detectedStack.push("Drizzle");
      if (depNames.includes("stripe") || depNames.includes("@stripe/stripe-js")) detectedStack.push("Stripe");
      if (depNames.includes("@supabase/supabase-js")) detectedStack.push("Supabase");
      if (depNames.includes("openai") || depNames.includes("@anthropic-ai/sdk") || depNames.includes("ai")) detectedStack.push("AI/LLM");
      if (depNames.includes("@clerk/nextjs")) detectedStack.push("Clerk");
      if (depNames.includes("next-auth") || depNames.includes("@auth0/nextjs-auth0")) detectedStack.push("Auth Provider");
      if (depNames.includes("twilio")) detectedStack.push("Twilio");
      if (depNames.includes("resend") || depNames.includes("@sendgrid/mail")) detectedStack.push("Email Service");

      // Keyword detection in package name/description
      const pkgText = `${pkg.name ?? ""} ${pkg.description ?? ""}`.toLowerCase();
      if (/patient|medical|diagnosis|prescription|phi/.test(pkgText)) detected.add(20);
      if (/audit|compliance|mfa/.test(pkgText)) detected.add(21);
      if (/card|payment|cvv|pan/.test(pkgText)) detected.add(22);
      if (/consent|gdpr|data.export|data.delete/.test(pkgText)) detected.add(23);
      if (/fips|nist|cipher/.test(pkgText)) detected.add(34);
      if (/iso27001|fedramp|cmmc|govcloud/.test(pkgText)) detected.add(35);

      let categoryNumbers = Array.from(detected).sort((a, b) => a - b);

      // Filter to user's tier
      const allowedCats = TIER_CATEGORIES[tier] ?? TIER_CATEGORIES.base;
      const blockedCats = categoryNumbers.filter((n) => !allowedCats.includes(n));
      categoryNumbers = categoryNumbers.filter((n) => allowedCats.includes(n));

      // Fetch category names from DB
      const categoryRules = await fetchCategoryRules(db, categoryNumbers);
      const categoryNames = categoryRules.map((r) => `${r.id.replace("snitch-cat-", "Cat ")}: ${r.title}`);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            detectedStack: Array.from(new Set(detectedStack)),
            recommendedCategories: categoryNumbers,
            categoryNames,
            totalCategories: categoryNumbers.length,
            blockedByTier: blockedCats.length > 0 ? blockedCats : undefined,
            hint: "Pass these categories to start-audit with scanType 'custom', or use scanType 'quick' which will auto-include them.",
          }, null, 2),
        }],
      };
    }

    case "get-category": {
      const tier = await getUserTier(userId);
      if (tier === "free") {
        return {
          content: [{ type: "text", text: "Error: get-category requires an active subscription. Upgrade at snitch.live/dashboard/billing" }],
        };
      }

      const catNum: number | undefined = args.categoryNumber;
      const catName: string | undefined = args.categoryName;

      if (!catNum && !catName) {
        return {
          content: [{ type: "text", text: "Error: Provide either categoryNumber or categoryName." }],
        };
      }

      // Check tier access for numbered categories
      if (catNum) {
        const allowedCats = TIER_CATEGORIES[tier] ?? TIER_CATEGORIES.base;
        if (!allowedCats.includes(catNum)) {
          const requiredTier = TIER_CATEGORIES.enterprise.includes(catNum)
            ? (TIER_CATEGORIES.pro.includes(catNum) ? "Pro" : "Enterprise")
            : "Base";
          return {
            content: [{ type: "text", text: `Category ${catNum} requires ${requiredTier} tier or above. Upgrade at snitch.live/dashboard/billing` }],
          };
        }
      }

      // Fetch from system ruleset
      const systemRules = await db
        .select()
        .from(schema.rules)
        .where(eq(schema.rules.rulesetId, SYSTEM_RULESET_ID));

      let rule;
      if (catNum) {
        const targetId = `snitch-cat-${String(catNum).padStart(2, "0")}`;
        rule = systemRules.find((r) => r.id === targetId);
      } else if (catName) {
        const q = catName.toLowerCase();
        rule = systemRules.find((r) => r.title?.toLowerCase().includes(q));
      }

      if (!rule) {
        return {
          content: [{ type: "text", text: `Category not found. Available categories: 1-45. Use get-rules to browse.` }],
        };
      }

      // Enforce tier check for name-based lookups too
      if (!catNum && rule.id.startsWith("snitch-cat-")) {
        const resolvedNum = parseInt(rule.id.replace("snitch-cat-", ""), 10);
        if (!isNaN(resolvedNum)) {
          const allowedCats = TIER_CATEGORIES[tier] ?? TIER_CATEGORIES.base;
          if (!allowedCats.includes(resolvedNum)) {
            const requiredTier = TIER_CATEGORIES.enterprise.includes(resolvedNum)
              ? (TIER_CATEGORIES.pro.includes(resolvedNum) ? "Pro" : "Enterprise")
              : "Base";
            return {
              content: [{ type: "text", text: `Category ${resolvedNum} requires ${requiredTier} tier or above. Upgrade at snitch.live/dashboard/billing` }],
            };
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `# ${rule.title}\n**Severity:** ${rule.severity}\n\n${rule.description ?? "No detailed guidance available."}`,
        }],
      };
    }

    case "get-subscription-status": {
      const tier = await getUserTier(userId);
      const allowedCats = tier === "free" ? [] : (TIER_CATEGORIES[tier] ?? []);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            tier,
            categories: allowedCats,
            totalCategories: allowedCats.length,
            features: {
              startAudit: tier !== "free",
              getCategory: tier !== "free",
              detectStack: tier !== "free",
              searchRules: tier === "pro" || tier === "enterprise",
              checkPattern: true,
              getRules: true,
              addMemory: true,
              getMemories: true,
            },
          }, null, 2),
        }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Fetch category rules from the system ruleset by category numbers
 */
async function fetchCategoryRules(
  db: ReturnType<typeof createDb>,
  categoryNumbers: number[]
): Promise<Array<{ id: string; title: string | null; severity: string | null; description: string | null }>> {
  const allSystemRules = await db
    .select({
      id: schema.rules.id,
      title: schema.rules.title,
      severity: schema.rules.severity,
      description: schema.rules.description,
    })
    .from(schema.rules)
    .where(eq(schema.rules.rulesetId, SYSTEM_RULESET_ID));

  const targetIds = new Set(
    categoryNumbers.map((n) => `snitch-cat-${String(n).padStart(2, "0")}`)
  );

  return allSystemRules
    .filter((r) => targetIds.has(r.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}
