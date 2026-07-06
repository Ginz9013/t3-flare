# build-features — 在 template 軌道上實作功能

適用時機:Phase B(起站完成後實作訪談需求),以及日後任何「幫我加一個○○功能」的請求。
**任何功能都走同一條軌道,不允許繞道。** 部落格/文章需求例外 —— 用現成的 `skills/add-blog/`,不要重造。

## 資料存放規則(不可違反)

| 需求 | 一律使用 | 禁止 |
|---|---|---|
| 結構化資料(預約、課程、名單、訂單…) | Prisma model + D1(`ctx.db`) | localStorage、JSON 檔、記憶體變數、cookie 存業務資料 |
| 上傳檔案 / 圖片 | R2(`~/server/r2.ts` 的 `putObject`,經 `/api/upload`) | 本地磁碟、base64 塞進 DB |
| 登入 / 權限 | 既有 better-auth;後台寫入用 `protectedProcedure` | 自製 session、明文密碼、無權限的寫入端點 |
| 前台公開讀取 | `publicProcedure` | 把 admin 資料整包送到前端再過濾 |

## 軌道:每個功能一輪(以下依序,不可跳步)

### 1. 資料模型 — `prisma/schema.prisma`

仿照既有 `Post` model 的風格新增 model;關聯 `User` 時記得在 `model User` 內補反向欄位(Prisma 關聯必須雙向宣告)。

### 2. 遷移(雙軌:本機 + D1)

```bash
git add -A && git commit -m "before: add <feature>"     # 護欄:先存檔
npx prisma migrate dev --name add_<feature>              # 本機 migration + 重生 client

# 複製同一份 SQL 為下一個 D1 遷移檔(編號接續 prisma/d1-migrations/ 既有檔案)
LATEST=$(ls -dt prisma/migrations/*_add_<feature> | head -1)
NEXT=$(printf "%04d" $(( $(ls prisma/d1-migrations/*.sql | wc -l) + 1 )))
cp "$LATEST/migration.sql" "prisma/d1-migrations/${NEXT}_add_<feature>.sql"

# 備份後套用到正式資料庫
npx wrangler d1 export <name> --remote --output backup-before-<feature>.sql
npm run cf:migrate
```

若型別沒更新(`ctx.db.<model>` 不存在),手動 `npx prisma generate`。

### 3. API — `src/server/api/routers/<feature>.ts`

以 tRPC 建 router(範本:`src/server/api/routers/post.ts`):公開讀取用 `publicProcedure`,任何寫入/管理用 `protectedProcedure`。寫完在 `src/server/api/root.ts` 匯入並註冊進 `appRouter`。

### 4. 介面

- **後台管理頁**:`src/app/admin/(dashboard)/<feature>/` —— 仿 `posts/` 的 CRUD 模式(page + `_components/`),並在 `_components/app-sidebar.tsx` 的 `navItems` 加一項。
- **前台頁**:`src/app/<feature>/` —— server component 經 `~/trpc/server` 取數;互動部分(表單、按鈕)拆 client component 用 `~/trpc/react`。
- UI 一律用現成 `~/components/ui/*`(shadcn),不要引入其他 UI 庫。

### 5. 預覽 → 部署

```bash
npm run dev        # 請使用者開 localhost:3000 驗收(本機為獨立測試資料)
npm run cf:deploy  # 使用者點頭後上線
```

部署後在**正式網址**實際操作一次該功能(建一筆資料、走一次使用者流程)才算完成。

## 範例:「學生預約排課」怎麼落在軌道上

1. **model**:`Course`(title、teacher、capacity、startsAt)與 `Booking`(courseId 關聯、studentName、email、createdAt,`@@unique([courseId, email])` 防重複預約)
2. **遷移**:`add_booking` 走上面的雙軌流程
3. **router**:`course.list`(public,只列未過期)、`booking.create`(public,交易內檢查額滿)、`course.*` CRUD 與 `booking.list`(protected,後台用)
4. **介面**:前台 `/courses` 列表 + 預約表單;後台 `admin/courses` 管理課程與查看預約名單
5. 預覽 → 部署 → 在正式站實際預約一筆驗證

任何看起來「前端就能做掉」的狀態(例:已選課程、報名名單),只要**關掉瀏覽器後還需要存在**,就屬於結構化資料 → 進 D1,沒有例外。
