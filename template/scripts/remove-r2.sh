#!/usr/bin/env bash
# 移除 R2 媒體模組（見 modules.md）。於 template 根目錄執行：bash scripts/remove-r2.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▸ 移除 R2 模組檔案…"
rm -f  src/server/r2.ts
rm -rf "src/app/media"
rm -rf "src/app/api/upload"
rm -rf "src/app/admin/(dashboard)/media"

echo "▸ 移除共用檔中的 [module:r2] 接線…"

# wrangler.jsonc：刪除 [module:r2] … [module:r2:end] 區塊（連同前導換行）
perl -0777 -i -pe 's/\n[^\n]*\[module:r2\].*?\[module:r2:end\][^\n]*//s' wrangler.jsonc

# cloudflare-env.d.ts：刪除 [module:r2] 註解行 + 緊接的 MEDIA 型別行
perl -0777 -i -pe 's/\n[^\n]*\[module:r2\][^\n]*\n[^\n]*MEDIA:[^\n]*//s' cloudflare-env.d.ts

# app-sidebar.tsx：刪除 [module:r2] 註解行 + 緊接的媒體 nav 物件行
perl -0777 -i -pe 's/\n[^\n]*\[module:r2\][^\n]*\n[^\n]*href: "\/admin\/media"[^\n]*//s' \
  "src/app/admin/(dashboard)/_components/app-sidebar.tsx"

echo "▸ 以 biome 清理未用 import 與格式…"
npx --no-install biome check --write --unsafe . >/dev/null 2>&1 || true

# 清掉可能殘留的建置產物，避免 .next/types 參照已刪路由造成 typecheck 誤判
rm -rf .next .open-next

echo "✓ R2 模組已移除。"
