---
name: site-builder
description: Automated site-building tool — scaffolds and deploys a Cloudflare website from scratch (with an admin dashboard, database, and image uploads), then implements the features the user wants on top of the established architecture: pull the skeleton, provision cloud resources, deploy to production, and build features one by one, all driven end-to-end by the AI. Use when the user wants to build, create, scaffold, or launch a website or web app (booking, calendar, store, portfolio…), set up a site with an admin dashboard, or deploy a web app to Cloudflare. Triggers: "I want to build a website", "help me set up a site", "make me a website with an admin dashboard", "build a booking/scheduling/store service", "deploy to Cloudflare", "build me a website", "scaffold a site", "deploy to cloudflare", "set up a site with a dashboard".
---

# site-builder

Scaffold and launch a website from scratch, then implement features on top of the established architecture. The tech stack (t3-flare: Next.js + Cloudflare Workers + D1 + R2 + better-auth) is invisible to the user — **ask only about purpose, never about technical jargon**. All the user needs to handle is: a Cloudflare account, adding a credit card, and clicking to allow OAuth once in the browser; you perform all the other cloud operations.

Communicate in plain language, ask only one thing at a time, and explain what you're about to do before each step. **The goal is to deliver a working URL + admin credentials, not to stop once the files are generated.**

## Iron rules (a non-negotiable order)

No matter what feature the user describes (booking system, calendar, store, portfolio…), always:

1. **Complete Phase A first**: pull the template → provision Cloudflare → deploy to production
2. **Only then move to Phase B**: implement the features the user wants on top of the template's architecture

**Until the template has been pulled, you are forbidden to create any project files or write any feature code.**
Reason: this template is the only architecture verified to deploy to Cloudflare Workers; building your own first and migrating later will almost certainly produce something that can't be deployed.

**Prohibited:**
- Do not build your own project structure (`create-next-app`, hand-written HTML, other frameworks) — start only from the template
- Do not store data in localStorage / JSON files / in-memory variables — structured data always goes through Prisma + D1
- Do not store uploaded files on the local disk — files always go to R2

**Example** — the user says "I want to build a calendar service where students book class sessions":
- ✅ Correct: note the "courses, bookings" requirement → run through Phase A (scaffold + deploy) → implement in Phase B with a Prisma model + tRPC + pages
- ❌ Wrong: start writing calendar code right away and deal with deployment afterward

The only permitted downgrade: when the user's Cloudflare account isn't ready yet, you may complete the scaffold first and develop locally with `npm run dev`, **but you must still start from the template**, and complete provisioning and deployment as soon as possible once the account is ready.

## Phase A | Standing up the site (scaffold → provision → deploy)

0. **Opening explanation + account setup** — In plain language explain: the website is hosted on **Cloudflare**; the basic features (website, database) fall **within the free tier and require no card**; only "image uploads" requires adding one credit card (still within the free tier, a platform requirement). Guide the user to register at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) + `npx wrangler login` (click Allow once). Adding a card is not enforced here; defer that check to step 3 when creating R2. Then run the technical prerequisite checks (node/npm/git/wrangler). See [references/provision.md](references/provision.md).
1. **Interview** — In plain language ask: website name? Purpose? **Which features do you want?** (Record these as a requirements list to implement one by one in Phase B — don't start now.) Do you want image uploads (determines R2 and the card)? Admin email and password (can be generated for them). A fixed line to use: "I'll first lay the foundation and get the site live (a few minutes), then start building your ○○ feature."
2. **Assembly** — `npx degit Ginz9013/t3-flare/template <dir>`; if no image uploads, run `bash scripts/remove-r2.sh`; rename `my-site` globally; write `.template-version`; `npm install`; `git init` + initial commit. See [references/provision.md](references/provision.md).
3. **Provision Cloudflare** — `wrangler d1 create` → fill the id back into `PLACEHOLDER_D1_DATABASE_ID` in `wrangler.jsonc`; (if R2) confirm a card has been added before creating the bucket, and if it fails, guide the user through enabling it in plain language; generate `BETTER_AUTH_SECRET` → write it to `.env` + `wrangler secret put` after the first deploy. See [references/provision.md](references/provision.md).
4. **Database + admin** — `npm run cf:migrate`; `gen-admin-sql.ts` generates SQL → `wrangler d1 execute --remote --file`; write the URL and credentials into `ADMIN.md` (already gitignored). See [references/provision.md](references/provision.md).
5. **Deploy** — `npm run cf:deploy` → obtain `https://<name>.<subdomain>.workers.dev`. See [references/deploy.md](references/deploy.md).
6. **Verify and deliver** — curl the homepage for 200, actually log into the admin dashboard; if it fails, diagnose and fix with `wrangler tail`. Give the user: the website URL, the admin URL (`/admin`), and the location of `ADMIN.md`. See [references/deploy.md](references/deploy.md).

## Phase B | Feature implementation (on the template's rails)

After Phase A passes verification, implement the interview's requirements list **one item at a time**. Every item runs the same rails: **Prisma model → migration (dual-track) → tRPC router → pages → local preview → user sign-off → deploy** — for the complete steps and data-storage rules see [references/build-features.md](references/build-features.md).

- Blog / article requirements → use the ready-made **add-blog** skill (`skills/add-blog/`) directly; don't reinvent it.
- Routine maintenance (editing copy, resetting passwords, backups, custom domains) → see [references/maintain.md](references/maintain.md).

## Non-applicable scenarios

- **Deploying an existing project**: this tool only supports "creating a new site from the template." If the user has an existing project they want to deploy to Cloudflare, explain in plain language that this tool doesn't apply, and don't try to force the template's architecture onto existing code.
- Projects created with site-builder are excluded from this limitation — those are routine maintenance (maintain.md).

## Guardrails (must be followed)

- **Back up before destructive D1 operations**: before changing the schema or deleting data, run `wrangler d1 export <name> --remote --output backup.sql` first. D1 has no convenient rollback, and the user won't be able to recover the data.
- **Commit before making changes**: when git is available, automatically commit before each milestone and before every "user-requested change" (say "let me save a checkpoint" in plain language; don't bring up git with the user). If git isn't installed, proactively offer to install it for them; if declined, carry on, warning only before high-risk changes that "there's no undo this time."
- **Cost transparency**: default to the free tier and the `workers.dev` subdomain; R2 requires a card and Workers Paid has a threshold — make this clear during the interview.
- **Don't leak secrets**: don't repeat `BETTER_AUTH_SECRET`, passwords, and the like in the conversation; credentials live only in `ADMIN.md`.
- **Preview before going live**: by default preview changes locally with `npm run dev` first, and only deploy after the user signs off; skip only when they explicitly say "just ship it."

## Key facts (common pitfalls)

- `BETTER_AUTH_SECRET` is needed **both at build time (`.env`) and at runtime (`wrangler secret put`)**: `next build` validates env in production, so a missing `.env` will fail the build.
- Production D1 **can't run a node seed**; always create the admin with `gen-admin-sql.ts`-generated SQL + `wrangler d1 execute --remote`.
- `database_id` starts as `PLACEHOLDER_D1_DATABASE_ID`, and you **must** replace it with the real id returned by `wrangler d1 create`, or the deployment won't connect to the DB.
- Use the **main** version of `Ginz9013/t3-flare/template`; read the trimming logic from the project's `modules.md`, don't hard-code it from memory.
