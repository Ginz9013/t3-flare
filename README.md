# t3-flare

> The T3 Stack, deployed on Cloudflare — by you or by your AI.

t3-flare 讓你透過 AI 對話，建立並部署一個具備內容管理後台的完整網站。從資料庫建立、伺服器設定到上線部署，所有雲端操作皆由 AI 助理自動執行，過程中無需撰寫程式碼。

專案包含一套經實戰驗證的網站骨架，以及運行於 Claude Code 的 AI 網站助理 **site-butler**，協助你完成從零到上線的完整流程。

---

## 技術架構

網站採用下列技術棧，並部署至 [Cloudflare](https://www.cloudflare.com/)：

| 層面 | 技術 |
|---|---|
| 前端框架 | Next.js（App Router）、React 19 |
| 部署平台 | Cloudflare Workers（透過 OpenNext） |
| 資料庫 | Cloudflare D1（SQLite）、Prisma |
| 檔案儲存 | Cloudflare R2 |
| API | tRPC |
| 身分驗證 | better-auth（單一管理員） |
| 使用者介面 | Tailwind CSS v4、shadcn/ui、lucide-react |

建置成果包含：

- 一個公開網站，網址形式為 `https://<名稱>.workers.dev`
- 一個可登入管理內容的後台（`/admin`）
- 選用功能：圖片上傳、部落格文章系統（tiptap 編輯器與程式碼高亮）

**費用說明**：網站與資料庫運行於 Cloudflare 免費額度內，無需付費或綁定信用卡。圖片上傳功能因 Cloudflare 平台規範，需於帳號綁定信用卡，惟同樣適用免費額度。

---

## 事前準備

開始前需具備以下兩項條件。

### 1. Cloudflare 帳號

網站將部署於 Cloudflare。請先至 **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)** 註冊免費帳號，僅需 email 與密碼，註冊無需綁定信用卡。

> 綁定信用卡僅在啟用圖片上傳功能時需要，助理會於適當時機提示。

### 2. Claude Code

site-butler 運行於 **[Claude Code](https://www.claude.com/product/claude-code)**。請先安裝並登入 Claude Code，其提供桌面版、VSCode 擴充套件與終端機介面。

---

## 安裝 site-butler

於 Claude Code 介面中（非一般終端機）執行下列指令：

```
/plugin marketplace add Ginz9013/t3-flare
/plugin install site-butler@t3-flare
```

第一行將 t3-flare 加入外掛來源，第二行安裝 site-butler。安裝完成後可能需重新啟動 Claude Code。

---

## 建立網站

### 步驟一：建立專案資料夾

```bash
mkdir my-website
cd my-website
```

於此資料夾中開啟 Claude Code。

### 步驟二：啟動 site-butler

輸入以下訊息即可啟動助理：

> 我想建立一個網站

亦可直接描述用途，例如「我想建立一個作品集網站」。

### 步驟三：完成建置流程

助理將依序引導你完成下列步驟：

1. **說明與授權** — 助理會說明流程與費用，並引導你授權其存取 Cloudflare 帳號。授權透過瀏覽器完成一次確認，為整個流程中唯一需要你親自操作的步驟。
2. **需求確認** — 助理會詢問網站名稱、用途、是否需要圖片上傳功能，以及後台管理帳號的 email 與密碼（密碼亦可由助理產生）。
3. **自動建置與部署** — 助理自動建立資料庫、檔案儲存空間與登入系統，並完成部署。
4. **交付** — 完成後提供網站網址、後台網址與登入資訊，登入資訊會記錄於專案中的 `ADMIN.md`。

### 步驟四：登入後台

開啟後台網址（於網站網址後加上 `/admin`），以登入資訊進入後即可管理內容。

---

## 後續維護與擴充

網站上線後，各項調整同樣透過與助理對話完成 —— 於專案資料夾中開啟 Claude Code 並描述需求即可，例如：

- 修改頁面內容或文案
- 新增部落格：助理透過 **add-blog** 為網站加入文章系統（含編輯器與文章頁）
- 重設後台密碼
- 綁定自訂網域

助理會先於本機提供預覽，經你確認後再更新至線上。

---

## License

MIT
