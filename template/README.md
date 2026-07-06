# my-site

Built with [t3-flare](https://github.com/Ginz9013/t3-flare) — The T3 Stack, deployed on Cloudflare.

## Stack

Next.js App Router · OpenNext · Cloudflare Workers · D1 · R2 · Prisma (`adapter-d1`) · tRPC · better-auth · Tailwind v4 + shadcn/ui · Biome

## Local development

```bash
cp .env.example .env         # Fill in BETTER_AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run db:generate          # Create the local SQLite database and apply migrations
npm run db:seed              # Create the admin account (reads ADMIN_* from .env)
npm run dev                  # http://localhost:3000 (admin panel at /admin)
```

## Deploy to Cloudflare

Requires wrangler to be installed and logged in (`wrangler login`).

```bash
# 1. Create D1 and R2, then put the database_id into wrangler.jsonc
wrangler d1 create my-site
wrangler r2 bucket create my-site

# 2. Set the production secret
wrangler secret put BETTER_AUTH_SECRET

# 3. Apply D1 migrations + build + deploy
npm run cf:deploy
```

> If you created this project through the **site-builder** skill, the cloud steps above (creating resources, filling in the id, setting the secret, creating the admin, deploying, and verifying) are all handled for you by the AI.

## Structure

- `src/server/db.ts` — Dual-mode Prisma client (Workers→D1 / Node→better-sqlite3)
- `src/server/better-auth/` — Per-request better-auth (single admin)
- `src/server/r2.ts` + `src/app/media/` + `src/app/api/upload/` — R2 media module (optional, see `modules.md`)
- `src/app/admin/` — Admin panel (login + dashboard + Post CRUD example)
- `prisma/schema.prisma` — Schema; `prisma/d1-migrations/` — D1 migration SQL

See [`modules.md`](./modules.md) for how to add or remove optional modules.
