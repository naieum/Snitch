/**
 * Seed script: parses skills/snitch/categories/*.md into D1 rules rows.
 *
 * Usage:
 *   npx tsx scripts/seed-default-rules.ts            # generates SQL file
 *   npx tsx scripts/seed-default-rules.ts --remote    # generates + executes on remote D1
 *   npx tsx scripts/seed-default-rules.ts --local     # generates + executes on local D1
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, basename, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATEGORIES_DIR = join(__dirname, "../../../skills/snitch/categories");
const OUTPUT_FILE = join(__dirname, "seed-defaults.sql");
const DB_NAME = "snitchmcp-db";
const SYSTEM_RULESET_ID = "snitch-default-v1";

interface CategoryRule {
  id: string;
  number: number;
  title: string;
  description: string;
  severity: string;
  filePattern: string | null;
}

// Severity based on category type, not section headers
const SEVERITY_MAP: Record<number, string> = {
  1: "critical",  // SQL Injection
  2: "critical",  // XSS
  3: "critical",  // Hardcoded Secrets
  4: "critical",  // Authentication
  5: "critical",  // SSRF
  6: "high",      // Supabase
  7: "high",      // Rate Limiting
  8: "high",      // CORS
  9: "high",      // Cryptography
  10: "high",     // Dangerous Patterns
  11: "high",     // Cloud
  12: "medium",   // Logging / Data Exposure
  13: "critical", // Stripe
  14: "high",     // Auth Providers
  15: "critical", // AI APIs
  16: "high",     // Email
  17: "critical", // Database
  18: "high",     // Redis
  19: "high",     // SMS
  20: "critical", // HIPAA
  21: "high",     // SOC 2
  22: "critical", // PCI-DSS
  23: "high",     // GDPR
  24: "medium",   // Memory Leaks
  25: "medium",   // N+1 Queries
  26: "medium",   // Performance
  27: "high",     // Dependencies
  28: "high",     // Authorization / IDOR
  29: "high",     // File Uploads
  30: "high",     // Input Validation
  31: "high",     // CI/CD
  32: "medium",   // Security Headers
  33: "medium",   // Unused Deps
  34: "high",     // FIPS
  35: "medium",   // Governance
  36: "medium",   // BCDR
  37: "medium",   // Monitoring
  38: "medium",   // Data Classification
  39: "high",     // Token Lifetimes
  40: "high",     // Tunnels / DNS
};

function parseSeverity(catNumber: number): string {
  return SEVERITY_MAP[catNumber] ?? "medium";
}

function parseFilePatterns(content: string): string | null {
  const match = content.match(/### Files to Check\n([\s\S]*?)(?=\n###|\n##|$)/);
  if (!match) return null;
  const patterns = match[1]
    .split("\n")
    .map((line) => line.replace(/^- /, "").replace(/`/g, "").trim())
    .filter(Boolean);
  return patterns.length > 0 ? patterns.join(", ") : null;
}

function parseTitle(content: string): string {
  const match = content.match(/^## CATEGORY \d+:\s*(.+)$/m);
  return match ? match[1].trim() : "Unknown Category";
}

function parseCategoryNumber(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function parseCategory(filepath: string): CategoryRule {
  const content = readFileSync(filepath, "utf-8");
  const filename = basename(filepath);
  const number = parseCategoryNumber(filename);
  const title = parseTitle(content);
  const severity = parseSeverity(number);
  const filePattern = parseFilePatterns(content);

  return {
    id: `snitch-cat-${String(number).padStart(2, "0")}`,
    number,
    title,
    description: content,
    severity,
    filePattern,
  };
}

function buildSQL(rules: CategoryRule[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push("-- Snitch Default Rules Seed");
  lines.push("-- Auto-generated from skills/snitch/categories/*.md");
  lines.push(`-- Generated: ${now}`);
  lines.push("");

  // Delete existing system ruleset + rules (idempotent)
  lines.push(`DELETE FROM rules WHERE rulesetId = '${SYSTEM_RULESET_ID}';`);
  lines.push(`DELETE FROM rulesets WHERE id = '${SYSTEM_RULESET_ID}';`);
  lines.push("");

  // Insert system ruleset
  lines.push(
    `INSERT INTO rulesets (id, name, description, category, tags, isPublic, ownerId, ruleCount, createdAt, updatedAt)` +
      ` VALUES ('${SYSTEM_RULESET_ID}', 'Snitch Default Rules', 'Built-in security audit categories covering 40 vulnerability types, compliance standards, and performance checks.', 'security', 'default,system,built-in', 1, NULL, ${rules.length}, '${now}', '${now}');`
  );
  lines.push("");

  // Insert each rule
  for (const rule of rules) {
    lines.push(
      `INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt)` +
        ` VALUES ('${rule.id}', '${SYSTEM_RULESET_ID}', '${escapeSQL(rule.title)}', '${escapeSQL(rule.description)}', '${rule.severity}', NULL, NULL, ${rule.filePattern ? `'${escapeSQL(rule.filePattern)}'` : "NULL"}, NULL, NULL, NULL, '${now}', '${now}');`
    );
  }

  lines.push("");
  lines.push(`-- Seeded ${rules.length} default rules`);

  return lines.join("\n");
}

// Main
const files = readdirSync(CATEGORIES_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

console.log(`Found ${files.length} category files`);

const rules = files.map((f) => parseCategory(join(CATEGORIES_DIR, f)));
rules.sort((a, b) => a.number - b.number);

console.log("Parsed categories:");
for (const r of rules) {
  console.log(`  [${r.id}] ${r.title} (${r.severity})`);
}

const sql = buildSQL(rules);
writeFileSync(OUTPUT_FILE, sql, "utf-8");
console.log(`\nSQL written to: ${OUTPUT_FILE}`);

// Execute if flag provided
const args = process.argv.slice(2);
if (args.includes("--remote")) {
  console.log("\nExecuting on remote D1...");
  execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file=${OUTPUT_FILE}`, {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  });
  console.log("Done.");
} else if (args.includes("--local")) {
  console.log("\nExecuting on local D1...");
  execSync(`npx wrangler d1 execute ${DB_NAME} --local --file=${OUTPUT_FILE}`, {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  });
  console.log("Done.");
} else {
  console.log("\nTo apply:");
  console.log(`  cd packages/app && npx wrangler d1 execute ${DB_NAME} --remote --file=scripts/seed-defaults.sql`);
  console.log(`  cd packages/app && npx wrangler d1 execute ${DB_NAME} --local --file=scripts/seed-defaults.sql`);
}
