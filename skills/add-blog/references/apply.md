# apply — add-blog 套用細節

以下 `$SKILL` 指本 skill 目錄、`$PROJ` 指使用者的 t3-flare 專案根。

## 1. 複製檔案

```bash
cp -R "$SKILL/files/src/." "$PROJ/src/"
npm run check:write   # 讓複製進來的檔案對齊專案的 biome 格式
```
複製後專案會多出:
- `src/lib/{slug,lowlight,tiptap-extensions,tiptap-content}.ts`、`src/lib/render-article.tsx`
- `src/server/api/routers/article.ts`
- `src/app/admin/(dashboard)/articles/**`(list / new / [id] / _components）
- `src/app/articles/**`(list / [slug] / _components）

> `files/fragments/**` 不是複製檔,是要**合併**進既有檔案(見下)。

## 2. Prisma schema

把 `files/fragments/article.prisma` 的 `Article` model 追加到 `prisma/schema.prisma` 尾端;並在既有 `model User { ... }` 內加一行:
```prisma
  articles      Article[]
```
（Prisma 關聯需雙向宣告,少了這行 `prisma generate` 會報錯。）

## 3. 註冊 router（src/server/api/root.ts）

```ts
import { articleRouter } from "~/server/api/routers/article";
// ...
export const appRouter = createTRPCRouter({
  post: postRouter,
  article: articleRouter, // ← 新增
});
```

## 4. 後台導覽（app-sidebar.tsx）

在 `navItems` 陣列加一項(擺在 Posts 之後即可),並確認有從 `lucide-react` 匯入用到的 icon（例如 `Newspaper`）:
```ts
{ title: "文章", href: "/admin/articles", icon: Newspaper },
```

## 5. 樣式（globals.css）

```bash
cat "$SKILL/files/fragments/prose-article.css" >> "$PROJ/src/styles/globals.css"
```

## 6. 依賴

於 `$PROJ` 加入(版本對齊 template 的 React 19 / Next 15 生態):
```bash
npm install \
  @tiptap/react@^3.27.1 @tiptap/pm@^3.27.1 @tiptap/starter-kit@^3.27.1 \
  @tiptap/extension-image@^3.27.1 @tiptap/extension-code-block-lowlight@^3.27.1 \
  lowlight@^3.3.0 highlight.js@^11.10.0
```
（`@tiptap/html` 非必需 —— 前台走 `render-article`,不用 tiptap 的 html 產生器。）

安裝後**務必顯式重生 Prisma client**(讓型別含 `article`;不要只依賴 postinstall,實測有時序問題):
```bash
npx prisma generate
```

## 7. 遷移（本機 + D1）

```bash
# 本機:產生並套用新 migration（會建 prisma/migrations/<ts>_add_article/）
npx prisma migrate dev --name add_article

# 取剛產生的 migration SQL，複製成下一個 D1 遷移檔（編號接續既有的 d1-migrations）
LATEST=$(ls -dt prisma/migrations/*_add_article 2>/dev/null | head -1)
NEXT=$(printf "%04d" $(( $(ls prisma/d1-migrations/*.sql | wc -l) + 1 )))
cp "$LATEST/migration.sql" "prisma/d1-migrations/${NEXT}_add_article.sql"

# 備份後套用到 remote D1
npx wrangler d1 export <slug> --remote --output "backup-before-article.sql"
npm run cf:migrate
```

`prisma generate` 會在 `npm install` 的 postinstall 重跑,產生含 `article` 的 client;若沒有,手動 `npx prisma generate`。

## 8. 部署 + 驗證

```bash
npm run cf:deploy
```
- 開 `/admin/articles` → 新增文章 → 打字 + 插入一段程式碼區塊(選語言)→ 開「發佈」→ 建立。
- 開 `/articles` 應看到該篇;點進 `/articles/<slug>` 應看到內文與**程式碼高亮**。
- 草稿(未發佈)只有登入 admin 看得到 `/articles/<slug>`,登出則 404 —— 這是預期行為。

## 疑難

| 症狀 | 處理 |
|---|---|
| build 失敗說 `article` 不存在於 prisma client | 沒跑到 `prisma generate`:`npx prisma generate` 後再 build |
| 插入圖片 500 / 上傳失敗 | 專案沒有 R2:補上 R2 或改用純文字 + 程式碼(見 SKILL 前置第 2 點) |
| Worker 太大 / build 爆 | 確認 `ArticleForm` 是用 `dynamic(..., { ssr:false })` 載入 `Editor`(勿直接 import),避免 tiptap 進 server bundle |
| `/articles` 空白 | 文章要「發佈」才會出現在公開列表;草稿不算 |
