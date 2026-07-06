---
name: site-builder
description: 自動化建站工具 — 從零 scaffold 並部署一個 Cloudflare 網站(含後台、資料庫、圖片上傳),再於既定架構上實作使用者要的功能:拉取骨架、供裝雲端資源、部署上線、逐項開發,全程由 AI 執行。Use when the user wants to build, create, scaffold, or launch a website or web app (booking, calendar, store, portfolio…), set up a site with an admin dashboard, or deploy a web app to Cloudflare. Triggers: 「我想建立一個網站」「幫我架站」「做一個有後台的網站」「做一個預約/排程/商店服務」「部署到 Cloudflare」, "build me a website", "scaffold a site", "deploy to cloudflare", "set up a site with a dashboard".
---

# site-builder

從零 scaffold 並上線一個網站,再於既定架構上實作功能。技術棧(t3-flare:Next.js + Cloudflare Workers + D1 + R2 + better-auth)對使用者是隱形的 —— **只問用途、不問技術名詞**。使用者只需負責:Cloudflare 帳號、綁信用卡、瀏覽器點一次 OAuth 允許;其餘的雲端操作全由你執行。

用白話溝通、一次只問一件事、做每一步前說明你要做什麼。**目標是交付一個能開的網址 + 後台帳密,而非生完檔案就停。**

## 鐵則(不可協商的順序)

無論使用者描述了什麼功能(預約系統、行事曆、商店、作品集…),一律:

1. **先完成 Phase A**:拉取 template → 供裝 Cloudflare → 部署上線
2. **才進入 Phase B**:在 template 的架構上實作使用者要的功能

**在 template 拉取完成之前,禁止建立任何專案檔案、禁止撰寫任何功能程式碼。**
理由:此 template 是唯一驗證過能部署到 Cloudflare Workers 的架構;先自建再遷移,幾乎必然做出部署不了的東西。

**禁止事項:**
- 禁止自建專案結構(`create-next-app`、手刻 HTML、其他框架)—— 只能從 template 開始
- 禁止以 localStorage / JSON 檔 / 記憶體變數保存資料 —— 結構化資料一律 Prisma + D1
- 禁止把上傳檔案存本地磁碟 —— 檔案一律 R2

**範例** — 使用者說「我想做一個讓學生預約排課的行事曆服務」:
- ✅ 正確:記下「課程、預約」需求 → 跑完 Phase A(scaffold + 部署)→ Phase B 以 Prisma model + tRPC + 頁面實作
- ❌ 錯誤:直接開始寫行事曆程式碼,之後才處理部署

唯一允許的降級:使用者的 Cloudflare 帳號尚未就緒時,可先完成 scaffold 並以 `npm run dev` 本機開發,**但仍必須從 template 開始**,並在帳號就緒後盡早補完供裝與部署。

## Phase A|起站(scaffold → 供裝 → 部署)

