---
name: add-blog
description: Add a blog / article system to an existing t3-flare site — tiptap rich-text editor, code highlighting, public article pages, and an admin dashboard. Use when the user wants to add a blog, articles, posts, or writing/news section to an existing t3-flare site. Triggers: "add a blog for me", "add an articles feature", "I want to write articles / a blog", "add a blog", "add articles". Run inside an already-scaffolded t3-flare project directory.
---

# add-blog

Layer an article system onto a **t3-flare project that was already built with site-builder** (Article model + tiptap editor + public /articles + code highlighting). Finish with "add files → edit schema → migrate → deploy → verify", and speak to the user in plain language without technical jargon.

## Preflight checks

1. **Confirm you're inside a t3-flare project**: `wrangler.jsonc`, `prisma/schema.prisma`, `src/server/api/root.ts`, and `src/app/admin/(dashboard)/` all exist. If not, stop and explain that this feature is added on top of an existing site.
2. **Inline images require R2**: tiptap's image insertion goes through `/api/upload` (R2). If the project removed R2 (no `src/server/r2.ts`), **the article text and code still work fully — only inline images won't**. Ask the user in plain language whether they want to add image upload (R2 requires a linked card); if not, carry on as normal.
3. **Commit before you start** (when git is available): `git add -A && git commit -m "before: add blog"`.

## Flow (details in [references/apply.md](references/apply.md))

1. **Copy files** — copy this skill's `files/src/**` to the matching paths in the project (libs, article router, admin/articles, public articles).
2. **Edit schema** — append the `Article` model from `files/fragments/article.prisma` to `prisma/schema.prisma`, and add `articles Article[]` as the reverse relation inside `model User`.
3. **Register the router** — import `articleRouter` in `src/server/api/root.ts` and add it to `appRouter` (key: `article`).
4. **Admin navigation** — add an "Articles" nav item → `/admin/articles` in `src/app/admin/(dashboard)/_components/app-sidebar.tsx`.
5. **Styles** — append `files/fragments/prose-article.css` to the end of `src/styles/globals.css`.
6. **Dependencies** — add the tiptap packages and `npm install` (see the list in apply.md).
7. **Migrate** — `npm run db:generate` (generate a local migration) → copy that migration SQL to `prisma/d1-migrations/000N_add_article.sql` → `npm run cf:migrate`.
8. **Deploy + verify** — `npm run cf:deploy`; open `/admin/articles`, add an article, publish it, and confirm `/articles` and `/articles/<slug>` render correctly (including code highlighting).

## Guardrails

- Editing the schema is a structural change — back up with `wrangler d1 export <slug> --remote --output backup.sql` before running the migration.
- After deploying, verify by **actually adding and publishing a real article**, not just looking at the home page.
- This is v1: no tags / featured / pagination — just an article list plus detail pages. Iterate if the user wants more.
