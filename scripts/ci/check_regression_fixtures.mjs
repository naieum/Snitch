import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");
const fixturesDir = path.join(root, "tests", "regression-fixtures", "advanced-validation");

const requiredTopKeys = [
  "id",
  "description",
  "scan_mode",
  "selected_categories",
  "detected_features",
  "expected_validation_signals"
];

const validStatuses = new Set(["pass", "warn", "fail"]);
const validIds = new Set(["VS-001", "VS-002", "VS-003", "VS-004", "VS-005", "VS-006"]);
const evidencePattern = /^.+:\d+$/;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(fixturesDir)) {
  fail(`Missing fixtures directory: ${fixturesDir}`);
}

const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
if (files.length < 2) {
  fail("Expected at least 2 regression fixture files");
}

for (const file of files) {
  const fullPath = path.join(fixturesDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    fail(`Invalid JSON in ${file}: ${err.message}`);
  }

  for (const key of requiredTopKeys) {
    if (!(key in data)) {
      fail(`Missing top-level key '${key}' in ${file}`);
    }
  }

  if (data.scan_mode !== "quick") {
    fail(`scan_mode must be 'quick' in ${file}`);
  }

  if (!Array.isArray(data.selected_categories) || data.selected_categories.length === 0) {
    fail(`selected_categories must be a non-empty array in ${file}`);
  }

  if (!Array.isArray(data.detected_features)) {
    fail(`detected_features must be an array in ${file}`);
  }

  if (!Array.isArray(data.expected_validation_signals) || data.expected_validation_signals.length === 0) {
    fail(`expected_validation_signals must be a non-empty array in ${file}`);
  }

  const seen = new Set();
  for (const signal of data.expected_validation_signals) {
    for (const key of ["check_id", "status", "evidence", "impact", "recommended_action", "confidence"]) {
      if (!(key in signal)) {
        fail(`Missing signal key '${key}' in ${file}`);
      }
    }

    if (!validIds.has(signal.check_id)) {
      fail(`Invalid check_id '${signal.check_id}' in ${file}`);
    }

    if (seen.has(signal.check_id)) {
      fail(`Duplicate check_id '${signal.check_id}' in ${file}`);
    }
    seen.add(signal.check_id);

    if (!validStatuses.has(signal.status)) {
      fail(`Invalid status '${signal.status}' in ${file}`);
    }

    if (!Array.isArray(signal.evidence) || signal.evidence.length === 0) {
      fail(`Signal '${signal.check_id}' needs non-empty evidence array in ${file}`);
    }

    for (const ev of signal.evidence) {
      if (!evidencePattern.test(ev)) {
        fail(`Invalid evidence format '${ev}' in ${file}. Expected path:line`);
      }
    }

    if (!["high", "medium", "low"].includes(signal.confidence)) {
      fail(`Invalid confidence '${signal.confidence}' in ${file}`);
    }
  }
}

console.log(`Regression fixture check passed (${files.length} files)`);
