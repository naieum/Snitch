/**
 * Snitch GitHub Action — runs security audit on PRs
 *
 * Flow:
 * 1. Get changed files from PR
 * 2. Call Snitch MCP to get audit methodology
 * 3. Send methodology + code to Claude for analysis
 * 4. Post findings as PR comment
 * 5. Set commit status (pass/fail based on severity threshold)
 */

import * as core from "@actions/core";
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { startAudit, getSubscriptionStatus } from "./mcp-client.js";
import { analyzeWithClaude } from "./claude.js";
import { getChangedFiles, postComment, setCheckStatus } from "./github.js";

interface Fix {
  file: string;
  original: string;
  replacement: string;
}

/**
 * Validate that a fix object has the expected shape.
 */
function isValidFix(obj: unknown): obj is Fix {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.file === "string" &&
    typeof o.original === "string" &&
    typeof o.replacement === "string" &&
    o.file.length > 0 &&
    o.original.length > 0
  );
}

/**
 * Validate that a file path is within the repository root.
 * Prevents path traversal attacks from Claude-generated paths.
 */
function isPathWithinRepo(filePath: string, repoRoot: string): boolean {
  const resolved = path.resolve(repoRoot, filePath);
  return resolved.startsWith(repoRoot + path.sep) || resolved === repoRoot;
}

/**
 * Call the Claude API directly to generate fix JSON for the given findings.
 * Unlike analyzeWithClaude(), this returns the raw fixes array rather than
 * a parsed AuditResult, avoiding the response format mismatch.
 */
async function generateFixes(
  apiKey: string,
  model: string,
  findings: Array<{ title: string; file: string; line?: number; fix: string }>,
  changedFiles: Array<{ path: string; content: string; patch: string }>
): Promise<Fix[]> {
  const fileContext = changedFiles
    .map(
      (f) =>
        `### File: ${f.path}\n\`\`\`\n${f.content.slice(0, 8000)}\n\`\`\``
    )
    .join("\n\n---\n\n");

  const prompt = `You are a security engineer. For each finding below, generate the MINIMAL code change that fixes the vulnerability without changing behavior.

Return ONLY valid JSON matching this schema (no markdown fences, no explanation):
{"fixes": [{"file": "path/to/file", "original": "exact original code snippet", "replacement": "fixed code snippet"}]}

If you cannot generate a safe fix for a finding, omit it from the array.

## Findings

${findings.map((f) => `- ${f.title} in ${f.file}:${f.line ?? "?"} — ${f.fix}`).join("\n")}

## Source Files

${fileContext}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error during fix generation: ${response.status} — ${errorText}`);
  }

  const result = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const text = result.content[0]?.text ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract fix JSON from Claude response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { fixes?: unknown[] };

  if (!Array.isArray(parsed.fixes)) {
    throw new Error("Claude response missing 'fixes' array");
  }

  const validFixes = parsed.fixes.filter(isValidFix);

  if (validFixes.length === 0 && parsed.fixes.length > 0) {
    core.warning(
      `All ${parsed.fixes.length} fix(es) from Claude failed validation — skipping`
    );
  }

  return validFixes;
}

