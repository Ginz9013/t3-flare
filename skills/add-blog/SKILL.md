---
name: add-blog
description: 在已建立的 t3-flare 網站上加一套部落格 / 文章系統 —— tiptap 富文本編輯器、程式碼高亮、公開文章頁、後台管理。Use when the user wants to add a blog, articles, posts, or writing/news section to an existing t3-flare site. Triggers: 「幫我加一個部落格」「加文章功能」「我想寫文章 / 網誌」「add a blog」「add articles」. Run inside an already-scaffolded t3-flare project directory.
---

# add-blog

在**已經用 site-builder 建好的 t3-flare 專案**上疊加一套文章系統(Article model + tiptap 編輯器 + 前台 /articles + 程式碼高亮)。以「加檔案 → 改 schema → 遷移 → 部署 → 驗證」收尾,對使用者用白話,不提技術名詞。

## 前置確認

1. **確認在 t3-flare 專案內**:存在 `wrangler.jsonc`、`prisma/schema.prisma`、`src/server/api/root.ts`、`src/app/admin/(dashboard)/`。不是的話停下來說明這個功能要在既有網站上加。
2. **圖片內嵌需要 R2**:tiptap 的插入圖片走 `/api/upload`(R2)。若專案移除了 R2(無 `src/server/r2.ts`),文章的**文字與程式碼仍完全可用,只有內嵌圖片不行**。白話問使用者要不要補上圖片上傳(R2 需綁卡),不要就照常繼續。
3. **動手前先 commit**(git 可用時):`git add -A && git commit -m "before: add blog"`。

## 流程(細節見 [references/apply.md](references/apply.md))

1. **複製檔案** — 把本 skill 的 `files/src/**` 複製到專案對應路徑(libs、article router、admin/articles、前台 articles)。
2. **改 schema** — 把 `files/fragments/article.prisma` 的 `Article` model 追加到 `prisma/schema.prisma`,並在 `model User` 內加 `articles Article[]` 反向關聯。
3. **註冊 router** — 在 `src/server/api/root.ts` 匯入 `articleRouter` 並加入 `appRouter`(key: `article`)。
4. **後台導覽** — 在 `src/app/admin/(dashboard)/_components/app-sidebar.tsx` 的 nav 加一項「文章」→ `/admin/articles`。
5. **樣式** — 把 `files/fragments/prose-article.css` 追加到 `src/styles/globals.css` 尾端。
6. **依賴** — 加 tiptap 套件並 `npm install`(見 apply.md 的清單)。
7. **遷移** — `npm run db:generate`(產本機 migration)→ 複製該 migration SQL 到 `prisma/d1-migrations/000N_add_article.sql` → `npm run cf:migrate`。
8. **部署 + 驗證** — `npm run cf:deploy`;開 `/admin/articles` 新增一篇、發佈,確認 `/articles` 與 `/articles/<slug>` 顯示正常(含程式碼高亮)。

## 護欄

- 改 schema 屬結構變更 —— 執行遷移前先 `wrangler d1 export <slug> --remote --output backup.sql` 備份。
- 部署後**實際新增並發佈一篇文章**驗證,不只看首頁。
- 本次為 v1:不含標籤 / 精選 / 分頁,單純文章列表 + 詳情。使用者要更多再迭代。
