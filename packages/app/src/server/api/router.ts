import { resolveUser } from "../middleware/api-auth";
import { handleAuth } from "./auth";
import {
  handleListRulesets,
  handleGetRuleset,
  handleCreateRuleset,
  handleUpdateRuleset,
  handleDeleteRuleset,
} from "./rulesets";
import {
  handleListRules,
  handleGetRule,
  handleCreateRule,
  handleUpdateRule,
  handleDeleteRule,
} from "./rules";
import {
  handleListProjects,
  handleGetProject,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  handleLinkRuleset,
  handleUnlinkRuleset,
} from "./projects";
import { handleCreateMemory, handleListMemories } from "./memories";
import { handleSearch } from "./search";
import { handleCheckPattern } from "./check-pattern";
import { handleListKeys, handleCreateToken, handleDeleteKey, handleListSessions, handleDeleteSession } from "./keys";
import {
  handleCreateCheckout,
  handleCreatePortal,
  handleWebhook,
} from "./stripe";
import { handleSkillDownload, handleSkillVersion } from "./skill";
import { handleSkillCheckout } from "./skill-checkout";
import {
  handleDeviceCodeRequest,
  handleDeviceTokenPoll,
  handleDevicePair,
} from "./device-auth";
import { handleGetUsage } from "./usage";
import { handleCreateScan, handleListScans, handleGetScan } from "./scan-history";
import {
  handleCreateOrUpdateIntegration,
  handleListIntegrations,
  handleDeleteIntegration,
} from "./integrations";
import { handleHeartbeat, handleSubscriptionStatus } from "./license";

const JSON_HEADERS = { "Content-Type": "application/json" };

function notFound(): Response {
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: JSON_HEADERS,
  });
}

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: JSON_HEADERS,
  });
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: JSON_HEADERS,
  });
}

interface RouteMatch {
  params: Record<string, string>;
}

function matchPath(
  pattern: string,
  path: string
): RouteMatch | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = pathParts[i];
    } else if (pp !== pathParts[i]) {
      return null;
    }
  }

  return { params };
}

