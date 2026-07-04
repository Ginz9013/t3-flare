# provision — 前置檢查、訪談、組裝、Cloudflare 供裝

## 0. 前置檢查

```bash
node -v            # 需要 20+
npm -v
git --version      # 沒有 → 提議代裝：macOS `brew install git`、Windows `winget install Git.Git`
npx wrangler --version
npx wrangler whoami # 未登入 → 引導使用者：wrangler login 會開瀏覽器，點「Allow」即可
```

- `wrangler` 用 `npx wrangler`(專案已含 dev 依賴,不必全域安裝)。
- 若 `whoami` 顯示未登入,請使用者執行 `npx wrangler login` 並在瀏覽器點允許。這是使用者唯一需要親自做的技術動作。
- **費用**:D1、Workers 有免費額度,`workers.dev` 子網域免費。R2 需要在 Cloudflare 綁定信用卡(仍有免費額度)。若使用者要 R2 或自訂網域,先講清楚。

## 1. 訪談(白話,一次一題)

| 問使用者 | 對應到 |
|---|---|
| 網站要叫什麼名字? | 專案名 / D1 名 / R2 名 / Worker 名(轉小寫+連字號,如「小明的店」→ `xiaoming-store`) |
| 這個網站是做什麼的? | 首頁文案 |
| 要不要能上傳圖片 / 相簿? | 否 → 移除 R2 模組 |
| 想用什麼 email 和密碼登入後台? | 管理員帳號(密碼可代生強密碼) |

命名限制:D1/R2/Worker 名只能小寫英數與連字號。取一個 slug(如 `xiaoming-store`)全程共用。

## 2. 組裝

```bash
npx degit Ginz9013/t3-flare/template <slug>
cd <slug>
```

- **不要圖片上傳**:`bash scripts/remove-r2.sh`(內容見專案 `modules.md`)。
- **全域改名** `my-site` → `<slug>`。出現位置:`package.json`(name 與 `cf:migrate`/`cf:deploy` 內的 D1 名)、`wrangler.jsonc`(`name`/`database_name`/`bucket_name`)、`src/app/layout.tsx`(metadata)、`src/app/page.tsx`、`src/app/admin/**`(側欄/登入標題)、`README.md`。可用:
  ```bash
  grep -rl "my-site" . --exclude-dir=node_modules | xargs sed -i '' 's/my-site/<slug>/g'   # macOS
  # Linux CI/容器用 sed -i(無 '')
  ```
- **記錄基準版本**(供日後手術參考):
  ```bash
  git ls-remote https://github.com/Ginz9013/t3-flare main | cut -f1 > .template-version
  ```
- 安裝與初始化版控:
  ```bash
  npm install
  git init -q && git add -A && git commit -q -m "initial: scaffold from t3-flare"   # git 可用時
  ```

## 3. 供裝 Cloudflare

```bash
# D1：建立資料庫，從輸出取得 database_id
npx wrangler d1 create <slug>
```
輸出會包含一段 `database_id = "xxxxxxxx-xxxx-..."`。**用這個 UUID 取代 `wrangler.jsonc` 裡的 `PLACEHOLDER_D1_DATABASE_ID`**(用 Edit 精準替換)。少了這步部署會連不到 DB。

```bash
# R2（若保留了圖片上傳）
npx wrangler r2 bucket create <slug>

# BETTER_AUTH_SECRET：build 時與 runtime 都需要
SECRET=$(openssl rand -base64 32)
```
把 secret 寫進兩處:
- `.env`(build 時 `next build` 在 production 會驗證 env,少了會 build 失敗):
  `BETTER_AUTH_SECRET="<SECRET>"` 與 `BETTER_AUTH_URL="http://localhost:3000"`(先用本機值,部署後再視需要更新)。
- runtime secret 在**首次部署後**設定(見 deploy.md,`wrangler secret put` 需要 worker 已存在)。
- 也可寫 `.dev.vars`(本機預覽用):`BETTER_AUTH_SECRET="<SECRET>"`。

> 別把 `<SECRET>` 明文貼進對話。

## 4. 資料庫 migration + 管理員

```bash
# 套用 D1 schema
npm run cf:migrate     # = wrangler d1 migrations apply <slug> --remote

# 產生管理員 seed SQL（密碼以 better-auth 雜湊；正式 D1 跑不了 node seed）
ADMIN_EMAIL="使用者的email" ADMIN_PASSWORD="使用者的密碼" ADMIN_NAME="Admin" \
  npx tsx scripts/gen-admin-sql.ts > admin.sql
npx wrangler d1 execute <slug> --remote --file=admin.sql
rm -f admin.sql        # 含密碼 hash,套用後即刪
```

寫 `ADMIN.md`(專案根,已 gitignore)交付給使用者:
```md
# 你的網站
- 網站網址：https://<slug>.<subdomain>.workers.dev   （部署後填入實際網址）
- 後台網址：（上面網址）/admin
- 登入 email：...
- 登入密碼：...
```

接著進行部署 → 見 [deploy.md](deploy.md)。
