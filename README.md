# t3-flare

> The T3 Stack, deployed on Cloudflare — by you or by your AI.

**跟 AI 說一句「我想做一個網站」,就幫你把一個含後台的網站建好、上線。** 從建立資料庫、設定伺服器到部署，所有雲端操作都由 AI 透過指令自動完成，你不需要碰任何程式碼。

t3-flare 提供一個實戰驗證的網站骨架，以及一個跑在 Claude Code 裡的 AI 網站管家 **site-butler**，帶你從零把網站做出來並上線。

---

## 技術架構

你的網站會用以下技術棧建立並部署到 [Cloudflare](https://www.cloudflare.com/)：

| 層面 | 使用技術 |
|---|---|
| 前端框架 | Next.js（App Router）+ React 19 |
| 部署平台 | Cloudflare Workers（透過 OpenNext） |
| 資料庫 | Cloudflare D1（SQLite）+ Prisma |
| 檔案儲存 | Cloudflare R2（圖片上傳） |
| API | tRPC（型別安全） |
| 登入系統 | better-auth（單一管理員後台） |
| 介面 | Tailwind CSS v4 + shadcn/ui + lucide 圖示 |

**你會得到：**

- 一個公開的網站，網址形如 `https://你的網站.workers.dev`
- 一個可以自己登入、修改內容的**後台**（`/admin`）
- 選配：圖片上傳、部落格文章系統（tiptap 編輯器 + 程式碼高亮）

**費用：** 網站與資料庫都在 Cloudflare **免費額度**內，不需付費也不需綁卡。只有「圖片上傳」功能因 Cloudflare 規定，需要在帳號綁一張信用卡（同樣有免費額度）。

---

## 事前準備

開始之前，你需要兩樣東西：

### 1. 一個 Cloudflare 帳號

網站要放在 Cloudflare 上，所以先到 **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)** 註冊一個免費帳號（用 email + 密碼即可，註冊不需綁卡）。

> 綁卡只有在你之後選擇「圖片上傳」功能時才需要，AI 會在需要時再提醒你。

### 2. Claude Code

site-butler 是跑在 **[Claude Code](https://www.claude.com/product/claude-code)** 裡的工具。請先安裝並登入 Claude Code（桌面版、VSCode 擴充或終端機皆可）。

---

## 安裝 site-butler

在 **Claude Code 介面裡**（不是一般終端機）輸入以下兩行指令：

```
/plugin marketplace add Ginz9013/t3-flare
/plugin install site-butler@t3-flare
```

第一行把 t3-flare 加入你的外掛來源，第二行安裝 site-butler。裝好後可能需要重新開啟 Claude Code。

---

## 開始建立網站

### 步驟一：開一個空資料夾並啟動

```bash
mkdir my-website
cd my-website
```

在這個資料夾裡開啟 Claude Code。

### 步驟二：跟 AI 說你要做網站

直接輸入：

> 我想做一個網站

site-butler 就會啟動，接手接下來的所有步驟。

### 步驟三：跟著 AI 走完流程

AI 會依序帶你完成（你只需要用白話回答問題）：

1. **說明與授權** — AI 會說明整個流程與費用，並引導你授權它使用你的 Cloudflare 帳號（會開啟瀏覽器，你點一次「Allow」即可 —— 這是你唯一需要親自做的技術動作）。
2. **了解你的需求** — AI 會問幾個簡單問題：
   - 網站要叫什麼名字？
   - 這個網站是做什麼用的？
   - 需不需要「上傳圖片」的功能？
   - 想用哪個 email 和密碼登入後台？（密碼也可以請 AI 幫你產生）
3. **自動建立與部署** — 接著 AI 會自動幫你：建立資料庫、建立網站、設定登入系統、部署上線。這段你只要等它跑完。
4. **交付成果** — 完成後 AI 會給你：
   - 你的**網站網址**
   - 你的**後台網址**與**帳號密碼**（會存在專案裡的 `ADMIN.md` 檔案）

### 步驟四：登入後台、開始使用

打開 AI 給你的後台網址（網站網址後面加 `/admin`），用你的帳號密碼登入，就能開始管理內容了。

---

## 之後想改東西？

網站做好之後，任何調整都一樣 —— **在同一個資料夾開 Claude Code，直接跟 AI 說**就好：

- 「幫我把首頁的標題改成 ___」
- 「幫我加一個部落格」 → AI 會用 **add-blog** 幫你加上文章系統（含編輯器、文章頁）
- 「我忘記後台密碼了」 → AI 幫你重設
- 「幫我把網站換成我自己的網域」

AI 會先在本機讓你預覽，你滿意後才更新到線上。

---

## License

MIT
