# Changelog

版本號對應 `plugin.json` / `marketplace.json` 的 `version`。改動 skill 或 template 後 bump 版本,
安裝端才會建新的 cache 目錄、確實抓到更新(cache 以版本號為 key)。

## 0.1.1

- **fix(template)**: better-auth 動態 `trustedOrigins`(信任請求自身來源)—— 修瀏覽器登入 403 Invalid origin;首次部署即可登入,免回填 URL、免二次部署。
- **fix(template)**: `prisma.config.ts` 無 `.env` 時不再 throw(修 CI `npm ci` 失敗)。
- **fix(template)**: `remove-r2.sh` 清理 `.next`/`.open-next`,避免刪 R2 後 typecheck 誤判。
- **feat(skill)**: 第 0 步加「開場說明 + 帳號準備」—— 白話介紹 Cloudflare、免費額度、綁卡時機(R2 才需卡),對非工程使用者友善。
- **feat(skill)**: `maintain.md` 加「砍掉重練 / 移除整站」(wrangler delete/d1 delete/r2 delete)。
- **docs**: 修正 marketplace.json schema、README 雙用法安裝說明。

## 0.1.0

- 初版:template(Next.js + Cloudflare Workers + D1 + R2 + Prisma adapter-d1 + tRPC + better-auth + shadcn + Biome,全功能可減法、CI 雙路徑)+ site-butler skill(訪談→供裝→部署→驗證→維護)+ marketplace 打包。
