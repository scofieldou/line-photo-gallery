# 🛠️ LINE Auto Gallery 完整部署教學

跟著以下步驟，你也可以免費且輕鬆地架設屬於自己的 LINE 群組自動相簿。

---

## 步驟一：設定 Google Drive (圖床)
1. 登入你的 [Google Drive](https://drive.google.com/)。
2. 建立一個新的資料夾（例如命名為 `LINE_Photos`）。
3. 對該資料夾點擊右鍵 ➡️ **共用**。將「一般存取權」改為 **「知道連結的任何人」** (權限為檢視者)。
4. 進入該資料夾，查看網址列，複製 `/folders/` 後面的**資料夾 ID**（一長串英數代碼）。

---

## 步驟二：申請 LINE 機器人
1. 登入 **[LINE Official Account Manager](https://manager.line.biz/)**。
2. 點擊「建立官方帳號」，填寫必填資料完成建立。
3. 進入帳號後台，點擊右上角「設定」 ➡️ 左側選單「Messaging API」 ➡️ 點擊「啟用 Messaging API」。
4. 選擇或建立一個 Provider，並同意條款。
5. 前往 **[LINE Developers Console](https://developers.line.biz/)**，進入你剛才建立的 Channel。
6. 切換到 **Messaging API** 頁籤。
7. 滑到最下方，點擊 **Issue** 產生一把 **Channel access token (long-lived)**，並將它複製下來。

---

## 步驟三：部署 Google Apps Script (後端)
1. 打開本專案的 `gas_backend.js` 檔案。
2. 找到開頭的 `CONFIG` 設定區塊，將你剛才拿到的 **LINE Token** 以及 **Google Drive 資料夾 ID** 填入對應的單引號中。
3. 登入 **[Google Apps Script](https://script.google.com/)**，點擊「新專案」。
4. 清空預設程式碼，將 `gas_backend.js` 的所有內容貼上去並存檔。
5. 點擊右上角「部署」 ➡️ **新增部署作業**。
6. 點擊齒輪圖示選擇 **網頁應用程式 (Web app)**。
7. 「執行身分」設定為你自己，「誰可以存取」**務必設定為「所有人 (Anyone)」**。
8. 點擊部署（初次部署需授權），完成後複製 **網頁應用程式網址 (Web app URL)**。

---

## 步驟四：綁定 Webhook 並取得目標 ID
1. 回到 **LINE Developers Console** 的 Messaging API 頁面。
2. 在 **Webhook settings** 中，貼上你剛剛複製的 Web app URL 並點選 Update。
3. 確保 **Use webhook** 開關為開啟狀態。
4. 到 LINE 官方帳號管理後台的「回應設定」，將「自動回應訊息」停用，並確認「允許加入群組」為啟用。
5. 將機器人邀請進你的目標 LINE 群組。
6. 請那位「你想要自動存他照片的人」，在群組內輸入：`!找ID`。
7. 機器人會回覆他的 User ID 與群組的 Group ID。
8. 將這兩組 ID 補填回你 Google Apps Script 程式碼的 `CONFIG` 中。
9. **重要**：再次點擊「部署」 ➡️ 「管理部署作業」 ➡️ 編輯(鉛筆) ➡️ 版本選擇 **「建立新版本」** ➡️ 部署。

---

## 步驟五：部署 GitHub Pages (前端網頁)
1. 打開本專案的 `script.js` 檔案。
2. 在第二行 `GAS_API_URL` 處，填入你 Google Apps Script 的 Web app URL。
3. 登入 **[GitHub](https://github.com/)**，建立一個新的 Repository (Public)。
4. 將 `index.html`、`style.css`、`script.js` 這三個檔案上傳到該 Repository。
5. 點擊上方的 **Settings** ➡️ 左側選單 **Pages**。
6. 在 Build and deployment 區塊的 Branch 中，選擇 **main** 分支並 Save。
7. 等待 1~2 分鐘後，即可透過上方顯示的網址進入你的專屬畫廊！
