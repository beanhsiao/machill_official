// Vercel Serverless Function: api/youtube.js
// 目的：在後端安全地呼叫 YouTube Data API，隱藏金鑰，徹底杜絕前端資安外洩風險。

export default async function handler(req, res) {
    // 允許跨網域存取 (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // === 已整合優化：強效快取機制 (Cache Control) ===
    // 讓 Vercel 把 YouTube 的 API 結果在伺服器暫存 1 小時 (3600秒)
    // 這能保證每天免費的 10,000 點配額絕對用不完，徹底實現 0 元免運作！
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UCs9JAqRPV60o0B10zC40zDQ'; 

    if (!apiKey) {
        return res.status(200).json({ 
            error: '尚未配置環境變數 YOUTUBE_API_KEY',
            items: [] 
        });
    }

    try {
        // 向 Google 官方請求最新發布的兩部影片
        const targetUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=2&type=video`;
        
        const googleResponse = await fetch(targetUrl);
        const data = await googleResponse.json();

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: '後端 API 請求失敗：' + error.message });
    }
}