0. **開場說明 + 帳號準備** — 白話說明:網站放在 **Cloudflare**;基本功能(網站、資料庫)在**免費額度內、不用綁卡**;只有「上傳圖片」需綁一張信用卡(仍免費額度,平台規定)。引導註冊 [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) + `npx wrangler login`(點一次允許)。綁卡不在此強制,留到第 3 步建 R2 時再檢查。接著技術前置檢查(node/npm/git/wrangler)。見 [references/provision.md](references/provision.md)。
1. **訪談** — 白話問:網站名稱?用途?**想要哪些功能?**(記成需求清單,Phase B 逐項實作 —— 不要現在動手)要不要上傳圖片(決定 R2 與綁卡)?管理員 email 與密碼(可代生)。固定話術:「我會先把網站的地基架好、上線(幾分鐘),再開始做你的○○功能。」
2. **組裝** — `npx degit Ginz9013/t3-flare/template <dir>`;不要圖片上傳就 `bash scripts/remove-r2.sh`;`my-site` 全域改名;寫入 `.template-version`;`npm install`;`git init` + 首次 commit。見 [references/provision.md](references/provision.md)。
3. **供裝 Cloudflare** — `wrangler d1 create` → 把 id 填回 `wrangler.jsonc` 的 `PLACEHOLDER_D1_DATABASE_ID`;(有 R2)建 bucket 前確認已綁卡,失敗則白話引導開通;產 `BETTER_AUTH_SECRET` → 寫入 `.env` + 首次部署後 `wrangler secret put`。見 [references/provision.md](references/provision.md)。
4. **資料庫 + 管理員** — `npm run cf:migrate`;`gen-admin-sql.ts` 產 SQL → `wrangler d1 execute --remote --file`;網址與帳密寫進 `ADMIN.md`(已 gitignore)。見 [references/provision.md](references/provision.md)。
5. **部署** — `npm run cf:deploy` → 取得 `https://<name>.<subdomain>.workers.dev`。見 [references/deploy.md](references/deploy.md)。
6. **驗證與交付** — curl 首頁 200、實際登入後台;失敗則 `wrangler tail` 診斷修復。給使用者:網站網址、後台網址(`/admin`)、`ADMIN.md` 位置。見 [references/deploy.md](references/deploy.md)。

## Phase B|功能實作(在 template 軌道上)

Phase A 驗證通過後,依訪談的需求清單**逐項**實作。每一項都走同一條軌道:**Prisma model → 遷移(雙軌)→ tRPC router → 頁面 → 本機預覽 → 使用者點頭 → 部署** —— 完整步驟與資料存放規則見 [references/build-features.md](references/build-features.md)。

- 部落格 / 文章需求 → 直接使用現成的 **add-blog** skill(`skills/add-blog/`),不要重造。
- 日常維護(改文案、重設密碼、備份、自訂網域)→ 見 [references/maintain.md](references/maintain.md)。

## 非適用情境

- **既有專案的部署**:本工具僅支援「從 template 建立新站」。使用者若有現成專案想部署到 Cloudflare,白話說明此工具不適用,勿嘗試把 template 架構硬套到既有程式碼上。
- 用 site-builder 建立的專案不在此限 —— 那是日常維護(maintain.md)。

## 護欄(務必遵守)

- **破壞性 D1 操作前先備份**:改 schema、刪資料前先 `wrangler d1 export <name> --remote --output backup.sql`。D1 沒有好用的 rollback,使用者不會救資料。
- **改動前先 commit**:git 可用時,每個里程碑與每次「使用者請求的修改」前自動 commit(白話說「我先存個檔」,不對使用者提 git)。git 未裝則主動提議代裝,拒絕就繼續走,僅在高風險修改前警告「這次沒有後悔藥」。
- **費用透明**:預設走免費額度與 `workers.dev` 子網域;R2 需綁卡、Workers Paid 有門檻 —— 在訪談階段講清楚。
- **機密不外洩**:`BETTER_AUTH_SECRET`、密碼等不要複述在對話裡;帳密只落在 `ADMIN.md`。
- **預覽再上線**:修改預設先 `npm run dev` 本機預覽,使用者點頭才部署;明說「直接上」才跳過。

## 關鍵事實(易錯處)

- `BETTER_AUTH_SECRET` 是 **build 時(`.env`)與 runtime(`wrangler secret put`)都要**:`next build` 在 production 會驗證 env,少了 `.env` 會 build 失敗。
- 正式 D1 **跑不了 node seed**;管理員一律用 `gen-admin-sql.ts` 產 SQL + `wrangler d1 execute --remote` 套用。
- `database_id` 起始是 `PLACEHOLDER_D1_DATABASE_ID`,**務必**用 `wrangler d1 create` 回傳的真實 id 取代,否則部署連不到 DB。
- 使用 `Ginz9013/t3-flare/template` 的 **main** 版;裁切邏輯讀專案內的 `modules.md`,不要硬記。
