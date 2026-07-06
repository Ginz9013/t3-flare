# provision — opening, prerequisite checks, interview, assembly, Cloudflare provisioning

## 0. Opening explanation + account setup

### Start with plain language (for non-engineer users, make this clear up front; don't jump into technical commands)

A suggested way to phrase it:

> I'll use a platform called **Cloudflare** to put your website online, along with an admin dashboard where you can edit the content yourself.
> On cost: the website itself and the database are both within the **free tier** — no payment and no card required.
> There's just one exception — if you want the "**image upload**" feature, Cloudflare requires you to **add a credit card** in the dashboard for that part (still the free tier, the platform just requires a card on file). I'll ask you about this in a bit.
> You only need to do one thing: **register a free account on Cloudflare**, and then I'll walk you through authorizing once — I'll handle everything else.

### Account and login

1. Have the user register a free account at **https://dash.cloudflare.com/sign-up** (email + password is enough, no card needed).
2. Authorize wrangler to use that account:
   ```bash
   npx wrangler login   # opens the browser; have the user click "Allow". This is the only technical action they need to do themselves.
   ```
3. Confirm login succeeded: `npx wrangler whoami`.

### Cost and when the card is needed (important)

- **Usable without a card**: Cloudflare account, Workers (the website), D1 (the database), and the `workers.dev` subdomain.
- **Requires a card**: R2 (image uploads) — Cloudflare requires a payment method to enable R2, even when using the free tier.
- Adding a card is **not enforced at the opening**; check for it later at step 3, once the user has confirmed they want image uploads and R2 is actually being created (see that step). A custom domain additionally requires the domain to already be managed on Cloudflare.

### Technical prerequisite checks

```bash
node -v            # requires 20+
npm -v
git --version      # missing → offer to install: macOS `brew install git`, Windows `winget install Git.Git`
npx wrangler --version
```
Use `npx wrangler` for `wrangler` (the project already includes it as a dev dependency, no global install needed).

## 1. Interview (plain language, one question at a time)

| Ask the user | Maps to |
|---|---|
| What should the website be called? | Project name / D1 name / R2 name / Worker name (lowercased + hyphenated, e.g. "Xiaoming's Store" → `xiaoming-store`) |
| What is this website for? | Homepage copy |
| Do you want to be able to upload images / photo albums? | No → remove the R2 module |
| What email and password do you want to log into the admin dashboard with? | Admin account (a strong password can be generated for them) |

Naming constraints: D1/R2/Worker names may only use lowercase letters, digits, and hyphens. Pick one slug (e.g. `xiaoming-store`) and reuse it throughout.

## 2. Assembly

```bash
npx degit Ginz9013/t3-flare/template <slug>
cd <slug>
```

- **No image uploads**: `bash scripts/remove-r2.sh` (see the project's `modules.md` for what it does).
- **Rename globally** `my-site` → `<slug>`. Where it appears: `package.json` (the name and the D1 names inside `cf:migrate`/`cf:deploy`), `wrangler.jsonc` (`name`/`database_name`/`bucket_name`), `src/app/layout.tsx` (metadata), `src/app/page.tsx`, `src/app/admin/**` (sidebar/login titles), `README.md`. You can use:
  ```bash
  grep -rl "my-site" . --exclude-dir=node_modules | xargs sed -i '' 's/my-site/<slug>/g'   # macOS
  # On Linux CI/containers use sed -i (without '')
  ```
- **Record the baseline version** (for future surgical reference):
  ```bash
  git ls-remote https://github.com/Ginz9013/t3-flare main | cut -f1 > .template-version
  ```
- Install and initialize version control:
  ```bash
  npm install
  git init -q && git add -A && git commit -q -m "initial: scaffold from t3-flare"   # when git is available
  ```

## 3. Provision Cloudflare

```bash
# D1: create the database, get the database_id from the output
npx wrangler d1 create <slug>
```
The output includes a line like `database_id = "xxxxxxxx-xxxx-..."`. **Replace `PLACEHOLDER_D1_DATABASE_ID` in `wrangler.jsonc` with this UUID** (use Edit for a precise replacement). Skipping this step means the deployment can't connect to the DB.

```bash
# R2 (if image uploads were kept) — the card checkpoint before creating the bucket
npx wrangler r2 bucket create <slug>
```
If this step fails with a message about R2 not being enabled / a payment method being required (no card added), **ask the user to handle it in plain language**:
> "The image upload feature needs to be enabled on Cloudflare first, with a card on file (still the free tier). Please go to the Cloudflare dashboard → R2, click to enable it and enter a credit card, then let me know and I'll continue."

Once the card is added, just re-run `wrangler r2 bucket create <slug>`. If the user doesn't want to add a card → switch to no image uploads, go back to step 2, run `bash scripts/remove-r2.sh`, and continue.

```bash
# BETTER_AUTH_SECRET: needed both at build time and at runtime
SECRET=$(openssl rand -base64 32)
```
Write the secret in two places:
- `.env` (at build time, `next build` validates env in production, and a missing value fails the build):
  `BETTER_AUTH_SECRET="<SECRET>"` and `BETTER_AUTH_URL="http://localhost:3000"` (use the local value for now; update it after deploy if needed).
- The runtime secret is set **after the first deploy** (see deploy.md; `wrangler secret put` requires the worker to already exist).
- You can also write `.dev.vars` (for local preview): `BETTER_AUTH_SECRET="<SECRET>"`.

> Don't paste `<SECRET>` in plaintext into the conversation.

## 4. Database migration + admin

```bash
# Apply the D1 schema
npm run cf:migrate     # = wrangler d1 migrations apply <slug> --remote

# Generate the admin seed SQL (password hashed with better-auth; production D1 can't run a node seed)
ADMIN_EMAIL="user's email" ADMIN_PASSWORD="user's password" ADMIN_NAME="Admin" \
  npx tsx scripts/gen-admin-sql.ts > admin.sql
npx wrangler d1 execute <slug> --remote --file=admin.sql
rm -f admin.sql        # contains the password hash; delete it right after applying
```

Write `ADMIN.md` (at the project root, already gitignored) to deliver to the user:
```md
# Your website
- Website URL: https://<slug>.<subdomain>.workers.dev   (fill in the actual URL after deploy)
- Admin URL: (the URL above)/admin
- Login email: ...
- Login password: ...
```

Then proceed to deployment → see [deploy.md](deploy.md).
