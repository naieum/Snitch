#!/usr/bin/env bash
set -euo pipefail

# Build and upload the Snitch skill zip to R2
# Usage: ./scripts/upload-skill.sh [version]

VERSION="${1:-6.0.0}"

# Build the zip
./scripts/build-skill-zip.sh "$VERSION"

# Upload to R2
echo "Uploading to R2..."
wrangler r2 object put "snitchmcp-exports/skill-v${VERSION}.zip" \
  --file "dist/skill-v${VERSION}.zip" \
  --content-type "application/zip"

echo ""
echo "Uploaded skill-v${VERSION}.zip to R2 bucket snitchmcp-exports"
