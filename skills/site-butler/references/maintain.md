# maintain — 日常維護

專案 scaffold 後,使用者會回來說「幫我改文案」「加一頁」「換照片」。這些都在**已存在的專案目錄**內操作。

## 通則

- 動手前先 commit(git 可用時):`git add -A && git commit -m "before: <要做的事>"`。壞了用 `git reset --hard HEAD~1` 還原。對使用者只說「我先存個檔」。
- 預設先本機預覽,使用者點頭才上線。使用者明說「直接上」才跳過預覽。

## 預覽 → 上線

```bash
npm run dev          # http://localhost:3000（用本機 SQLite,雙模式 getDb 自動切換）
```
- 請使用者開 `localhost:3000` 看效果。話術固定:「這是預覽版,你在後台輸入的正式內容要到線上網址操作」(本機與線上 D1 是兩份資料)。
- 滿意後上線:`npm run cf:deploy`。

## 改內容 / 加頁面

- 純文案:改對應的 `page.tsx` / 元件。
- 加一個新的內容類型:仿 `src/server/api/routers/post.ts` + `prisma/schema.prisma` 的 Post,新增 model 後:
  ```bash
  # 本機遷移
  npm run db:generate
  # 產生對應 D1 遷移 SQL,加進 prisma/d1-migrations/000N_xxx.sql,再 cf:migrate
  npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
    --to-schema prisma/schema.prisma --script   # 視情況用 diff 產生增量
  ```
  改 schema 屬結構變更 —— **先備份**(見下)。

## 重設管理員密碼

```bash
ADMIN_EMAIL="同一個email" ADMIN_PASSWORD="新密碼" npx tsx scripts/gen-admin-sql.ts > admin.sql
npx wrangler d1 execute <slug> --remote --file=admin.sql && rm -f admin.sql
```
SQL 是 DELETE+INSERT credential,會覆蓋舊密碼。更新 `ADMIN.md`。

## 備份(破壞性操作前必做)

```bash
npx wrangler d1 export <slug> --remote --output backup-$(date +%Y%m%d).sql
```
改 schema、刪資料、跑不確定的 migration 前都先備份。D1 沒有好用的 rollback。

## (選配)自訂網域

需使用者的網域已在 Cloudflare 管理(DNS onboarding)。於 `wrangler.jsonc` 加:
```jsonc
"routes": [{ "pattern": "example.com", "custom_domain": true }]
```
並把 `BETTER_AUTH_URL` 更新為該網域,重新 `cf:deploy`。

## 砍掉重練 / 移除整個站

要完全移除一個站(釋放 Cloudflare 資源、避免佔用名稱與費用):

```bash
npx wrangler delete --name <slug>          # 刪除 Worker(線上網站)
npx wrangler d1 delete <slug>              # 刪除 D1 資料庫(資料一併消失,先確認)
npx wrangler r2 bucket delete <slug>       # 若當初有建 R2；bucket 需先清空物件
```

**破壞性且不可逆** —— 執行前先向使用者白話確認「這會把整個網站與所有資料刪掉,無法復原」。之後刪本機專案資料夾即可。若只是要用同名重建,刪掉這些資源後再重跑供裝流程。

## 升級語義

專案是 scaffold 當下的**快照**,template 之後的改良不自動套用。`.template-version` 記錄了基準 commit。遇到必須修的重大問題(如 OpenNext breaking change),以「針對這個專案的一次性手術」處理,不建立自動升級機制。
