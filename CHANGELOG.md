# Changelog

本專案的變更記錄。site-builder / add-blog 以純指示檔(`skills/`)提供,由 AI 代理直接讀取,
無安裝快取;取得更新只需 `git pull`。

## 0.2.0

- **重構**: 移除 Claude plugin / marketplace 包裝(`.claude-plugin/`、`plugins/` 巢狀),
  改為 repo 根的純 `skills/` 資料夾。skill 為指示檔形式,任意具檔案/終端機能力的 AI 代理
  (Claude Code、Codex CLI、Gemini CLI…)皆可直接讀取執行,不再綁 Claude 專屬安裝機制,
  也消除了 plugin 安裝快取造成的「載到舊版」問題。
- README 安裝說明改為「讓你的 AI 代理讀取 repo 內的 `SKILL.md`」;Claude 使用者可另複製至
  `~/.claude/skills/` 常駐使用。

## 0.1.2

- **feat(skill)**: 新增 **add-blog** feature skill —— 在既有 t3-flare 專案上疊加文章系統:tiptap 富文本編輯器、程式碼高亮(lowlight,server 端渲染避免 tiptap 進 Worker bundle)、公開 `/articles` + `/articles/[slug]`、後台 `/admin/articles` CRUD、草稿預覽。v1 不含標籤/精選/分頁。
- 已用「degit template → 套用 add-blog → install → build」端到端驗證(tsc/biome/next build 全綠,文章路由完整)。

## 0.1.1

- **fix(template)**: better-auth 動態 `trustedOrigins`(信任請求自身來源)—— 修瀏覽器登入 403 Invalid origin;首次部署即可登入,免回填 URL、免二次部署。
- **fix(template)**: `prisma.config.ts` 無 `.env` 時不再 throw(修 CI `npm ci` 失敗)。
- **fix(template)**: `remove-r2.sh` 清理 `.next`/`.open-next`,避免刪 R2 後 typecheck 誤判。
- **feat(skill)**: 第 0 步加「開場說明 + 帳號準備」—— 白話介紹 Cloudflare、免費額度、綁卡時機(R2 才需卡),對非工程使用者友善。
- **feat(skill)**: `maintain.md` 加「砍掉重練 / 移除整站」(wrangler delete/d1 delete/r2 delete)。
- **docs**: 修正 marketplace.json schema、README 雙用法安裝說明。

## 0.1.0

- 初版:template(Next.js + Cloudflare Workers + D1 + R2 + Prisma adapter-d1 + tRPC + better-auth + shadcn + Biome,全功能可減法、CI 雙路徑)+ site-builder skill(訪談→供裝→部署→驗證→維護)+ marketplace 打包。
