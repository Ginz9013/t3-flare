---
name: delete-site
description: 刪除並清除一個用 site-builder 建立的網站及其所有 Cloudflare 資源(Worker、D1 資料庫、R2 儲存),全程透過 wrangler 由 AI 代操,使用者不必進 Cloudflare 後台。Use when the user wants to delete, remove, tear down, cancel, or shut down a website / project / deployment they created. Triggers: 「刪除我的網站」「取消這個專案」「把這個網站砍掉」「移除部署」「不要這個網站了」, "delete my site", "tear down my project", "remove the deployment", "shut it down".
---

# delete-site

刪除一個網站的所有 Cloudflare 資源。這是**破壞性且不可逆**的操作 —— 你的職責是把它做得安全:講清楚後果、確實取得使用者同意、只刪除屬於這個專案的資源、絕不碰其他專案。

## 0. 確認要刪哪個網站

取得該網站的名稱(slug)—— site-builder 建站時 Worker / D1 / R2 用的是**同一個 slug**。

- **若在專案資料夾內**(存在 `wrangler.jsonc`):從中讀出
  - Worker 名 = 頂層 `name`
  - D1 名 = `d1_databases[0].database_name`
  - R2 bucket 名 = `r2_buckets[0].bucket_name`(專案若移除過 R2 則沒有此欄)
- **若不在專案內 / 專案已刪**:白話問使用者網站名稱(即那個 slug),三種資源同名。

用 `npx wrangler whoami` 確認已登入正確的 Cloudflare 帳號。

## 1. 盤點並列給使用者看

對照實際存在的資源(不存在的略過,不要當錯誤):

```bash
npx wrangler d1 list        # 找 <slug>
npx wrangler r2 bucket list # 找 <slug>
```

白話列出「即將刪除」清單,例如:
- 網站(Worker):`<slug>` —— 線上網址會立即失效
- 資料庫(D1):`<slug>` —— 所有內容資料(文章、預約…)一併消失
- 圖片儲存(R2):`<slug>` —— 已上傳的圖片一併消失

## 2. 警告 + 明確確認(不可略過)

用白話說清楚:

> 這會**永久刪除**你的整個網站和裡面的所有資料(後台輸入的內容、上傳的圖片),**無法復原**。

**必須取得明確確認才動手**。為避免刪錯,請使用者複誦網站名稱來確認,例如請他回覆「確認刪除 `<slug>`」。使用者未明確同意前,**不要執行任何刪除指令**。

## 3.（強烈建議）先備份

主動問使用者要不要先把資料存一份,萬一之後反悔:

```bash
npx wrangler d1 export <slug> --remote --output <slug>-backup.sql
```

R2 圖片無法用 wrangler 批次匯出;若使用者很在意,提醒可先到 Cloudflare R2 後台下載。

## 4. 刪除(Worker → D1 → R2)

逐一執行;某項不存在就略過、繼續下一項。**先刪 Worker**(網站立即下線):

```bash
npx wrangler delete --name <slug>       # 刪 Worker（含其 secrets）
npx wrangler d1 delete <slug>           # 刪 D1（資料一併消失）
npx wrangler r2 bucket delete <slug>    # 刪 R2（需為空 bucket）
```

**R2 非空的處理**(使用者上傳過圖片時 `bucket delete` 會失敗):wrangler 無法用 CLI 批次清空 bucket(沒有 list / 批次 delete)。此時**不要卡住流程**,白話告訴使用者二選一:

- **留著**(建議):空間在免費額度內、不影響刪除,網站與資料庫都已刪除,留一個空殼儲存桶沒有成本。
- **要徹底刪**:到 Cloudflare 後台 → R2 → 該 bucket → 「Empty bucket」清空後,再跟你說一聲,你就能 `wrangler r2 bucket delete <slug>` 完成。

（這是唯一可能需要碰後台的一步,且僅在有上傳圖片時才會遇到。）

## 5. 本機專案資料夾

問使用者要不要一併刪掉本機的專案資料夾(`rm -rf`);不要就保留。若之前在第 3 步做了備份,提醒備份檔的位置。

## 6. 回報

列出實際已刪除的資源,以及任何未完成的項目(如非空 R2)。用白話確認:「你的網站已經完全移除了。」

## 護欄(務必遵守)

- **只刪 `<slug>` 這個專案的資源** —— 用 `wrangler d1 list` / `r2 bucket list` 核對名稱,**絕不刪到其他名稱的資源**(使用者帳號裡可能有別的網站)。
- **未取得明確確認前,一律不執行刪除。** 這是不可逆操作。
- 這些指令在非互動環境可能會用 fallback 自動確認;因此「使用者的同意」必須在**你這一層**先取得,不能依賴指令自己的確認提示。
