// ==========================================
// ⚙️ 系統設定區 (請在部署前填寫您的專屬資料)
// ==========================================
const CONFIG = {
  LINE_ACCESS_TOKEN: '',
  TARGET_GROUP_ID: '', 
  TARGET_USER_ID: '',  
  DRIVE_FOLDER_ID: '',
  GEMINI_API_KEY: ''
};

// ==========================================
// 📡 接收前端網頁的請求 (GET) - 提供相簿與照片清單
// ==========================================
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const subFolders = rootFolder.getFolders();
    const albums = [];
    
    while (subFolders.hasNext()) {
      const folder = subFolders.next();
      const folderName = folder.getName(); // 例如: 2026-07-23 - 海邊風景
      const files = folder.getFiles();
      const albumFiles = [];
      
      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();
        const fileId = file.getId();
        
        let type = 'unknown';
        let url = '';
        
        if (mimeType.indexOf('image/') !== -1) {
            type = 'image';
            url = 'https://lh3.googleusercontent.com/d/' + fileId + '=s0';
        } else if (mimeType.indexOf('video/') !== -1) {
            type = 'video';
            url = 'https://drive.google.com/file/d/' + fileId + '/preview';
        }

        if (type !== 'unknown') {
            albumFiles.push({
                name: file.getName(),
                url: url,
                type: type,
                date: file.getDateCreated().getTime() // 轉成 Timestamp 方便排序
            });
        }
      }
      
      // 檔案依照建立時間排序 (舊到新，符合瀏覽相簿習慣)
      albumFiles.sort((a, b) => a.date - b.date);
      
      if (albumFiles.length > 0) {
          albums.push({
              albumName: folderName,
              dateCreated: folder.getDateCreated().getTime(),
              coverUrl: albumFiles.find(f => f.type === 'image')?.url || albumFiles[0].url, // 優先拿照片當封面
              files: albumFiles
          });
      }
    }
    
    // 相簿依照日期排序 (最新的相簿在最上面)
    albums.sort((a, b) => b.dateCreated - a.dateCreated);
    
    output.setContent(JSON.stringify({ status: 'success', data: albums }));
  } catch (error) {
    output.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }
  return output;
}

// ==========================================
// 📩 接收 LINE 的訊息 (POST) - 攔截檔案並自動歸類
// ==========================================
function doPost(e) {
  if (typeof e === 'undefined') return;
  
  const eventData = JSON.parse(e.postData.contents);
  const events = eventData.events;
  if (!events || events.length === 0) return;
  
  // 建立 Script 鎖，防止同時傳送多張照片時發生「並發衝突 (Race Condition)」產生多個資料夾
  const lock = LockService.getScriptLock();
  
  try {
    // 最多等待 30 秒讓前一個處理程序完成
    lock.waitLock(30000);
    
    events.forEach(function(event) {
      const replyToken = event.replyToken;
      const userId = event.source.userId;
      const groupId = event.source.groupId || '非群組';
      
      if (CONFIG.TARGET_GROUP_ID !== '' && groupId !== CONFIG.TARGET_GROUP_ID) return;
      
      // 驗證 User ID (支援單一字串、逗號分隔字串，或陣列)
      if (CONFIG.TARGET_USER_ID !== '') {
        const allowedUsers = Array.isArray(CONFIG.TARGET_USER_ID) 
            ? CONFIG.TARGET_USER_ID 
            : CONFIG.TARGET_USER_ID.split(',').map(id => id.trim());
        if (!allowedUsers.includes(userId)) return;
      }
      
      if (event.type === 'message' && (event.message.type === 'image' || event.message.type === 'video')) {
        const messageId = event.message.id;
        const fileType = event.message.type;
        
        // 1. 下載檔案
        const blob = downloadFromLine(messageId);
        
        // 2. 尋找或建立今天的日期資料夾
        const now = new Date();
        const dateString = Utilities.formatDate(now, "Asia/Taipei", "yyyy-MM-dd");
        const folder = getOrCreateDateFolder(dateString);
        
        // 3. 儲存檔案
        const timestamp = Utilities.formatDate(now, "Asia/Taipei", "HHmmss");
        const ext = fileType === 'image' ? '.jpg' : '.mp4';
        blob.setName(`LINE_${fileType.toUpperCase()}_${timestamp}${ext}`);
        folder.createFile(blob);
        
        // 4. 記錄最後上傳時間與目標資料夾 ID (供固定排程每 10 分鐘檢查)
        PropertiesService.getScriptProperties().setProperty('LAST_UPLOAD_TIME', Date.now().toString());
        PropertiesService.getScriptProperties().setProperty('TARGET_AI_FOLDER_ID', folder.getId());
      }
    });
    
  } catch (error) {
    console.error("Lock error: " + error.toString());
  } finally {
    // 釋放鎖定，讓下一張照片開始處理
    lock.releaseLock();
  }
  
  return ContentService.createTextOutput("OK");
}

