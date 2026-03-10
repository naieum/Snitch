#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

SKILLS_DIR="$ROOT_DIR/skills/snitch"
AGENTS_DIR="$ROOT_DIR/agents/skills/snitch"

if ! diff -ru --exclude='.DS_Store' "$SKILLS_DIR" "$AGENTS_DIR" >/tmp/snitch-skill-diff.txt; then
  echo "Skill mirror mismatch between skills/snitch and agents/skills/snitch"
  cat /tmp/snitch-skill-diff.txt
  exit 1
fi

echo "Skill mirror check passed"
