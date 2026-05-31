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
                            <div class="g-ytsubscribe" data-channelid="UCs9JAqRPV60o0B10zC40zDQ" data-layout="full" data-count="default"></div>
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
                <div class="video-badge">熱門影片</div>
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/FMoJCDCOrTI?si=6-FzDjPG0SBk8ZQh" frameborder="0" allowfullscreen></iframe>
                </div>
                <h4>將人爭霸：黃金對局精采回放</h4>
            </div>
            <div class="video-box">
                <div class="video-badge live">VCR</div>
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/2_wlqsiO30I?si=zpBUbWhLm3roXwdd" frameborder="0" allowfullscreen></iframe>
                </div>
                <h4>熱騰騰的最新一期直播！</h4>
            </div>
        `;
    }


    // 3. 玩家投稿實際串接 Google 表單
    const form = document.getElementById('submission-form');
    const formMessage = document.getElementById('form-message');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ⚠️ 請步驟 3 的教學，將下方換成您真實的表單 ID
            const formId = "1FAIpQLSfzU9ByT4cyiNkk46FPlcLGZRTNSuGhhl9GuzINoFrjbfsdKQ";
            const googleFormUrl = `https://docs.google.com/forms/d/e/${formId}/formResponse`;
            // https://docs.google.com/forms/d/e/1FAIpQLSfzU9ByT4cyiNkk46FPlcLGZRTNSuGhhl9GuzINoFrjbfsdKQ/viewform?usp=dialog

            // https://docs.google.com/forms/d/e/1FAIpQLSfzU9ByT4cyiNkk46FPlcLGZRTNSuGhhl9GuzINoFrjbfsdKQ/viewform?usp=pp_url&entry.18398499=%E5%8C%BF%E5%90%8D&entry.1794159675=%E9%80%99%E6%98%AF%E4%B8%80%E5%80%8B%E6%A8%99%E9%A1%8C&entry.1358337753=%E7%84%A1%E5%AD%97%E5%A4%A9%E6%9B%B8
            // 建立傳送資料物件
            const formData = new FormData();

            // ⚠️ 請根據步驟 3 的教學，將下方 entry.xxxxxx 換成您表單對應的欄位代碼
            formData.append('entry.18398499', document.getElementById('nickname').value || '匿名'); // 暱稱
            formData.append('entry.1794159675', document.getElementById('title').value);    // 標題
            formData.append('entry.1358337753', document.getElementById('content').value);  // 內容

            try {
                // 使用 no-cors 模式跨網域安全傳送給 Google Form
                await fetch(googleFormUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                });

                // 成功提示
                formMessage.innerText = '🎉 投稿已成功寫入雲端表單！感謝您的分享！';
                formMessage.style.display = 'block';
                formMessage.style.backgroundColor = '#d1fae5';
                formMessage.style.color = '#065f46';
                form.reset();
            } catch (error) {
                console.error('投稿送出失敗:', error);
                formMessage.innerText = '❌ 送出失敗，請檢查網路或稍後再試。';
                formMessage.style.display = 'block';
                formMessage.style.backgroundColor = '#fee2e2';
                formMessage.style.color = '#991b1b';
            }

            setTimeout(() => { formMessage.style.display = 'none'; }, 5000);
        });
    }

    // 1. 設定您提供的全新 Google 試算表 ID
    const MESSAGE_SPREADSHEET_ID = '1fpsUzvGjYxDbfxg_EIRu3nT2pA_sGmsgVijNHcTe5-k';
    const MESSAGE_FETCH_URL = `https://docs.google.com/spreadsheets/d/${MESSAGE_SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

    // 2. 自動異步撈取 Google 表單內的留言資料
    async function fetchBoardMessages() {
        const container = document.getElementById('messages-container');
        if (!container) return;

        try {
            const response = await fetch(MESSAGE_FETCH_URL);
            const text = await response.text();

            // 擷取 Google 吐出的標準 JSON 字串
            const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
            const data = JSON.parse(jsonStr);
            const rows = data.table.rows;

            // 如果目前完全沒有人留言
            if (!rows || rows.length === 0) {
                container.innerHTML = '<div class="no-messages">目前還沒有留言，快來搶沙發發表第一條留言吧！💬</div>';
                return;
            }

            container.innerHTML = ''; // 清空「同步中」的提示字

            // 將陣列反轉（讓最新填寫的留言顯示在最上面）
            const newestMessages = [...rows].reverse();

            newestMessages.forEach(row => {
                // 解析 Google 表單欄位：0=時間戳記, 1=玩家暱稱, 2=留言主題, 3=留言內容
                const rawDate = row.c[0]?.f || row.c[0]?.v || '';
                const date = rawDate.split(' ')[0]; // 只精簡擷取 YYYY/MM/DD 日期部分

                const nickname = row.c[1]?.v || '匿名玩家';
                const title = row.c[2]?.v || '無主題';
                const content = row.c[3]?.v || '';

                // 建立一模一樣大小的卡片節點
                const card = document.createElement('div');
                card.className = 'message-card';
                card.innerHTML = `
                <div>
                    <div class="message-header">
                        <span class="message-author">👤 ${nickname}</span>
                        <span class="message-date">${date}</span>
                    </div>
                    <div class="message-body">
                        <h4>${title}</h4>
                        <p>${content}</p>
                    </div>
                </div>
            `;
                container.appendChild(card);
            });

        } catch (error) {
            console.error('留言板同步失敗:', error);
            container.innerHTML = '<div class="no-messages">⚠️ 留言載入失敗，請檢查網路連線。</div>';
        }
    }

    // 💡 提示：請確保在您的網頁初始化總開關（如先前寫的 initWebsite() 或 DOMContentLoaded 監聽器內）
    // 加上這行呼叫，網頁一打開才會自動載入留言：
    fetchBoardMessages();

    loadAnnouncements();
    loadYouTubeVideos();
});
