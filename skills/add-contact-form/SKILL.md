---
name: add-contact-form
description: 在已建立的 t3-flare 網站上加一個聯絡表單 —— 前台表單、後台收件匣、Turnstile 防 bot,並可選配 Email 通知。訪客送出的訊息存進 D1,後台可檢視/標記/回覆。Use when the user wants to add a contact form, an inquiry/enquiry form, a "contact me" page, or a way for visitors to message them, to an existing t3-flare site. Triggers: 「加聯絡表單」「加聯絡我頁面」「讓訪客可以聯絡我」「加一個詢問表單」, "add a contact form", "add a contact page", "let visitors message me". Run inside an already-scaffolded t3-flare project directory.

---

# add-contact-form

在**已用 site-builder 建好的 t3-flare 專案**上加一套聯絡表單。以「加檔案 → 改 schema → 遷移 → 部署 → 驗證」收尾,對使用者用白話。

## 兩層架構(重要)

| 層 | 內容 | 需要什麼 |
|---|---|---|
| **核心(一定能用)** | 前台表單 `/contact` → 存進 D1 → 後台 `/admin/contacts` 收件匣(檢視/狀態/刪除/mailto 回覆)。含 honeypot + IP 限流。 | 無 —— workers.dev 就能跑 |
| **選配 A:Turnstile 防 bot** | 表單加上 Cloudflare Turnstile 驗證 | 一組 Turnstile site key + secret(免費) |
| **選配 B:Email 通知** | 有新訊息時寄 Email 通知站長 | **一個已驗證的網域** + Cloudflare Email Sending onboarding |

程式碼**優雅降級**:沒設 Turnstile 金鑰就不顯示 widget、後端跳過驗證;沒設 Email binding 就只寫 D1、不寄信(但收件匣照常收到)。所以**核心一定先跑起來**,兩個選配之後想開再開。

## 前置確認

1. 確認在 t3-flare 專案內(有 `wrangler.jsonc`、`prisma/schema.prisma`、`src/server/api/root.ts`)。
2. 動手前先 commit。

## 流程(細節見 [references/apply.md](references/apply.md))

1. **複製檔案** — `files/src/**` 複製到專案(contact router、email、email-templates、前台 `/contact`、後台 `/admin/contacts`)→ `npm run check:write`。
2. **改 schema** — 追加 `files/fragments/contact.prisma` 的 `Contact` model(無 User 關聯,不需反向欄位)。
3. **env.js** — 加四個**選填**環境變數:`TURNSTILE_SECRET_KEY`、`CONTACT_FROM_EMAIL`、`CONTACT_NOTIFY_EMAIL`(server)、`NEXT_PUBLIC_TURNSTILE_SITE_KEY`(client)。**這步必須做**,否則 build 找不到 `env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `env.CONTACT_FROM_EMAIL` 會失敗(即使留空)。
4. **註冊 router** — `src/server/api/root.ts` 匯入 `contactRouter`,key: `contact`。
5. **後台導覽** — `app-sidebar.tsx` 的 `navItems` 加「Contacts」→ `/admin/contacts`(icon 如 `Mail`)。
6. **遷移** — `prisma migrate dev --name add_contact` → 複製 SQL 到 `prisma/d1-migrations/000N_add_contact.sql` → `npm run cf:migrate`。
7. **部署 + 驗證核心** — `npm run cf:deploy`;開 `/contact` 送一則測試訊息,確認 `/admin/contacts` 收到、可檢視。

## 選配設定(使用者要時再做,見 apply.md)

- **Turnstile**:到 Cloudflare 後台 Turnstile 建 widget → 取得 site key(公開)+ secret → site key 寫進 `.env` 的 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`(build 時內嵌)、secret 用 `wrangler secret put TURNSTILE_SECRET_KEY`(runtime)→ 重部署。
- **Email 通知**:**需要已驗證網域**。完成 Cloudflare Email Sending 網域 onboarding → `wrangler.jsonc` 加 `send_email` binding → 設 `CONTACT_FROM_EMAIL`(已驗證寄件位址)、`CONTACT_NOTIFY_EMAIL`(收通知的信箱)→ 重部署。使用者若在裸 workers.dev 上、沒有網域,就先只用核心(收件匣),不做 email。

## 護欄

- 改 schema 前先 `wrangler d1 export <slug> --remote --output backup.sql` 備份。
- 部署後**實際送一則測試訊息**驗證,不只看頁面。
- v1 不含「自動回覆訪客」與相關設定;需要再迭代。
