/**
 * Snitch GitLab Scanner — runs security audit on merge requests
 *
 * Flow:
 * 1. Get changed files from MR
 * 2. Call Snitch MCP to get audit methodology
 * 3. Send methodology + code to Claude for analysis
 * 4. Post findings as MR comment
 * 5. Set commit status (pass/fail based on severity threshold)
 *
 * Usage in .gitlab-ci.yml:
 *   snitch-scan:
 *     image: node:20
 *     script:
 *       - npx @snitch/gitlab-scanner
 *     variables:
 *       SNITCH_API_KEY: $SNITCH_API_KEY
 *       ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
 */

import { startAudit, getSubscriptionStatus } from "./mcp-client.js";
import { analyzeWithClaude } from "./claude.js";
import { getChangedFiles, postComment, setCommitStatus } from "./gitlab.js";

function log(message: string): void {
  console.log(`[snitch] ${message}`);
}

async function run(): Promise<void> {
  const snitchApiKey = process.env.SNITCH_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const scanType = process.env.SNITCH_SCAN_TYPE || "quick";
  const failOn = process.env.SNITCH_FAIL_ON || "critical";
  const model = process.env.SNITCH_MODEL || "claude-sonnet-4-20250514";
  const categoriesInput = process.env.SNITCH_CATEGORIES;

  if (!snitchApiKey) {
    throw new Error("SNITCH_API_KEY environment variable is required");
  }
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }

  const categories = categoriesInput
    ? categoriesInput
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : undefined;

  // Step 1: Verify subscription
  log("Checking Snitch subscription status...");
  const status = await getSubscriptionStatus(snitchApiKey);
  log(`Tier: ${status.tier} | Categories available: ${status.totalCategories}`);

  if (status.tier === "free") {
    throw new Error(
      "Snitch GitLab Scanner requires a paid subscription (Base, Pro, or Enterprise). Upgrade at snitch.live/dashboard/billing"
    );
  }

  // Step 2: Get changed files
  log("Getting changed files from MR...");
  const changedFiles = await getChangedFiles();
  log(`Found ${changedFiles.length} changed source files`);

  if (changedFiles.length === 0) {
    log("No source files changed — skipping scan");
    return;
  }

  // Step 3: Get audit methodology from Snitch MCP
  log(`Starting ${scanType} audit via Snitch MCP...`);
  const methodology = await startAudit(
    snitchApiKey,
    categories && categories.length > 0 ? "custom" : scanType,
    categories
  );

  // Step 4: Analyze with Claude
  log(`Analyzing ${changedFiles.length} files with Claude...`);
  const result = await analyzeWithClaude(
    anthropicApiKey,
    model,
    methodology,
    changedFiles
  );

  log(
    `Analysis complete: ${result.findings.length} finding(s) — ${result.summary}`
  );

  // Step 5: Post MR comment
  log("Posting results to MR...");
  const commentUrl = await postComment(
    result.findings,
    result.summary,
    scanType,
    changedFiles.length
  );

  // Step 6: Set commit status
  await setCommitStatus(result.findings, failOn);

  log(`Results posted: ${commentUrl}`);
}

run().catch((error) => {
  console.error(`[snitch] Fatal error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
