# deploy — 部署、設定 runtime secret、驗證、除錯

## 5. 部署

```bash
npm run cf:deploy
# = wrangler d1 migrations apply <slug> --remote
#   && opennextjs-cloudflare build
#   && opennextjs-cloudflare deploy
```

- build 會讀 `.env` 驗證環境變數 —— 確認 `BETTER_AUTH_SECRET` 已在 `.env`(見 provision.md 第 3 步),否則 build 會失敗。
- 部署成功後輸出會有網址:`https://<slug>.<subdomain>.workers.dev`。記下它,回填 `ADMIN.md`。

### 設定 runtime secret(首次部署後)

`wrangler secret put` 需要 worker 已存在,故在**第一次 `cf:deploy` 之後**執行:

```bash
printf '%s' "$SECRET" | npx wrangler secret put BETTER_AUTH_SECRET
```

設 secret 不需要重新部署即生效。若不確定 `$SECRET` 還在,重新產生一組並同步更新 `.env` 後再 `secret put`。

### 瀏覽器登入的 origin(template 已內建處理)

better-auth 會擋掉來源不在信任清單的登入請求(CSRF 保護)。template 的 better-auth config 已設 `trustedOrigins` 為「動態信任請求自身來源」,因此**首次部署即可從瀏覽器登入,不需要知道或回填 workers.dev 網址、也不需要第二次部署**。

`BETTER_AUTH_URL` 因此非必需;僅在你要一個「正式對外網址」用於產生連結時,才於 `wrangler.jsonc` 加 `"vars": { "BETTER_AUTH_URL": "https://<你的網址>" }` 並重新部署。

## 6. 驗證(做到「真的能開」才算完成)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<slug>.<subdomain>.workers.dev   # 期望 200
```

- 開 `/admin/login`,用 `ADMIN.md` 的帳密**實際登入一次**,確認能進後台、能新增一筆 Post。
- (有 R2)在後台「媒體」頁上傳一張圖,確認顯示。

### 失敗時的診斷

```bash
npx wrangler tail <slug>     # 即時看 Worker log,另開一個請求觸發
```

常見問題:

| 症狀 | 可能原因 | 處理 |
|---|---|---|
| 500 / 首頁打不開 | `database_id` 還是 placeholder | 用 `wrangler d1 create` 的真實 id 取代後重部署 |
| 登入後又被踢回 | runtime `BETTER_AUTH_SECRET` 未設 | `wrangler secret put BETTER_AUTH_SECRET` |
| 登入回 403 `Invalid origin` | 專案的 better-auth config 缺動態 `trustedOrigins`(舊版 scaffold) | 補上 config.ts 的 `trustedOrigins`(見 template)後重部署 |
| 登入說帳密錯 | admin seed SQL 沒套用成功 | 重跑 gen-admin-sql + `d1 execute --remote` |
| build 失敗說缺 env | `.env` 沒有 `BETTER_AUTH_SECRET` | 補進 `.env` 再 `cf:deploy` |
| 圖片上傳 500 | R2 bucket 未建 / binding 名不符 | `wrangler r2 bucket create <slug>`,對照 `wrangler.jsonc` |

## 7. 交付

給使用者(白話):
- 「你的網站上線了:`https://<slug>.<subdomain>.workers.dev`」
- 「後台在 網址/admin,帳號密碼我存在專案的 `ADMIN.md` 裡了」
- 「之後想改任何東西,直接跟我說就好」

日常維護 → 見 [maintain.md](maintain.md)。
