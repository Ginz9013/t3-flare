# t3-flare

> The T3 Stack, deployed on Cloudflare — by you or by your AI.

一套「Cloudflare 全家桶 + T3 Stack」的網站開案系統,包含一份實戰驗證的 template,以及一個跑在 Claude Code 裡、能全程代操 wrangler 部署的 AI skill（site-butler）。

A website scaffolding system for the Cloudflare full stack + T3 Stack — a battle-tested template plus an AI skill (site-butler) that runs inside Claude Code and drives the entire wrangler deployment for you.

## Stack

Next.js App Router · OpenNext · Cloudflare Workers · D1 · R2 · Prisma (`adapter-d1`) · tRPC · better-auth · Tailwind + shadcn/ui · Biome

## 兩種用法 / Two ways to use

### 工程師：直接拉 template

```bash
npx degit Ginz9013/t3-flare/template my-site
```

不要圖片上傳功能就 `bash scripts/remove-r2.sh`（見 [`template/modules.md`](template/modules.md)）。本機開發與部署見 [`template/README.md`](template/README.md)。

### 非工程使用者：讓 AI 幫你架站

在 Claude Code 裡安裝 site-butler,然後說「我想做一個網站」即可:

```
/plugin marketplace add Ginz9013/t3-flare
/plugin install site-butler@t3-flare
```

你只需要:一個 Cloudflare 帳號、綁信用卡、瀏覽器點一次授權;建資料庫、部署等雲端操作全由 AI 代做。

## 結構

- [`template/`](template/) — 實戰驗證的 Cloudflare + T3 骨架(全功能、可減法、CI 雙路徑驗證)
- [`plugins/site-butler/`](plugins/site-butler/) — AI 網站管家 skill
- [`docs/PLANNING.md`](docs/PLANNING.md) — 完整規劃與決策記錄

## License

MIT
