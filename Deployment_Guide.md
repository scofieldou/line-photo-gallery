# 🚀 從零開始：LINE 畫廊機器人部署全攻略

這份指南將帶您一步步完成「LINE 群組自動相簿機器人」的架設，並將專屬畫廊發布到 GitHub Pages。

---

## 階段一：準備工作與 LINE 機器人申請
1. **註冊 LINE 開發者帳號**：
   - 前往 [LINE Developers](https://developers.line.biz/) 控制台並登入。
   - 建立一個新的 **Provider**，然後在裡面建立一個 **Messaging API channel**（這就是您的機器人）。
   - 在 Channel settings 中，找到 `Channel access token (long-lived)` 並點擊 Issue 取得 Token。
2. **準備 Google Drive**：
   - 在您的 Google 雲端硬碟建立一個新的資料夾（例如命名為 `LINE相簿專區`）。
   - 進入資料夾，**複製網址欄最後面的亂碼**（這是 Folder ID）。
   - 將該資料夾的共用權限設定為 **「知道連結的任何人」 -> 「檢視者」**。

---

## 階段二：申請 Gemini AI 金鑰
1. 前往 [Google AI Studio - Get API Key](https://aistudio.google.com/app/apikey)。
2. 點擊 **Create API key**，並選擇一個專案來產生金鑰。
3. 複製產生的 API Key（未來提供給 AI 命名使用）。

---

## 階段三：部署 Google Apps Script (後端)
1. 前往 [Google Apps Script](https://script.google.com/)，點擊「新專案」。
2. 將專案中的 `程式碼.gs` 內容清空，並把本專案中的 `gas_backend.js` 內容全部複製貼上。
3. 在程式碼最上方的 `CONFIG` 區塊，填入您剛剛拿到的三樣東西：
   - `LINE_CHANNEL_TOKEN`
   - `DRIVE_FOLDER_ID`
   - `GEMINI_API_KEY`
4. **發布為 Webhook**：
   - 點擊右上角「部署」 ➡️ 「新增部署作業」。
   - 類型選擇 **網頁應用程式 (Web App)**。
   - 執行身分選 **「我」**，誰可以存取選 **「所有人」**，點擊部署。
   - 第一次部署會跳出「需要授權」，請點擊「進階 -> 允許」。
   - 部署完成後，您會得到一串 **「網頁應用程式網址 (Web App URL)」**。

---

## 階段四：綁定 Webhook 與設定防抖計時器
1. **綁定 LINE Webhook**：
   - 回到 LINE Developers 控制台的 Messaging API 設定頁。
   - 找到 `Webhook URL` 欄位，填入剛才拿到的「網頁應用程式網址」。
   - 開啟 `Use webhook` 功能。
   - 把機器人邀請進您的 LINE 目標群組。
2. **手動設定 AI 命名警衛 (Trigger)**：
   - 回到 Google Apps Script，點擊左側時鐘圖示 **「觸發條件」**。
   - 點擊新增觸發條件，設定為：
     - 功能：`triggerAiNaming`
     - 來源：`時間驅動`
     - 類型：`分鐘計時器`
     - 間隔：`每 10 分鐘`
   - 點擊儲存。這樣您的防抖自動命名系統就完成了！

---

## 階段五：前端網頁部署至 GitHub Pages
1. 在本機電腦中，將 `script.js` 打開，把第 4 行的 `GAS_API_URL` 替換成剛剛的 **「網頁應用程式網址 (Web App URL)」**。
2. 前往您的 GitHub 帳號，建立一個新的 Repository（例如 `line-photo-gallery`）。
3. 點擊 **Upload files**，將以下 5 個檔案拖曳上傳：
   - `index.html`
   - `style.css`
   - `script.js`
   - `gas_backend.js` (備份用)
   - `README.md` 和 `Deployment_Guide.md` (說明文件)
4. 點擊 `Commit changes` 進行存檔。
5. **開啟網頁代管功能**：
   - 點擊 GitHub 倉庫上方的 **Settings** 標籤。
   - 左側選單點擊 **Pages**。
   - 在 Source 選擇 `Deploy from a branch`，Branch 選擇 `main` (或 `master`)，然後點擊 **Save**。
6. 等待約 1~2 分鐘，畫面上方就會出現您專屬的畫廊網址（例如 `https://您的帳號.github.io/line-photo-gallery/`）。

🎉 **恭喜您！您的 LINE 群組專屬畫廊正式上線！**
