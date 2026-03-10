/**
 * Push seed default rules to remote D1 via the Cloudflare API.
 *
 * Usage:
 *   npx tsx scripts/seed-default-rules.ts        # generate SQL first
 *   npx tsx scripts/push-seed.ts                  # push to remote D1
 */

import { readFileSync, readdirSync } from "fs";
import { join, basename, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CATEGORIES_DIR = join(__dirname, "../../../skills/snitch/categories");
const DB_NAME = "snitchmcp-db";
const ACCOUNT_ID = "451e42275db774dca3e5d5c49b218b4d";
const DB_ID = "e9cc7482-ed9a-4f67-9ed7-bf55b48537fb";
const SYSTEM_RULESET_ID = "snitch-default-v1";

// Severity map
const SEVERITY_MAP: Record<number, string> = {
  1: "critical", 2: "critical", 3: "critical", 4: "critical", 5: "critical",
  6: "high", 7: "high", 8: "high", 9: "high", 10: "high", 11: "high", 12: "medium",
  13: "critical", 14: "high", 15: "critical", 16: "high", 17: "critical",
  18: "high", 19: "high", 20: "critical", 21: "high", 22: "critical", 23: "high",
  24: "medium", 25: "medium", 26: "medium", 27: "high", 28: "high", 29: "high",
  30: "high", 31: "high", 32: "medium", 33: "medium", 34: "high", 35: "medium",
  36: "medium", 37: "medium", 38: "medium", 39: "high", 40: "high",
};

function getOAuthToken(): string {
  // Wrangler stores the OAuth token — grab it from wrangler whoami output
  const result = execSync("npx wrangler d1 execute snitchmcp-db --remote --command=\"SELECT 1\" --json 2>/dev/null", {
    cwd: join(__dirname, ".."),
    encoding: "utf-8",
  });
  // If that works, wrangler has valid auth. Let's use the token file.
  // Wrangler OAuth tokens are at ~/.wrangler/config/default.toml
  try {
    const home = process.env.HOME!;
    const configPaths = [
      join(home, ".wrangler", "config", "default.toml"),
      join(home, "Library", "Preferences", ".wrangler", "config", "default.toml"),
    ];
    for (const p of configPaths) {
      try {
        const config = readFileSync(p, "utf-8");
        const match = config.match(/oauth_token\s*=\s*"([^"]+)"/);
        if (match) return match[1];
      } catch { /* try next */ }
    }
  } catch { /* fall through */ }
  throw new Error("Could not find wrangler OAuth token. Run `wrangler login` first.");
}

async function d1Query(token: string, sql: string, params: string[] = []): Promise<any> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data.errors)}`);
  }
  return data;
}

function parseTitle(content: string): string {
  const match = content.match(/^## CATEGORY \d+:\s*(.+)$/m);
  return match ? match[1].trim() : "Unknown Category";
}

function parseCategoryNumber(filename: string): number {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
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

async function main() {
  console.log("Getting auth token...");
  const token = getOAuthToken();
  console.log("Token found.\n");

  const now = new Date().toISOString();

  // Clean existing
  console.log("Cleaning existing default rules...");
  await d1Query(token, "DELETE FROM rules WHERE rulesetId = ?", [SYSTEM_RULESET_ID]);
  await d1Query(token, "DELETE FROM rulesets WHERE id = ?", [SYSTEM_RULESET_ID]);

  // Create system ruleset
  console.log("Creating system ruleset...");
  // ownerId is NULL for system rulesets (FK references user table)
  await d1Query(
    token,
    `INSERT INTO rulesets (id, name, description, category, tags, isPublic, ownerId, ruleCount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 1, NULL, ?, ?, ?)`,
    [
      SYSTEM_RULESET_ID,
      "Snitch Default Rules",
      "Built-in security audit categories covering 40 vulnerability types, compliance standards, and performance checks.",
      "security",
      "default,system,built-in",
      "40",
      now,
      now,
    ]
  );

  // Read and insert each category
  const files = readdirSync(CATEGORIES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(`\nSeeding ${files.length} categories...\n`);

  let success = 0;
  for (const file of files) {
    const filepath = join(CATEGORIES_DIR, file);
    const content = readFileSync(filepath, "utf-8");
    const number = parseCategoryNumber(file);
    const title = parseTitle(content);
    const severity = SEVERITY_MAP[number] ?? "medium";
    const filePattern = parseFilePatterns(content);
    const id = `snitch-cat-${String(number).padStart(2, "0")}`;

    process.stdout.write(`  [${id}] ${title} (${severity})... `);

    try {
      await d1Query(
        token,
        `INSERT INTO rules (id, rulesetId, title, description, severity, language, framework, filePattern, pattern, goodExample, badExample, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, NULL, ?, ?)`,
        [id, SYSTEM_RULESET_ID, title, content, severity, filePattern ?? "", now, now]
      );
      console.log("OK");
      success++;
    } catch (e: any) {
      console.log(`FAILED: ${e.message?.slice(0, 100)}`);
    }
  }

  console.log(`\nDone: ${success}/${files.length} rules seeded.`);

  // Verify
  const result = await d1Query(token, "SELECT COUNT(*) as count FROM rules WHERE rulesetId = ?", [SYSTEM_RULESET_ID]);
  console.log(`Verification: ${result.result?.[0]?.results?.[0]?.count ?? "?"} rules in DB`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
