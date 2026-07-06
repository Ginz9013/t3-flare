# my-site

以 [t3-flare](https://github.com/kouhei/t3-flare) 建立 —— The T3 Stack, deployed on Cloudflare.

## Stack

Next.js App Router · OpenNext · Cloudflare Workers · D1 · R2 · Prisma（`adapter-d1`）· tRPC · better-auth · Tailwind v4 + shadcn/ui · Biome

## 本機開發

```bash
cp .env.example .env         # 填入 BETTER_AUTH_SECRET、ADMIN_EMAIL、ADMIN_PASSWORD
npm install
npm run db:generate          # 建立本機 SQLite 並套用 migration
npm run db:seed              # 建立管理員帳號（讀 .env 的 ADMIN_*）
npm run dev                  # http://localhost:3000（後台在 /admin）
```

## 部署到 Cloudflare

需要已安裝並登入的 wrangler（`wrangler login`）。

```bash
# 1. 建立 D1 與 R2，將 database_id 填入 wrangler.jsonc
wrangler d1 create my-site
wrangler r2 bucket create my-site

# 2. 設定正式環境 secret
wrangler secret put BETTER_AUTH_SECRET

# 3. 套用 D1 migration + 建置 + 部署
npm run cf:deploy
```

> 若你透過 **site-builder** skill 建立此專案，上述雲端步驟（建資源、填 id、設 secret、建管理員、部署、驗證）皆由 AI 代為完成。

## 結構

- `src/server/db.ts` — 雙模式 Prisma client（Workers→D1 / Node→better-sqlite3）
- `src/server/better-auth/` — per-request better-auth（單一管理員）
- `src/server/r2.ts` + `src/app/media/` + `src/app/api/upload/` — R2 媒體模組（可選，見 `modules.md`）
- `src/app/admin/` — 後台（login + dashboard + Post CRUD 示範）
- `prisma/schema.prisma` — schema；`prisma/d1-migrations/` — D1 遷移 SQL

可選模組的增減方式見 [`modules.md`](./modules.md)。
