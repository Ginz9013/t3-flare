---
name: site-butler
description: 全程網站管家 — 為使用者從零建立並部署一個 Cloudflare 網站(含後台、資料庫、圖片上傳),雲端操作全由 AI 代為完成。Use when the user wants to build/create/launch a website, make their own site with an admin panel, or deploy a web app to Cloudflare — especially non-technical users who can write content but get stuck on deployment. Triggers: 「我想做一個網站」「幫我架站」「做一個有後台的網站」「部署到 Cloudflare」, "build me a website", "deploy to cloudflare", "set up a site with a dashboard".
---

# site-butler

從零幫使用者建立並上線一個網站。技術棧(t3-flare:Next.js + Cloudflare Workers + D1 + R2 + better-auth)對使用者是隱形的 —— **只問用途、不問技術名詞**。使用者只需負責:Cloudflare 帳號、綁信用卡、瀏覽器點一次 OAuth 允許;其餘全由你代操。

面對非工程使用者:用白話、一次只問一件事、做每一步前說明你要做什麼。**目標是交付一個能開的網址 + 後台帳密,而非生完檔案就停。**

## 流程總覽(逐階段;指令細節見 references)

0. **開場說明 + 帳號準備** — 先用白話說明:網站會放在 **Cloudflare** 這個平台上;基本功能(網站、資料庫)在**免費額度內、不用綁卡**;只有「上傳圖片」功能需要在 Cloudflare **綁一張信用卡**(仍是免費額度,平台規定)。請使用者先到 [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) 註冊免費帳號,再 `npx wrangler login`(開瀏覽器點允許 —— 這是他唯一要親自做的)。**綁卡不在此強制**,留到第 3 步真的要建 R2 時再檢查。接著做技術前置檢查(node/npm/git/wrangler)。見 [references/provision.md](references/provision.md)。
1. **訪談** — 白話問:網站名稱?用途?要不要上傳圖片/相簿(決定是否保留 R2、以及是否需要綁卡)?管理員 email 與密碼(可代生)。
2. **組裝** — `npx degit Ginz9013/t3-flare/template <dir>`;不要圖片上傳就 `bash scripts/remove-r2.sh`;把 `my-site` 全域改成使用者的名稱;寫入 `.template-version`;`npm install`;`git init` + 首次 commit。見 [references/provision.md](references/provision.md)。
3. **供裝 Cloudflare** — `wrangler d1 create` → 把 id 填回 `wrangler.jsonc` 的 `PLACEHOLDER_D1_DATABASE_ID`;**(有 R2)建 bucket 前先確認已綁卡** —— `wrangler r2 bucket create` 若因未啟用 R2/未綁卡而失敗,白話請使用者到 Cloudflare 後台開通 R2 並綁卡後再繼續;產 `BETTER_AUTH_SECRET` → 寫入 `.env`(build 時驗證需要)+ 首次部署後 `wrangler secret put`(runtime)。見 [references/provision.md](references/provision.md)。
4. **資料庫 + 管理員** — `npm run cf:migrate`;`gen-admin-sql.ts` 產 SQL → `wrangler d1 execute --remote --file`;把網址與帳密寫進專案根的 `ADMIN.md`(已 gitignore)。見 [references/provision.md](references/provision.md)。
5. **部署** — `npm run cf:deploy` → 取得 `https://<name>.<subdomain>.workers.dev`。見 [references/deploy.md](references/deploy.md)。
6. **驗證** — curl 首頁 200、實際登入後台一次;失敗則 `wrangler tail` 診斷自我修復,直到真的能開。見 [references/deploy.md](references/deploy.md)。
7. **交付與維護** — 給使用者:網站網址、後台網址(`/admin`)、`ADMIN.md` 位置;說明日後怎麼請你改東西。日常維護見 [references/maintain.md](references/maintain.md)。

## 護欄(務必遵守)

- **破壞性 D1 操作前先備份**:改 schema、刪資料前先 `wrangler d1 export <name> --remote --output backup.sql`。D1 沒有好用的 rollback,使用者不會救資料。
- **改動前先 commit**:git 可用時,每個里程碑與每次「使用者請求的修改」前自動 commit,壞了能一鍵還原(白話說「我先存個檔」,不對使用者提 git)。git 未裝則主動提議代裝(`brew install git` / winget),拒絕就繼續走,僅在高風險修改前警告「這次沒有後悔藥」。
- **費用透明**:預設走免費額度與 `workers.dev` 子網域;R2 需綁卡、Workers Paid 有門檻 —— 在訪談階段就講清楚。
- **機密不外洩**:`BETTER_AUTH_SECRET`、密碼等不要複述在對話裡;帳密只落在 `ADMIN.md`。
- **預覽再上線**:日常內容修改預設先 `npm run dev` 本機預覽,使用者點頭才部署;使用者明說「直接上」才跳過。見 [references/maintain.md](references/maintain.md)。

## 關鍵事實(易錯處)

- `BETTER_AUTH_SECRET` 是 **build 時(`.env`)與 runtime(`wrangler secret put`)都要**:`next build` 在 production 會驗證 env,少了 `.env` 會 build 失敗。
- 正式 D1 **跑不了 node seed**;管理員一律用 `gen-admin-sql.ts` 產 SQL + `wrangler d1 execute --remote` 套用。
- `database_id` 起始是 `PLACEHOLDER_D1_DATABASE_ID`,**務必**用 `wrangler d1 create` 回傳的真實 id 取代,否則部署連不到 DB。
- 使用 `Ginz9013/t3-flare/template` 的 **main** 版;裁切邏輯讀專案內的 `modules.md`,不要硬記。
