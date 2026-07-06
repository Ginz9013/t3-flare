# apply — add-contact-form 套用細節

`$SKILL` = 本 skill 目錄、`$PROJ` = 使用者的 t3-flare 專案根。

## 1. 複製檔案

```bash
cp -R "$SKILL/files/src/." "$PROJ/src/"
npm run check:write   # 對齊專案 biome 格式
```
新增:`src/server/api/routers/contact.ts`、`src/server/email.ts`、`src/server/email-templates.ts`、
`src/app/contact/**`(前台表單)、`src/app/admin/(dashboard)/contacts/**`(後台收件匣)。

## 2. Prisma schema

把 `files/fragments/contact.prisma` 的 `Contact` model 追加到 `prisma/schema.prisma` 尾端。
（無 User 關聯,不需在 User 加反向欄位。）

## 3. env.js（必做,否則 build 失敗）

`ContactForm` 讀 `env.NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`email.ts` 讀 `env.CONTACT_FROM_EMAIL`,
少了對應 schema 欄位 build 會報錯。於 `src/env.js` 三處各加:

**`server: { ... }`**
```js
		TURNSTILE_SECRET_KEY: z.string().optional(),
		CONTACT_FROM_EMAIL: z.string().email().optional(),
		CONTACT_NOTIFY_EMAIL: z.string().email().optional(),
```
**`client: { ... }`**
```js
		NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
```
**`runtimeEnv: { ... }`**
```js
		TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
		CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
		CONTACT_NOTIFY_EMAIL: process.env.CONTACT_NOTIFY_EMAIL,
		NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
```
（全部 optional，留空也能 build；設了才啟用對應功能。）

## 4. 註冊 router（src/server/api/root.ts）

```ts
import { contactRouter } from "~/server/api/routers/contact";
// ...
export const appRouter = createTRPCRouter({
  contact: contactRouter, // ← 新增
  post: postRouter,
});
```

## 5. 後台導覽（app-sidebar.tsx）

於 `navItems` 加一項，並確認從 `lucide-react` 匯入 `Mail`：
```ts
{ title: "Contacts", href: "/admin/contacts", icon: Mail },
```

## 6. 遷移（本機 + D1）

```bash
git add -A && git commit -m "before: add contact form"
npx prisma migrate dev --name add_contact          # 本機 migration + 重生 client
npx prisma generate                                # 確保 client 含 contact / setting

LATEST=$(ls -dt prisma/migrations/*_add_contact | head -1)
NEXT=$(printf "%04d" $(( $(ls prisma/d1-migrations/*.sql | wc -l) + 1 )))
cp "$LATEST/migration.sql" "prisma/d1-migrations/${NEXT}_add_contact.sql"

npx wrangler d1 export <slug> --remote --output backup-before-contact.sql
npm run cf:migrate
```

## 7. 部署 + 驗證核心

```bash
npm run cf:deploy
```
開 `/contact` 送一則測試訊息 → 到 `/admin/contacts` 應看到該筆、可點開檢視、改狀態、mailto 回覆。
（此時 Turnstile widget 不出現、也不會寄 email —— 屬預期,核心只靠 D1。）

---

## 選配 A:Turnstile 防 bot

1. Cloudflare 後台 → Turnstile → 新增 widget，網域填你的 `*.workers.dev`（或自訂網域）。取得 **Site Key**（公開）與 **Secret Key**。
2. Site Key 是 build 時內嵌，寫進 `.env`：`NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x..."`。
3. Secret 是 runtime：`printf '%s' "0x<secret>" | npx wrangler secret put TURNSTILE_SECRET_KEY`。
4. `npm run cf:deploy`。之後表單會出現驗證、後端會 siteverify。

## 選配 B:Email 通知（需已驗證網域）

前提:使用者有一個網域,且願意做 Cloudflare Email 的網域 onboarding。裸 workers.dev 無法寄信 → 跳過此段,只用收件匣。

1. 完成 Cloudflare Email Sending 的網域驗證（DNS 記錄）。寄件位址須為該網域下的位址。
2. `wrangler.jsonc` 頂層加 binding：
   ```jsonc
   "send_email": [{ "name": "EMAIL" }]
   ```
3. 設環境變數：
   - `.env` / build：不需要(email 值非 NEXT_PUBLIC)。
   - runtime:`CONTACT_FROM_EMAIL`（已驗證的寄件位址,如 `hello@yourdomain.com`）與 `CONTACT_NOTIFY_EMAIL`（要收通知的信箱）——用 `wrangler secret put` 或寫進 `wrangler.jsonc` 的 `vars`(非機密可放 vars)。
4. `npm run cf:deploy`。之後每則新訊息會寄一封通知信給 `CONTACT_NOTIFY_EMAIL`（回信直接回到訪客）。寄信失敗不影響訊息入庫。

## 疑難

| 症狀 | 處理 |
|---|---|
| build 說 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `CONTACT_FROM_EMAIL` 不存在 | 第 3 步 env.js 沒加全 —— 補上三處 |
| build 說 `contact` 不存在於 prisma client | `npx prisma generate` 後再 build |
| 送出一直說驗證失敗 | site key 與 secret 不成對,或 secret 未 `wrangler secret put` |
| 收不到 email | 網域未完成 onboarding / `send_email` binding 未加 / `CONTACT_FROM_EMAIL` 非已驗證位址。收件匣仍會有訊息 |
| 前台一直擋(too many) | 同 IP 10 分鐘上限 3 則的限流,屬預期 |
