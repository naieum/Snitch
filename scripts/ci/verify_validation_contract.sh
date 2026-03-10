#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILL_FILE="$ROOT_DIR/skills/snitch/SKILL.md"

required_patterns=(
  "Advanced Validation Signals (Quick Scan Add-On)"
  "Validation Signal Activation (Auto in Quick Scan)"
  "VS-001"
  "VS-002"
  "VS-003"
  "VS-004"
  "VS-005"
  "VS-006"
  "## Validation Signals"
  "scan_mode_detected_features"
  "recheck_candidates"
)

for pattern in "${required_patterns[@]}"; do
  if ! rg -F -q "$pattern" "$SKILL_FILE"; then
    echo "Missing required pattern in SKILL.md: $pattern"
    exit 1
  fi
done

echo "Validation contract check passed"