export async function handleApiRequest(
  request: Request
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Device authorization flow (no auth required) — must be before Better Auth catch-all
  if (path === "/api/auth/device" && method === "POST") {
    return handleDeviceCodeRequest(request);
  }
  if (path === "/api/auth/device/token" && method === "POST") {
    return handleDeviceTokenPoll(request);
  }

  // Device pairing (requires auth — must be before Better Auth catch-all)
  if (path === "/api/auth/device/pair" && method === "POST") {
    const pairUser = await resolveUser(request);
    if (!pairUser) return unauthorized();
    return handleDevicePair(request, pairUser.userId);
  }

  // Auth routes - no auth required (Better Auth catch-all)
  if (path.startsWith("/api/auth/")) {
    return handleAuth(request);
  }

  // Stripe webhook - special auth (signature verification, not user auth)
  if (path === "/api/stripe/webhook" && method === "POST") {
    return handleWebhook(request);
  }

  // Public endpoints (no auth required)
  if (path === "/api/skill/version" && method === "GET") {
    return handleSkillVersion();
  }

  // License heartbeat (desktop app, uses Bearer token auth internally)
  if (path === "/api/license/heartbeat" && method === "POST") {
    return handleHeartbeat(request);
  }

  // Subscription status (MCP server, uses Bearer token auth internally)
  if (path === "/api/subscription/status" && method === "GET") {
    return handleSubscriptionStatus(request);
  }

  // All other routes need auth
  const user = await resolveUser(request);
  if (!user) return unauthorized();

  const { userId } = user;

  // --- Rulesets ---
  let match: RouteMatch | null;

  // GET/POST /api/rulesets
  if ((match = matchPath("/api/rulesets", path))) {
    if (method === "GET") return handleListRulesets(request, userId);
    if (method === "POST") return handleCreateRuleset(request, userId);
    return methodNotAllowed();
  }

  // GET/PUT/DELETE /api/rulesets/:id
  if ((match = matchPath("/api/rulesets/:id", path))) {
    if (method === "GET")
      return handleGetRuleset(request, userId, match.params.id);
    if (method === "PUT")
      return handleUpdateRuleset(request, userId, match.params.id);
    if (method === "DELETE")
      return handleDeleteRuleset(request, userId, match.params.id);
    return methodNotAllowed();
  }

  // GET/POST /api/rulesets/:rulesetId/rules
  if ((match = matchPath("/api/rulesets/:rulesetId/rules", path))) {
    if (method === "GET")
      return handleListRules(request, userId, match.params.rulesetId);
    if (method === "POST")
      return handleCreateRule(request, userId, match.params.rulesetId);
    return methodNotAllowed();
  }

  // GET/PUT/DELETE /api/rules/:id
  if ((match = matchPath("/api/rules/:id", path))) {
    if (method === "GET") return handleGetRule(request, userId, match.params.id);
    if (method === "PUT")
      return handleUpdateRule(request, userId, match.params.id);
    if (method === "DELETE")
      return handleDeleteRule(request, userId, match.params.id);
    return methodNotAllowed();
  }

  // --- Projects ---

  // GET/POST /api/projects
  if ((match = matchPath("/api/projects", path))) {
    if (method === "GET") return handleListProjects(request, userId);
    if (method === "POST") return handleCreateProject(request, userId);
    return methodNotAllowed();
  }

  // GET/PUT/DELETE /api/projects/:id
  if ((match = matchPath("/api/projects/:id", path))) {
    if (method === "GET")
      return handleGetProject(request, userId, match.params.id);
    if (method === "PUT")
      return handleUpdateProject(request, userId, match.params.id);
    if (method === "DELETE")
      return handleDeleteProject(request, userId, match.params.id);
    return methodNotAllowed();
  }

  // POST /api/projects/:projectId/rulesets (link ruleset)
  if ((match = matchPath("/api/projects/:projectId/rulesets", path))) {
    if (method === "POST")
      return handleLinkRuleset(request, userId, match.params.projectId);
    return methodNotAllowed();
  }

  // DELETE /api/projects/:projectId/rulesets/:rulesetId (unlink ruleset)
  if (
    (match = matchPath(
      "/api/projects/:projectId/rulesets/:rulesetId",
      path
    ))
  ) {
    if (method === "DELETE")
      return handleUnlinkRuleset(
        request,
        userId,
        match.params.projectId,
        match.params.rulesetId
      );
    return methodNotAllowed();
  }

  // --- Memories ---

  // GET/POST /api/memories
  if ((match = matchPath("/api/memories", path))) {
    if (method === "GET") return handleListMemories(request, userId);
    if (method === "POST") return handleCreateMemory(request, userId);
    return methodNotAllowed();
  }

  // --- Search ---

  // GET /api/search
  if ((match = matchPath("/api/search", path))) {
    if (method === "GET") return handleSearch(request, userId);
    return methodNotAllowed();
  }

  // --- Check Pattern ---

  // POST /api/check-pattern
  if ((match = matchPath("/api/check-pattern", path))) {
    if (method === "POST") return handleCheckPattern(request, userId);
    return methodNotAllowed();
  }

  // --- API Keys ---

  // GET/POST /api/keys (list devices / create MCP token)
  if ((match = matchPath("/api/keys", path))) {
    if (method === "GET") return handleListKeys(request, userId);
    if (method === "POST") return handleCreateToken(request, userId);
    return methodNotAllowed();
  }

  // DELETE /api/keys/:id (remove device)
  if ((match = matchPath("/api/keys/:id", path))) {
    if (method === "DELETE")
      return handleDeleteKey(request, userId, match.params.id);
    return methodNotAllowed();
  }

  // GET /api/sessions (active sessions)
  if ((match = matchPath("/api/sessions", path))) {
    if (method === "GET") return handleListSessions(request, userId);
    return methodNotAllowed();
  }

  // DELETE /api/sessions/:id (revoke session)
  if ((match = matchPath("/api/sessions/:id", path))) {
    if (method === "DELETE")
      return handleDeleteSession(request, userId, match.params.id);
    return methodNotAllowed();
  }

  // --- Usage ---

  // GET /api/usage
  if ((match = matchPath("/api/usage", path))) {
    if (method === "GET") return handleGetUsage(request, userId);
    return methodNotAllowed();
  }

  // --- Skill ---

  // GET /api/skill/download
  if ((match = matchPath("/api/skill/download", path))) {
    if (method === "GET") return handleSkillDownload(request, userId);
    return methodNotAllowed();
  }

  // --- Stripe ---

  // POST /api/stripe/checkout
  if ((match = matchPath("/api/stripe/checkout", path))) {
    if (method === "POST") return handleCreateCheckout(request, userId);
    return methodNotAllowed();
  }

  // POST /api/stripe/skill-checkout
  if ((match = matchPath("/api/stripe/skill-checkout", path))) {
    if (method === "POST") return handleSkillCheckout(request, userId);
    return methodNotAllowed();
  }

  // POST /api/stripe/portal
  if ((match = matchPath("/api/stripe/portal", path))) {
    if (method === "POST") return handleCreatePortal(request, userId);
    return methodNotAllowed();
  }

  // --- Scan History ---

  // GET/POST /api/scans
  if ((match = matchPath("/api/scans", path))) {
    if (method === "GET") return handleListScans(request, userId);
    if (method === "POST") return handleCreateScan(request, userId);
    return methodNotAllowed();
  }

  // GET /api/scans/:id
  if ((match = matchPath("/api/scans/:id", path))) {
    if (method === "GET")
      return handleGetScan(request, userId, match.params.id);
    return methodNotAllowed();
  }

  // --- Integrations ---

  // GET/POST /api/integrations
  if ((match = matchPath("/api/integrations", path))) {
    if (method === "GET") return handleListIntegrations(request, userId);
    if (method === "POST") return handleCreateOrUpdateIntegration(request, userId);
    return methodNotAllowed();
  }

  // DELETE /api/integrations/:id
  if ((match = matchPath("/api/integrations/:id", path))) {
    if (method === "DELETE")
      return handleDeleteIntegration(request, userId, match.params.id);
    return methodNotAllowed();
  }

  return notFound();
}
