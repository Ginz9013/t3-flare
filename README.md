# t3-flare

[繁體中文](README.zh-TW.md) ｜ **English**

> The T3 Stack, deployed on Cloudflare — by you or by your AI.

t3-flare lets you build and deploy a complete website — with a content management dashboard — through a conversation with an AI. From creating the database and configuring the server to going live, every cloud operation is performed automatically by the AI, with no code to write.

The project ships a battle-tested website skeleton plus **site-builder**, an automated site-building tool run by an AI agent that walks you through the whole process from zero to live.

---

## Architecture

Your site is built with the following stack and deployed to [Cloudflare](https://www.cloudflare.com/):

| Layer | Technology |
|---|---|
| Frontend framework | Next.js (App Router), React 19 |
| Deployment | Cloudflare Workers (via OpenNext) |
| Database | Cloudflare D1 (SQLite), Prisma |
| File storage | Cloudflare R2 |
| API | tRPC |
| Authentication | better-auth (single admin) |
| UI | Tailwind CSS v4, shadcn/ui, lucide-react |

What you get:

- A public website at a URL like `https://<name>.workers.dev`
- An admin dashboard you can log into to manage content (`/admin`)
- Optional features: image upload, a blog/article system (tiptap editor with code highlighting)

**Cost**: the website and database run within Cloudflare's free tier — no payment or credit card required. The image-upload feature requires a credit card on your Cloudflare account (per Cloudflare's platform rules), though it still falls within the free tier.

---

## Prerequisites

You need two things to get started.

### 1. A Cloudflare account

Your site is deployed to Cloudflare, so first sign up for a free account at **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)** — just an email and password; no credit card needed to register.

> A credit card is only required if you enable the image-upload feature; the assistant will prompt you when the time comes.

### 2. An AI coding agent

site-builder is provided as instruction files and needs an AI coding agent with terminal and file access to run it — for example **[Claude Code](https://www.claude.com/product/claude-code)**, OpenAI Codex CLI, or Gemini CLI. Install and sign in to one of them first.

---

## Loading site-builder

site-builder is a set of instruction files under `skills/site-builder/` in this repo; there is nothing extra to install. Just point your AI agent at it and let it follow along — for example, tell it:

> Read the site-builder skill from `github.com/Ginz9013/t3-flare` (`skills/site-builder/SKILL.md`) and help me build a website.

Any agent that can read files will fetch and follow the instruction file on its own.

---

## Building your site

### Step 1: Create a project folder

```bash
mkdir my-website
cd my-website
```

Open your AI agent in this folder.

### Step 2: Start site-builder

Just say:

> I want to build a website

You can also describe the purpose directly, e.g. "I want to build a portfolio website."

### Step 3: Follow the build flow

The assistant guides you through the following steps in order:

1. **Explanation and authorization** — the assistant explains the process and costs, then guides you to authorize its access to your Cloudflare account. Authorization is a single confirmation in the browser — the only step you perform yourself.
2. **Requirements** — the assistant asks for the site name, its purpose, whether you need image upload, and the email and password for the admin account (the password can be generated for you).
3. **Automated build and deploy** — the assistant automatically creates the database, file storage, and login system, and completes the deployment.
4. **Handoff** — when finished, it gives you the site URL, the admin URL, and your login details, which are recorded in `ADMIN.md` inside the project.

### Step 4: Log into the admin dashboard

Open the admin URL (append `/admin` to your site URL) and sign in with your login details to start managing content.

---

## Maintenance and extensions

After your site is live, any change is made the same way — through a conversation with the assistant. Open your AI agent in the project folder and describe what you want, for example:

- Edit page content or copy
- Add a blog: the assistant uses **add-blog** to add an article system (editor and article pages)
- Add a contact form: the assistant uses **add-contact-form** to add a contact page and an admin inbox (with optional Turnstile and email notifications)
- Reset the admin password
- Bind a custom domain
- Delete the whole site: the assistant uses **delete-site** to tear down all Cloudflare resources (no dashboard needed)

The assistant previews changes locally first, then updates the live site once you confirm.

---

## License

MIT
