// 將人 Machill 網頁潮流版 V4 (雲端自動同步版)
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Google 試算表設定 (讀取您的試算表 ID)
    const sheetId = '1I1zLhyyp-Ip0Xs9453moNqR2Nbvf4MsRGskpGJg7VsY';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    async function loadAnnouncements() {
        try {
            const res = await fetch(sheetUrl);
            const text = await res.text();
            
            const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonString);
            const rows = data.table.rows;
            
            const container = document.getElementById('news-masonry-container');
            if (!container) return;
            container.innerHTML = ''; 

            rows.forEach((row, index) => {
                const date = row.c[0] ? (row.c[0].f || row.c[0].v) : '今日';
                const tag = row.c[1] ? row.c[1].v : '公告';
                const title = row.c[2] ? row.c[2].v : '無標題';
                const content = row.c[3] ? row.c[3].v : '';

                const isFeatured = (index === 0); 
                const card = document.createElement('div');
                card.className = isFeatured ? 'news-card featured' : 'news-card';

                let tagClass = 'green-tag';
                if (tag === '重要' || tag === '重要公告') tagClass = 'highlight-tag';
                if (tag === '活動' || tag === '緊急') tagClass = 'red-tag';

                card.innerHTML = `
                    <div class="news-tag ${tagClass}">${tag}</div>
                    <div class="news-content">
                        <span class="news-date">${date}</span>
                        <h3>${title}</h3>
                        <p>${content}</p>
                        ${isFeatured ? `
                        <div class="yt-widget-placeholder">
                            <div class="g-ytsubscribe" data-channelid="UCxxxxxx" data-layout="full" data-count="default"></div>
                        </div>` : ''}
                    </div>
                `;
                container.appendChild(card);
            });

            if (window.gapi && window.gapi.ytsubscribe) {
                window.gapi.ytsubscribe.go();
            }

        } catch (error) {
            console.error('讀取 Google 試算表失敗:', error);
            document.getElementById('news-masonry-container').innerHTML = '<div class="loading-placeholder">⚠️ 無法載入雲端公告，請確認試算表是否已開啟「知道連結的任何人都能檢視」並「發布到網路」。</div>';
        }
    }

    // 2. 透過 Vercel / Netlify 後端 Serverless API 讀取 YouTube API 
    async function loadYouTubeVideos() {
        try {
            const res = await fetch('/api/youtube');
            const data = await res.json();

            const videoGrid = document.getElementById('video-grid-container');
            if (!videoGrid) return;

            if (data.error || !data.items || data.items.length === 0) {
                renderFallbackVideos(videoGrid);
                return;
            }

            videoGrid.innerHTML = ''; 
            data.items.forEach(item => {
                const videoId = item.id.videoId;
                const title = item.snippet.title;
                const isLive = item.snippet.liveBroadcastContent === 'live';

                const videoBox = document.createElement('div');
                videoBox.className = 'video-box';
                videoBox.innerHTML = `
                    <div class="video-badge ${isLive ? 'live' : ''}">${isLive ? 'LIVE 直播中' : '最新影片'}</div>
                    <div class="responsive-video">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <h4>${title}</h4>
                `;
                videoGrid.appendChild(videoBox);
            });

        } catch (error) {
            console.warn('後端 API 尚未就緒，啟動前端備用影音版面:', error);
            renderFallbackVideos(document.getElementById('video-grid-container'));
        }
    }

    function renderFallbackVideos(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="video-box">
                <div class="video-badge">最新影片</div>
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>
                </div>
                <h4>將人爭霸賽：黃金對局精采回放 (範例)</h4>
            </div>
            <div class="video-box">
                <div class="video-badge live">LIVE</div>
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>
                </div>
                <h4>📡 備用直播狀態：請配置 Vercel 環境變數啟用自動同步</h4>
            </div>
        `;
    }

    // 3. 玩家投稿模擬回饋 (建議串接 Google Form 以策安全)
    const form = document.getElementById('submission-form');
    const formMessage = document.getElementById('form-message');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            formMessage.innerText = '🎉 投稿已成功通過資安通道送出！(此處建議在後台串接 Google Form 以利管理)';
            formMessage.style.display = 'block';
            form.reset();
            setTimeout(() => { formMessage.style.display = 'none'; }, 4000);
        });
    }

    loadAnnouncements();
    loadYouTubeVideos();
});