async function run(): Promise<void> {
  try {
    const snitchApiKey = core.getInput("snitch-api-key", { required: true });
    const anthropicApiKey = core.getInput("anthropic-api-key", {
      required: true,
    });
    const scanType = core.getInput("scan-type") || "quick";
    const categoriesInput = core.getInput("categories");
    const failOn = core.getInput("fail-on") || "critical";
    const model = core.getInput("model") || "claude-sonnet-4-20250514";
    const autoFix = core.getInput("auto-fix") === "true";
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      throw new Error(
        "GITHUB_TOKEN not found. Add `permissions: pull-requests: write` to your workflow."
      );
    }

    // Parse categories if provided
    const categories = categoriesInput
      ? categoriesInput
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : undefined;

    // Step 1: Verify subscription
    core.info("Checking Snitch subscription status...");
    const status = await getSubscriptionStatus(snitchApiKey);
    core.info(
      `Tier: ${status.tier} | Categories available: ${status.totalCategories}`
    );

    if (status.tier === "free") {
      core.setFailed(
        "Snitch GitHub Action requires a paid subscription (Base, Pro, or Enterprise). Upgrade at snitch.live/dashboard/billing"
      );
      return;
    }

    // Step 2: Get changed files
    core.info("Getting changed files from PR...");
    const changedFiles = await getChangedFiles(githubToken);
    core.info(`Found ${changedFiles.length} changed source files`);

    if (changedFiles.length === 0) {
      core.info("No source files changed — skipping scan");
      core.setOutput("findings-count", "0");
      core.setOutput("critical-count", "0");
      core.setOutput("high-count", "0");
      return;
    }

    // Step 3: Get audit methodology from Snitch MCP
    core.info(`Starting ${scanType} audit via Snitch MCP...`);
    const methodology = await startAudit(
      snitchApiKey,
      categories && categories.length > 0 ? "custom" : scanType,
      categories
    );

    // Step 4: Analyze with Claude
    core.info(`Analyzing ${changedFiles.length} files with Claude...`);
    const result = await analyzeWithClaude(
      anthropicApiKey,
      model,
      methodology,
      changedFiles
    );

    core.info(
      `Analysis complete: ${result.findings.length} finding(s) — ${result.summary}`
    );

    // Step 5: Post PR comment
    core.info("Posting results to PR...");
    const commentUrl = await postComment(
      githubToken,
      result.findings,
      result.summary,
      scanType,
      changedFiles.length
    );

    // Step 6: Set check status
    await setCheckStatus(githubToken, result.findings, failOn);

    // Set outputs
    const criticalCount = result.findings.filter(
      (f) => f.severity === "Critical"
    ).length;
    const highCount = result.findings.filter(
      (f) => f.severity === "High"
    ).length;

    core.setOutput("findings-count", String(result.findings.length));
    core.setOutput("critical-count", String(criticalCount));
    core.setOutput("high-count", String(highCount));
    core.setOutput("report-url", commentUrl);

    core.info(`Results posted: ${commentUrl}`);

    // Step 7: Auto-fix (optional)
    if (autoFix && result.findings.length > 0) {
      core.info("Auto-fix enabled — generating fix PR...");
      try {
        const repoRoot = process.cwd();
        const fixBranch = `snitch/fix-${Date.now()}`;

        execFileSync("git", ["checkout", "-b", fixBranch], { stdio: "pipe" });

        // Configure git user for the commit
        execFileSync(
          "git",
          ["config", "user.name", "snitch[bot]"],
          { stdio: "pipe" }
        );
        execFileSync(
          "git",
          ["config", "user.email", "snitch-bot@snitch.live"],
          { stdio: "pipe" }
        );

        // Use a direct Claude API call to get fix JSON (not analyzeWithClaude,
        // which reformats the response into AuditResult)
        const fixes = await generateFixes(
          anthropicApiKey,
          model,
          result.findings,
          changedFiles
        );

        let appliedCount = 0;
        for (const fix of fixes) {
          try {
            // Validate path is within the repo to prevent traversal
            if (!isPathWithinRepo(fix.file, repoRoot)) {
              core.warning(
                `Skipping fix for ${fix.file} — path is outside repository root`
              );
              continue;
            }

            const resolvedPath = path.resolve(repoRoot, fix.file);
            const content = readFileSync(resolvedPath, "utf-8");
            const updated = content.replace(fix.original, fix.replacement);
            if (updated !== content) {
              writeFileSync(resolvedPath, updated);
              // Use execFileSync to avoid shell injection via file paths
              execFileSync("git", ["add", resolvedPath], { stdio: "pipe" });
              appliedCount++;
            }
          } catch (applyError) {
            core.warning(
              `Could not apply fix to ${fix.file}: ${applyError instanceof Error ? applyError.message : String(applyError)}`
            );
          }
        }

        if (appliedCount > 0) {
          execFileSync(
            "git",
            ["commit", "-m", "fix: apply Snitch security fixes"],
            { stdio: "pipe" }
          );
          execFileSync("git", ["push", "origin", fixBranch], {
            stdio: "pipe",
          });

          core.info(
            `Fix branch pushed: ${fixBranch} (${appliedCount} file(s) fixed)`
          );
        } else {
          core.info("No fixes were applied — skipping fix branch push");
        }
      } catch (fixError) {
        core.warning(
          `Auto-fix failed: ${fixError instanceof Error ? fixError.message : String(fixError)}`
        );
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred");
    }
  }
}

run();
