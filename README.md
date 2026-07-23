# 🌟 LINE Photo Gallery (v2.0)

這是一個自動化的「**LINE 群組專屬相簿與畫廊系統**」。
只要在 LINE 群組中傳送照片或影片，系統就會自動將其分類、儲存到 Google Drive，並透過 AI 自動為相簿命名，最後在專屬的網頁畫廊中精美呈現！

## 🚀 核心功能與特色

* **📥 自動收錄檔案**：在指定的 LINE 群組中傳送照片或短影片，系統會自動攔截並上傳至專屬的 Google Drive 資料夾。
* **🤖 AI 智慧命名 (防抖機制)**：採用 Google 最新 Gemini AI 技術。當上傳完畢且靜止 5 分鐘後，系統會自動分析當天照片的內容，並為相簿取一個最貼切的名稱（例如：`2026-07-23 - 東京迪士尼快樂遊`）。
* **🎬 支援影片播放**：2.0 版全面支援 LINE 影片，並在網頁端內建漂浮播放器 (Iframe Modal)。
* **🖼️ 雙層式畫廊介面**：採用現代化 Glassmorphism (毛玻璃) 視覺設計。第一層顯示相簿牆，點擊後進入第二層顯示該相簿內的所有照片與影片。
* **🔐 免費且安全**：所有照片皆存放在您私人的 Google Drive 雲端硬碟中，不用擔心第三方圖床的隱私與容量問題。

## 🛠️ 技術架構

* **後端 (Backend)**：Google Apps Script (GAS)
* **前端 (Frontend)**：HTML5, Vanilla CSS (Glassmorphism), JavaScript
* **AI 引擎 (AI)**：Google Gemini API (gemini-flash-latest)
* **主機 (Hosting)**：GitHub Pages (免費靜態網頁代管)

## 📁 檔案結構說明

* `index.html`：畫廊首頁結構。
* `style.css`：畫廊的樣式表（毛玻璃設計、動畫與響應式排版）。
* `script.js`：負責與 GAS 後端要資料，並將照片渲染到網頁上的主程式。
* `gas_backend.js`：Google Apps Script 雲端後端程式碼，負責接收 LINE 訊息、存入雲端硬碟、設定排程與呼叫 Gemini AI。
* `Deployment_Guide.md`：本系統的詳細從零開始建置與部署教學。

---
*Powered by Google Apps Script & GitHub Pages.*
