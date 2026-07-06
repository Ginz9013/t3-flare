# 可選模組（減法契約）

本 template 採「全功能 + 減法裁切」：預設包含所有模組並保證 `build` 通過；
不需要的模組**刪除**，而非用開關生成。刪除步驟以腳本固化，CI 對「全功能」與
「刪除後」兩條路徑都驗證能 build，避免此契約與現實脫節。

site-builder skill 於 scaffold 時，依使用者需求呼叫對應腳本裁切。

---

## R2 媒體模組

上傳圖片至 Cloudflare R2、以 `/media/<key>` 對外提供。與 Post CRUD 解耦，可獨立移除。

**移除方式**：於 template 根目錄執行

```bash
bash scripts/remove-r2.sh
```

**footprint（腳本涵蓋的範圍，皆標記 `[module:r2]`）**

| 類型 | 路徑 / 位置 | 動作 |
|---|---|---|
| 整檔 | `src/server/r2.ts` | 刪除 |
| 整目錄 | `src/app/media/` | 刪除 |
| 整目錄 | `src/app/api/upload/` | 刪除 |
| 整目錄 | `src/app/admin/(dashboard)/media/` | 刪除 |
| 區塊 | `wrangler.jsonc` 的 `r2_buckets`（`[module:r2]`…`[module:r2:end]`） | 移除 |
| 行 | `cloudflare-env.d.ts` 的 `MEDIA` binding 型別 | 移除 |
| 行 | `src/app/admin/(dashboard)/_components/app-sidebar.tsx` 的媒體 nav 項 | 移除 |

移除後腳本會跑 `biome check --write --unsafe` 清掉因此產生的未用 import 並正規化格式。

**依賴方向**：R2 依賴 auth（上傳需登入），但 Post CRUD／auth／dashboard **不依賴** R2，
故 R2 可安全移除；反之不成立（auth 為 base，不可移除）。
