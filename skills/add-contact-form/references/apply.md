# apply — add-contact-form application details

`$SKILL` = this skill's directory, `$PROJ` = the user's t3-flare project root.

## 1. Copy files

```bash
cp -R "$SKILL/files/src/." "$PROJ/src/"
npm run check:write   # align with the project's biome formatting
```
Added: `src/server/api/routers/contact.ts`, `src/server/email.ts`, `src/server/email-templates.ts`,
`src/app/contact/**` (public form), and `src/app/admin/(dashboard)/contacts/**` (admin inbox).

## 2. Prisma schema

Append the `Contact` model from `files/fragments/contact.prisma` to the end of `prisma/schema.prisma`.
(No User relation, so no reverse field needs to be added to User.)

## 3. env.js (mandatory, otherwise the build fails)

`ContactForm` reads `env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `email.ts` reads `env.CONTACT_FROM_EMAIL`;
without the corresponding schema fields, the build will error. Add the following in three places in `src/env.js`:

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
(All optional — it builds even when left blank; each feature is enabled only once its value is set.)

## 4. Register the router (src/server/api/root.ts)

```ts
import { contactRouter } from "~/server/api/routers/contact";
// ...
export const appRouter = createTRPCRouter({
  contact: contactRouter, // ← added
  post: postRouter,
});
```

## 5. Admin navigation (app-sidebar.tsx)

Add one item to `navItems`, and make sure `Mail` is imported from `lucide-react`:
```ts
{ title: "Contacts", href: "/admin/contacts", icon: Mail },
```

## 6. Migration (local + D1)

```bash
git add -A && git commit -m "before: add contact form"
npx prisma migrate dev --name add_contact          # local migration + regenerate client
npx prisma generate                                # ensure the client includes contact / setting

LATEST=$(ls -dt prisma/migrations/*_add_contact | head -1)
NEXT=$(printf "%04d" $(( $(ls prisma/d1-migrations/*.sql | wc -l) + 1 )))
cp "$LATEST/migration.sql" "prisma/d1-migrations/${NEXT}_add_contact.sql"

npx wrangler d1 export <slug> --remote --output backup-before-contact.sql
npm run cf:migrate
```

## 7. Deploy + verify the core

```bash
npm run cf:deploy
```
Open `/contact` and send a test message → go to `/admin/contacts` and you should see the entry, be able to click it open, view it, change its status, and reply via mailto.
(At this point the Turnstile widget won't appear and no email is sent — that's expected; the core relies on D1 alone.)

---

## Optional A: Turnstile bot protection

1. Cloudflare dashboard → Turnstile → add a widget, entering your `*.workers.dev` (or custom domain) as the domain. Get the **Site Key** (public) and **Secret Key**.
2. The Site Key is inlined at build time; write it into `.env`: `NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x..."`.
3. The Secret is runtime: `printf '%s' "0x<secret>" | npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. `npm run cf:deploy`. After that the form shows verification and the backend runs siteverify.

## Optional B: Email notifications (requires a verified domain)

Prerequisite: the user has a domain and is willing to do the Cloudflare Email domain onboarding. A bare workers.dev cannot send mail → skip this section and use the inbox only.

1. Complete Cloudflare Email Sending domain verification (DNS records). The sender address must be an address under that domain.
2. Add a binding at the top level of `wrangler.jsonc`:
   ```jsonc
   "send_email": [{ "name": "EMAIL" }]
   ```
3. Set the environment variables:
   - `.env` / build: not needed (the email values are not NEXT_PUBLIC).
   - runtime: `CONTACT_FROM_EMAIL` (the verified sender address, e.g. `hello@yourdomain.com`) and `CONTACT_NOTIFY_EMAIL` (the inbox that should receive notifications) — use `wrangler secret put` or put them in `wrangler.jsonc`'s `vars` (non-secret values can go in vars).
4. `npm run cf:deploy`. After that, each new message sends a notification email to `CONTACT_NOTIFY_EMAIL` (replies go straight back to the visitor). A send failure does not prevent the message from being stored.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build says `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `CONTACT_FROM_EMAIL` doesn't exist | Step 3 env.js wasn't fully added — add all three places |
| Build says `contact` doesn't exist on the prisma client | Run `npx prisma generate`, then build again |
| Submitting keeps saying verification failed | The site key and secret don't match, or the secret wasn't set via `wrangler secret put` |
| No email received | Domain onboarding not finished / `send_email` binding not added / `CONTACT_FROM_EMAIL` is not a verified address. The inbox still has the message |
| Public form keeps blocking (too many) | The rate limit is 3 messages per 10 minutes from the same IP — that's expected |
