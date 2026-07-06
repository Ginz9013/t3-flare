#!/usr/bin/env bash
# Remove the R2 media module (see modules.md). Run from the template root: bash scripts/remove-r2.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▸ Removing R2 module files…"
rm -f  src/server/r2.ts
rm -rf "src/app/media"
rm -rf "src/app/api/upload"
rm -rf "src/app/admin/(dashboard)/media"

echo "▸ Removing [module:r2] wiring from shared files…"

# wrangler.jsonc: delete the [module:r2] … [module:r2:end] block (along with the leading newline)
perl -0777 -i -pe 's/\n[^\n]*\[module:r2\].*?\[module:r2:end\][^\n]*//s' wrangler.jsonc

# cloudflare-env.d.ts: delete the [module:r2] comment line + the MEDIA type line right after it
perl -0777 -i -pe 's/\n[^\n]*\[module:r2\][^\n]*\n[^\n]*MEDIA:[^\n]*//s' cloudflare-env.d.ts

# app-sidebar.tsx: delete the [module:r2] comment line + the media nav object line right after it
perl -0777 -i -pe 's/\n[^\n]*\[module:r2\][^\n]*\n[^\n]*href: "\/admin\/media"[^\n]*//s' \
  "src/app/admin/(dashboard)/_components/app-sidebar.tsx"

echo "▸ Cleaning up unused imports and formatting with biome…"
npx --no-install biome check --write --unsafe . >/dev/null 2>&1 || true

# Clear any leftover build artifacts so .next/types referencing deleted routes doesn't cause false typecheck errors
rm -rf .next .open-next

echo "✓ R2 module removed."
