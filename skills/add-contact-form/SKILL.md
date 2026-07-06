---
name: add-contact-form
description: Add a contact form to an existing t3-flare site — a public form, an admin inbox, Turnstile bot protection, and optional email notifications. Visitor messages are stored in D1, and the admin can view / flag / reply to them. Use when the user wants to add a contact form, an inquiry/enquiry form, a "contact me" page, or a way for visitors to message them, to an existing t3-flare site. Triggers: "add a contact form", "add a contact-me page", "let visitors contact me", "add an inquiry form", "add a contact form", "add a contact page", "let visitors message me". Run inside an already-scaffolded t3-flare project directory.

---

# add-contact-form

Add a contact form to a **t3-flare project that was already built with site-builder**. Finish with "add files → edit schema → migrate → deploy → verify", and speak to the user in plain language.

## Two-layer architecture (important)

| Layer | What it does | Requirements |
|---|---|---|
| **Core (always works)** | Public form `/contact` → stored in D1 → admin `/admin/contacts` inbox (view/status/delete/mailto reply). Includes a honeypot + IP rate limiting. | None — runs on workers.dev alone |
| **Optional A: Turnstile bot protection** | Adds Cloudflare Turnstile verification to the form | One Turnstile site key + secret (free) |
| **Optional B: Email notifications** | Emails the site owner when a new message arrives | **A verified domain** + Cloudflare Email Sending onboarding |

The code **degrades gracefully**: with no Turnstile keys set, the widget isn't shown and the backend skips verification; with no Email binding set, it only writes to D1 and sends no mail (but the inbox still receives everything). So **get the core running first**, then turn on either optional layer later when you want it.

## Preflight checks

1. Confirm you're inside a t3-flare project (`wrangler.jsonc`, `prisma/schema.prisma`, `src/server/api/root.ts` exist).
2. Commit before you start.

## Flow (details in [references/apply.md](references/apply.md))

1. **Copy files** — copy `files/src/**` to the project (contact router, email, email-templates, public `/contact`, admin `/admin/contacts`) → `npm run check:write`.
2. **Edit schema** — append the `Contact` model from `files/fragments/contact.prisma` (no User relation, so no reverse field needed).
3. **env.js** — add four **optional** environment variables: `TURNSTILE_SECRET_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL` (server), and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client). **This step is mandatory** — otherwise the build will fail to find `env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `env.CONTACT_FROM_EMAIL` (even when left blank).
4. **Register the router** — import `contactRouter` in `src/server/api/root.ts`, key: `contact`.
5. **Admin navigation** — add a "Contacts" item → `/admin/contacts` to `navItems` in `app-sidebar.tsx` (icon like `Mail`).
6. **Migrate** — `prisma migrate dev --name add_contact` → copy the SQL to `prisma/d1-migrations/000N_add_contact.sql` → `npm run cf:migrate`.
7. **Deploy + verify the core** — `npm run cf:deploy`; open `/contact`, send a test message, and confirm `/admin/contacts` receives it and lets you view it.

## Optional setup (do these only when the user wants them, see apply.md)

- **Turnstile**: in the Cloudflare dashboard, go to Turnstile and create a widget → get the site key (public) + secret → write the site key into `.env` as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (inlined at build time), and set the secret with `wrangler secret put TURNSTILE_SECRET_KEY` (runtime) → redeploy.
- **Email notifications**: **requires a verified domain**. Complete the Cloudflare Email Sending domain onboarding → add a `send_email` binding to `wrangler.jsonc` → set `CONTACT_FROM_EMAIL` (a verified sender address) and `CONTACT_NOTIFY_EMAIL` (the inbox that receives notifications) → redeploy. If the user is on a bare workers.dev with no domain, use the core only (the inbox) for now and skip email.

## Guardrails

- Before editing the schema, back up with `wrangler d1 export <slug> --remote --output backup.sql`.
- After deploying, verify by **actually sending a test message**, not just looking at the page.
- v1 does not include "auto-reply to the visitor" or its settings; iterate if needed.