function downloadFromLine(messageId) {
  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + CONFIG.LINE_ACCESS_TOKEN }
  });
  return response.getBlob();
}

function getOrCreateDateFolder(dateString) {
  const rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const subFolders = rootFolder.getFolders();
  
  // 尋找開頭是該日期的資料夾 (例如 2026-07-23 或 2026-07-23 - 貓咪)
  while (subFolders.hasNext()) {
    const folder = subFolders.next();
    if (folder.getName().startsWith(dateString)) {
      return folder;
    }
  }
  
  // 沒找到就建立一個新的
  return rootFolder.createFolder(dateString);
}

// ==========================================
// 🤖 呼叫 Gemini AI 進行相簿命名 (固定每 10 分鐘執行檢查)
// ==========================================
function triggerAiNaming() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('TARGET_AI_FOLDER_ID');
  const lastUpload = props.getProperty('LAST_UPLOAD_TIME');
  
  if (!folderId || !lastUpload) return;
  
  // 檢查是否距離最後一張照片上傳已經超過 5 分鐘
  const elapsed = Date.now() - parseInt(lastUpload);
  if (elapsed < 5 * 60 * 1000) {
      console.log("上傳尚未靜止 5 分鐘，稍後再試。");
      return; 
  }
  
  const folder = DriveApp.getFolderById(folderId);
  const currentName = folder.getName();
  
  // 如果資料夾已經有名字了 (包含 " - ")，就不再重新命名，並清除 ID
  if (currentName.includes(' - ')) {
      props.deleteProperty('TARGET_AI_FOLDER_ID');
      return;
  }
  
  // 撈出資料夾裡的前 2 張照片給 AI 判斷 (避免傳送過多資料超載)
  const files = folder.getFiles();
  const base64Images = [];
  
  while (files.hasNext() && base64Images.length < 2) {
    const file = files.next();
    if (file.getMimeType().indexOf('image/') !== -1) {
       const base64 = Utilities.base64Encode(file.getBlob().getBytes());
       base64Images.push({
           "inline_data": {
               "mime_type": file.getMimeType(),
               "data": base64
           }
       });
    }
  }
  
  // 如果沒有照片(只有影片) 或 API Key 沒填，就跳過
  if (base64Images.length === 0 || CONFIG.GEMINI_API_KEY.includes('請填入')) return;
  
  // 準備呼叫最新的 Gemini Flash API
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  
  const payload = {
    "contents": [{
      "parts": [
        {"text": "請根據這些照片，總結出一個 3~5 個字的相簿名稱（例如：海邊風景、可愛貓咪、生日大餐）。請只輸出名稱，不要包含其他文字或符號。"},
        ...base64Images
      ]
    }]
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    
    const result = JSON.parse(response.getContentText());
    if (result.candidates && result.candidates.length > 0) {
       let aiTitle = result.candidates[0].content.parts[0].text.trim();
       // 去除可能出現的換行符號或標點符號
       aiTitle = aiTitle.replace(/[\r\n"']/g, ''); 
       
       // 重新命名資料夾
       folder.setName(`${currentName} - ${aiTitle}`);
    }
  } catch (e) {
    console.error("Gemini API Error: " + e.toString());
  }
}
