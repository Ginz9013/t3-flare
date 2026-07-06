# maintain — routine maintenance

After the project is scaffolded, the user will come back saying "help me change the copy," "add a page," "swap out a photo." These all operate inside the **existing project directory**.

## General rules

- Commit before making changes (when git is available): `git add -A && git commit -m "before: <what you're about to do>"`. If it breaks, restore with `git reset --hard HEAD~1`. To the user just say "let me save a checkpoint."
- Preview locally by default, and only go live after the user signs off. Skip the preview only when the user explicitly says "just ship it."

## Preview → go live

```bash
npm run dev          # http://localhost:3000 (uses local SQLite; the dual-mode getDb switches automatically)
```
- Have the user open `localhost:3000` to see the result. A fixed line to use: "This is the preview version; the real content you enter in the dashboard needs to be done on the live URL" (local and live D1 are two separate copies of data).
- Once satisfied, go live: `npm run cf:deploy`.

## Changing content / adding features

- Pure copy: edit the corresponding `page.tsx` / component, preview, then deploy.
- Adding a new feature or a new content type (including schema changes, a new router, a new page): always follow
  the rails in [build-features.md](build-features.md) (model → dual-track migration → tRPC → page → preview → deploy),
  and **back up first** before migrating (see below). For blog/article needs, use the ready-made `skills/add-blog/`.

## Resetting the admin password

```bash
ADMIN_EMAIL="the same email" ADMIN_PASSWORD="new password" npx tsx scripts/gen-admin-sql.ts > admin.sql
npx wrangler d1 execute <slug> --remote --file=admin.sql && rm -f admin.sql
```
The SQL does a DELETE+INSERT on the credential, overwriting the old password. Update `ADMIN.md`.

## Backup (mandatory before destructive operations)

```bash
npx wrangler d1 export <slug> --remote --output backup-$(date +%Y%m%d).sql
```
Back up before changing the schema, deleting data, or running an uncertain migration. D1 has no convenient rollback.

## (Optional) Custom domain

Requires the user's domain to already be managed on Cloudflare (DNS onboarding). Add to `wrangler.jsonc`:
```jsonc
"routes": [{ "pattern": "example.com", "custom_domain": true }]
```
Then update `BETTER_AUTH_URL` to that domain and re-run `cf:deploy`.

## Tearing down / removing the whole site

To completely remove a site (freeing up Cloudflare resources), use the dedicated **delete-site** skill (`skills/delete-site/`) —
it covers inventorying resources, explicit confirmation, optional backup, deleting the Worker/D1/R2 one by one, and handling non-empty R2 buckets.

If you just want to rebuild under the same name: use delete-site to remove the resources first, then re-run site-builder's provisioning flow.

## Upgrade semantics

The project is a **snapshot** taken at scaffold time; improvements made to the template afterward are not applied automatically. `.template-version` records the baseline commit. When you hit a critical issue that must be fixed (e.g. an OpenNext breaking change), handle it as "a one-off surgery for this specific project" rather than building an automatic upgrade mechanism.
