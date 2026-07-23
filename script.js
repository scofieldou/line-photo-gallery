// ==========================================
// ⚙️ 系統設定區
// ==========================================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbylDfQW50TX1H0Seir1YezZ4-J9V9ayQvaoChcHWdAHA3sk7rCDDwFt6LUJ1raKz__j/exec';

document.addEventListener('DOMContentLoaded', () => {
    // 介面容器
    const albumsView = document.getElementById('albums-view');
    const photosView = document.getElementById('photos-view');
    const gallery = document.getElementById('gallery');
    
    // 狀態提示
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    
    // 導覽元素
    const backBtn = document.getElementById('back-btn');
    const currentAlbumTitle = document.getElementById('current-album-title');
    
    // Modal 元素
    const modal = document.getElementById('media-modal');
    const modalImg = document.getElementById('modal-img');
    const modalVideo = document.getElementById('modal-video');
    const captionText = document.getElementById('caption');
    const closeBtn = document.getElementsByClassName('close-btn')[0];

    // 初始化：讀取資料
    fetchData();

    function fetchData() {
        if (GAS_API_URL.includes('請填入')) {
            showError('⚠️ 請先在 script.js 中設定您的 GAS API 網址。');
            return;
        }

        fetch(GAS_API_URL)
            .then(response => response.json())
            .then(result => {
                loading.classList.add('hidden');
                
                if (result.status === 'success') {
                    if (result.data.length === 0) {
                        showError('📭 目前還沒有任何相簿喔！快去 LINE 群組傳幾張照片吧！');
                    } else {
                        renderAlbums(result.data);
                    }
                } else {
                    throw new Error(result.message || '讀取失敗');
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                showError('❌ 讀取失敗，請確認 API 網址是否正確，或是 Google Drive 權限是否已開啟。');
            });
    }

    function showError(msg) {
        loading.classList.add('hidden');
        errorMessage.innerHTML = `<p>${msg}</p>`;
        errorMessage.classList.remove('hidden');
    }

    // ==========================================
    // 渲染第一層：相簿牆
    // ==========================================
    function renderAlbums(albumsData) {
        albumsView.innerHTML = ''; // 清空
        albumsView.classList.remove('hidden');
        photosView.classList.add('hidden');

        albumsData.forEach(album => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // 封面圖
            const img = document.createElement('img');
            img.src = album.coverUrl;
            img.loading = 'lazy';
            img.referrerPolicy = 'no-referrer';

            // 相簿資訊 (名稱與照片數量)
            const info = document.createElement('div');
            info.className = 'album-info';
            info.innerHTML = `
                <div class="album-name">${album.albumName}</div>
                <div class="album-count">📸 ${album.files.length} 個檔案</div>
            `;

            card.appendChild(img);
            card.appendChild(info);
            albumsView.appendChild(card);

            // 點擊進入相簿
            card.addEventListener('click', () => {
                openAlbum(album);
            });
        });
    }

    // ==========================================
    // 渲染第二層：照片牆 (開啟相簿)
    // ==========================================
    function openAlbum(album) {
        albumsView.classList.add('hidden');
        photosView.classList.remove('hidden');
        currentAlbumTitle.innerText = `📂 ${album.albumName}`;
        gallery.innerHTML = ''; // 清空舊照片

        album.files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // 處理時間格式
            const dateObj = new Date(file.date);
            const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

            // 建立圖片預覽 (若是影片，在畫廊依然用圖標或 iframe 縮圖，這裡簡單用封面或預設 icon)
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.referrerPolicy = 'no-referrer';

            if (file.type === 'video') {
                // 如果是影片，套用影片專用樣式與圖示
                img.src = 'https://img.icons8.com/color/480/video.png'; // 預設影片縮圖
                img.style.objectFit = 'contain';
                img.style.padding = '20px';
                
                const badge = document.createElement('div');
                badge.className = 'video-badge';
                badge.innerText = '▶️ 影片';
                card.appendChild(badge);
            } else {
                img.src = file.url; 
            }

            // 建立資訊浮層
            const info = document.createElement('div');
            info.className = 'photo-info';
            info.innerText = `上傳時間: ${timeStr}`;

            card.appendChild(img);
            card.appendChild(info);
            gallery.appendChild(card);

            // 點擊事件：開啟 Modal 看原圖或播放影片
            card.addEventListener('click', () => {
                openModal(file);
            });
        });
    }

    // 返回按鈕
    backBtn.addEventListener('click', () => {
        photosView.classList.add('hidden');
        albumsView.classList.remove('hidden');
        // 為了節省資源，返回時可以清空 gallery
        gallery.innerHTML = '';
    });

    // ==========================================
    // Modal 放大檢視控制
    // ==========================================
    function openModal(file) {
        modal.classList.remove('hidden');
        
        // 處理日期格式
        const dateObj = new Date(file.date);
        const dateStr = `${dateObj.getFullYear()}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
        
        captionText.innerHTML = `${file.name} <br><span style="font-size:0.8em; color:#888;">${dateStr}</span>`;

        if (file.type === 'video') {
            modalImg.classList.add('hidden');
            modalVideo.classList.remove('hidden');
            modalVideo.src = file.url; // 載入 iframe 影片
        } else {
            // 為了避免 Google Drive 阻擋原圖導致縮圖被放大變馬賽克，
            // 圖片放大時也改用 Google Drive 的原生高畫質 iframe 預覽器
            const match = file.url.match(/id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                const highResPreviewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
                modalImg.classList.add('hidden');
                modalVideo.classList.remove('hidden');
                modalVideo.src = highResPreviewUrl;
            } else {
                // 退回使用原本的 img 標籤 (防呆)
                modalVideo.classList.add('hidden');
                modalImg.classList.remove('hidden');
                modalImg.src = file.url;
                modalImg.referrerPolicy = 'no-referrer';
            }
        }
    }

    // Modal 關閉事件
    function closeModal() {
        modal.classList.add('hidden');
        // 清空 src 停止影片繼續在背景播放
        modalVideo.src = '';
        modalImg.src = '';
    }

    closeBtn.addEventListener('click', closeModal);

    // 點擊 Modal 背景也可以關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-content-wrapper')) {
            closeModal();
        }
    });
});
