---
name: delete-site
description: Delete and clean up a website built with site-builder along with all of its Cloudflare resources (Worker, D1 database, R2 storage), done entirely through wrangler by the AI on the user's behalf so they never have to enter the Cloudflare dashboard. Use when the user wants to delete, remove, tear down, cancel, or shut down a website / project / deployment they created. Triggers: "delete my site", "cancel this project", "take this site down", "remove the deployment", "I don't want this site anymore", "delete my site", "tear down my project", "remove the deployment", "shut it down".
---

# delete-site

Delete all of a website's Cloudflare resources. This is a **destructive and irreversible** operation — your job is to make it safe: explain the consequences clearly, get the user's explicit consent, delete only the resources that belong to this project, and never touch other projects.

## 0. Confirm which site to delete

Get the site's name (slug) — when site-builder creates a site, the Worker / D1 / R2 all use **the same slug**.

- **If inside the project folder** (`wrangler.jsonc` exists): read from it
  - Worker name = top-level `name`
  - D1 name = `d1_databases[0].database_name`
  - R2 bucket name = `r2_buckets[0].bucket_name` (this field is absent if the project had R2 removed)
- **If not inside the project / the project is already deleted**: ask the user in plain language for the site name (that is, the slug) — all three resources share the same name.

Run `npx wrangler whoami` to confirm you're logged into the correct Cloudflare account.

## 1. Take inventory and show it to the user

Cross-check against the resources that actually exist (skip ones that don't; don't treat them as errors):

```bash
npx wrangler d1 list        # look for <slug>
npx wrangler r2 bucket list # look for <slug>
```

List the "about to be deleted" items in plain language, for example:
- Website (Worker): `<slug>` — the live URL will stop working immediately
- Database (D1): `<slug>` — all content data (articles, bookings…) is gone with it
- Image storage (R2): `<slug>` — uploaded images are gone with it

## 2. Warning + explicit confirmation (do not skip)

State it plainly:

> This **permanently deletes** your entire website and all the data inside it (content entered in the admin, uploaded images), with **no way to recover it**.

**You must get explicit confirmation before acting**. To avoid deleting the wrong thing, have the user repeat the site name to confirm — for example, ask them to reply "confirm delete `<slug>`". **Do not run any delete command** until the user has explicitly agreed.

## 3. (Strongly recommended) Back up first

Proactively ask the user whether they'd like to save a copy of the data first, in case they change their mind later:

```bash
npx wrangler d1 export <slug> --remote --output <slug>-backup.sql
```

R2 images can't be batch-exported with wrangler; if the user cares a lot, remind them they can download them first from the Cloudflare R2 dashboard.

## 4. Delete (Worker → D1 → R2)

Run these one by one; if any item doesn't exist, skip it and continue to the next. **Delete the Worker first** (the site goes offline immediately):

```bash
npx wrangler delete --name <slug>       # delete the Worker (including its secrets)
npx wrangler d1 delete <slug>           # delete D1 (the data goes with it)
npx wrangler r2 bucket delete <slug>    # delete R2 (bucket must be empty)
```

**Handling a non-empty R2** (`bucket delete` fails when the user has uploaded images): wrangler can't batch-empty a bucket from the CLI (there's no list / batch delete). Don't let this block the flow — tell the user in plain language to pick one of two options:

- **Keep it** (recommended): the storage is within the free tier and doesn't affect the deletion; the site and database are already deleted, and leaving an empty shell bucket costs nothing.
- **Delete it fully**: go to the Cloudflare dashboard → R2 → the bucket → "Empty bucket" to clear it, then let you know, and you can run `wrangler r2 bucket delete <slug>` to finish.

(This is the only step that might require touching the dashboard, and only when images were uploaded.)

## 5. Local project folder

Ask the user whether they'd also like to delete the local project folder (`rm -rf`); keep it if not. If you made a backup in step 3, remind them where the backup file is.

## 6. Report

List the resources that were actually deleted, plus any unfinished items (such as a non-empty R2). Confirm in plain language: "Your website has been completely removed."

## Guardrails (must follow)

- **Only delete resources belonging to the `<slug>` project** — cross-check names with `wrangler d1 list` / `r2 bucket list`, and **never delete resources with any other name** (the user's account may hold other sites).
- **Never run a delete before getting explicit confirmation.** This is irreversible.
- These commands may auto-confirm via a fallback in non-interactive environments; therefore "the user's consent" must be obtained at **your layer** first, and must not rely on the command's own confirmation prompt.
