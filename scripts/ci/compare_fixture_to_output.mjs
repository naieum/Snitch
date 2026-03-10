import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");
const fixturesDir = path.join(root, "tests", "regression-fixtures", "advanced-validation");
const outputsDir = path.join(root, "tests", "regression-fixtures", "scan-outputs");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    fail(`Invalid JSON: ${filePath}: ${err.message}`);
  }
}

function normalizeEvidence(evidence) {
  if (!Array.isArray(evidence)) return [];
  return evidence
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof item.location === "string") return item.location;
      return null;
    })
    .filter(Boolean);
}

function requireKeys(obj, keys, fileLabel) {
  for (const key of keys) {
    if (!(key in obj)) {
      fail(`Missing key '${key}' in ${fileLabel}`);
    }
  }
}

if (!fs.existsSync(fixturesDir)) fail(`Missing fixtures directory: ${fixturesDir}`);
if (!fs.existsSync(outputsDir)) fail(`Missing outputs directory: ${outputsDir}`);

const fixtureFiles = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
if (fixtureFiles.length === 0) fail("No regression fixtures found");

for (const fixtureFile of fixtureFiles) {
  const fixturePath = path.join(fixturesDir, fixtureFile);
  const fixture = readJson(fixturePath);

  requireKeys(
    fixture,
    ["id", "scan_mode", "selected_categories", "detected_features", "expected_validation_signals"],
    fixtureFile,
  );

  const outputPath = path.join(outputsDir, `${fixture.id}.output.json`);
  if (!fs.existsSync(outputPath)) {
    fail(`Missing output file for fixture '${fixture.id}': ${path.relative(root, outputPath)}`);
  }
  const output = readJson(outputPath);

  requireKeys(
    output,
    [
      "id",
      "scan_mode",
      "selected_categories",
      "scan_mode_detected_features",
      "validation_signals",
      "findings",
      "recheck_candidates",
    ],
    path.basename(outputPath),
  );

  if (output.id !== fixture.id) {
    fail(`Output id mismatch for fixture '${fixture.id}': got '${output.id}'`);
  }

  if (output.scan_mode !== fixture.scan_mode) {
    fail(`scan_mode mismatch for '${fixture.id}': expected '${fixture.scan_mode}', got '${output.scan_mode}'`);
  }

  const selectedCategories = [...output.selected_categories].sort((a, b) => a - b);
  const expectedCategories = [...fixture.selected_categories].sort((a, b) => a - b);
  if (JSON.stringify(selectedCategories) !== JSON.stringify(expectedCategories)) {
    fail(`selected_categories mismatch for '${fixture.id}'`);
  }

  for (const feature of fixture.detected_features) {
    if (!output.scan_mode_detected_features.includes(feature)) {
      fail(`Missing detected feature '${feature}' in output '${fixture.id}'`);
    }
  }

  if (!Array.isArray(output.validation_signals) || output.validation_signals.length === 0) {
    fail(`validation_signals must be a non-empty array in output '${fixture.id}'`);
  }

  const outputById = new Map();
  for (const signal of output.validation_signals) {
    requireKeys(signal, ["check_id", "status", "evidence", "impact", "recommended_action", "confidence"], outputPath);

    if (outputById.has(signal.check_id)) {
      fail(`Duplicate check_id '${signal.check_id}' in output '${fixture.id}'`);
    }
    outputById.set(signal.check_id, signal);
  }

  for (const expectedSignal of fixture.expected_validation_signals) {
    const actual = outputById.get(expectedSignal.check_id);
    if (!actual) {
      fail(`Missing signal '${expectedSignal.check_id}' in output '${fixture.id}'`);
    }

    if (actual.status !== expectedSignal.status) {
      fail(
        `Status mismatch for '${fixture.id}' signal '${expectedSignal.check_id}': expected '${expectedSignal.status}', got '${actual.status}'`,
      );
    }

    if (actual.confidence !== expectedSignal.confidence) {
      fail(
        `Confidence mismatch for '${fixture.id}' signal '${expectedSignal.check_id}': expected '${expectedSignal.confidence}', got '${actual.confidence}'`,
      );
    }

    const actualEvidence = normalizeEvidence(actual.evidence);
    for (const expectedEvidence of expectedSignal.evidence) {
      if (!actualEvidence.includes(expectedEvidence)) {
        fail(
          `Evidence mismatch for '${fixture.id}' signal '${expectedSignal.check_id}': missing '${expectedEvidence}'`,
        );
      }
    }
  }
}

console.log(`Fixture-to-output comparison passed (${fixtureFiles.length} fixtures)`);
