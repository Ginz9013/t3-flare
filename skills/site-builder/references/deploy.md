# deploy — deployment, setting the runtime secret, verification, debugging

## 5. Deploy

```bash
npm run cf:deploy
# = wrangler d1 migrations apply <slug> --remote
#   && opennextjs-cloudflare build
#   && opennextjs-cloudflare deploy
```

- The build reads `.env` to validate environment variables — confirm `BETTER_AUTH_SECRET` is in `.env` (see provision.md step 3), otherwise the build will fail.
- After a successful deploy, the output includes the URL: `https://<slug>.<subdomain>.workers.dev`. Note it down and fill it back into `ADMIN.md`.

### Set the runtime secret (after the first deploy)

`wrangler secret put` requires the worker to already exist, so run it **after the first `cf:deploy`**:

```bash
printf '%s' "$SECRET" | npx wrangler secret put BETTER_AUTH_SECRET
```

Setting the secret takes effect without a redeploy. If you're not sure `$SECRET` is still set, generate a new one, update `.env` to match, and then `secret put`.

### The origin for browser login (handled by the template out of the box)

better-auth blocks login requests whose origin isn't on the trusted list (CSRF protection). The template's better-auth config already sets `trustedOrigins` to "dynamically trust the request's own origin," so **you can log in from the browser right after the first deploy — no need to know or fill in the workers.dev URL, and no second deploy needed**.

`BETTER_AUTH_URL` is therefore not required; only when you want a "canonical public URL" for generating links should you add `"vars": { "BETTER_AUTH_URL": "https://<your-url>" }` to `wrangler.jsonc` and redeploy.

## 6. Verify (done means "it actually opens")

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<slug>.<subdomain>.workers.dev   # expect 200
```

- Open `/admin/login`, **actually log in once** with the credentials from `ADMIN.md`, and confirm you can enter the dashboard and add a Post.
- (If R2) On the "Media" page in the dashboard, upload an image and confirm it displays.

### Diagnosing failures

```bash
npx wrangler tail <slug>     # watch the Worker log live; trigger a request in another tab
```

Common issues:

| Symptom | Possible cause | Fix |
|---|---|---|
| 500 / homepage won't open | `database_id` is still the placeholder | Replace it with the real id from `wrangler d1 create` and redeploy |
| Kicked back out after login | runtime `BETTER_AUTH_SECRET` not set | `wrangler secret put BETTER_AUTH_SECRET` |
| Login returns 403 `Invalid origin` | the project's better-auth config lacks the dynamic `trustedOrigins` (older scaffold) | add `trustedOrigins` to config.ts (see the template) and redeploy |
| Login says credentials are wrong | the admin seed SQL wasn't applied successfully | re-run gen-admin-sql + `d1 execute --remote` |
| Build fails saying env is missing | `.env` lacks `BETTER_AUTH_SECRET` | add it to `.env` then `cf:deploy` |
| Image upload 500 | R2 bucket not created / binding name mismatch | `wrangler r2 bucket create <slug>`, cross-check `wrangler.jsonc` |

## 7. Handoff

Tell the user (in plain language):
- "Your website is live: `https://<slug>.<subdomain>.workers.dev`"
- "The dashboard is at URL/admin; I've saved the username and password in the project's `ADMIN.md`"
- "Whenever you want to change anything later, just tell me"

Routine maintenance → see [maintain.md](maintain.md).
