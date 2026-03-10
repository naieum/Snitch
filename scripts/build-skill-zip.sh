#!/usr/bin/env bash
set -euo pipefail

# Build the Snitch skill zip for upload to R2
# Usage: ./scripts/build-skill-zip.sh [version]

VERSION="${1:-6.0.0}"
OUTPUT="dist/skill-v${VERSION}.zip"
SKILL_DIR="skills/snitch"

echo "Building Snitch skill zip v${VERSION}..."

# Verify skill files exist
if [ ! -f "${SKILL_DIR}/SKILL.md" ]; then
  echo "Error: ${SKILL_DIR}/SKILL.md not found"
  exit 1
fi

# Create dist directory
mkdir -p dist

# Remove previous build
rm -f "$OUTPUT"

# Zip the skill directory
cd "$SKILL_DIR"
zip -r "../../${OUTPUT}" SKILL.md copilot-entry.md categories/ 2>/dev/null || zip -r "../../${OUTPUT}" SKILL.md copilot-entry.md
cd ../..

echo "Built: ${OUTPUT}"
echo "Size: $(du -h "$OUTPUT" | cut -f1)"
echo ""
echo "To upload to R2:"
echo "  wrangler r2 object put snitchmcp-exports/skill-v${VERSION}.zip --file ${OUTPUT}"
