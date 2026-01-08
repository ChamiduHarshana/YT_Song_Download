import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// ==========================================
// CONFIGURATION
// ==========================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

// ==========================================
// HELPER: TIKTOK (TikWM Proxy)
// ==========================================
async function tiktokDL(url) {
  try {
    const domain = 'https://www.tikwm.com/api/';
    const res = await fetch(domain + `?url=${url}&count=12&cursor=0&web=1&hd=1`);
    const data = await res.json();
    return data.data;
  } catch (e) {
    return null;
  }
}

// ==========================================
// HELPER: YOUTUBE SEARCH (Custom Fetch)
// ==========================================
async function ytSearch(query) {
    // අපි YTS Library එක වෙනුවට සැහැල්ලු API එකක් Proxy කරනවා
    try {
        const res = await fetch(`https://api.dreaded.site/api/yts?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data.result || []; // Array එකක් ආපසු යවනවා
    } catch (e) {
        return [];
    }
}

// ==========================================
// HELPER: YOUTUBE DOWNLOADER (Relay)
// ==========================================
async function ytDownload(url) {
    // Deno ඇතුලේ ytdl දුවන්න බැරි නිසා අපි හොඳ API එකක් Relay කරනවා
    try {
        // Option 1: Using a reliable public API as backend
        const res = await fetch(`https://api.dreaded.site/api/ytdl/video?url=${url}`);
        const data = await res.json();
        
        if(data && data.result) {
            return {
                title: data.result.title || "YouTube Video",
                thumb: data.result.thumbnail || "",
                audio_url: data.result.mp3 || data.result.link, // Audio Link
                video_url: data.result.mp4 || data.result.link  // Video Link
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ==========================================
// MAIN SERVER CODE
// ==========================================
serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const q = url.searchParams.get("q") || url.searchParams.get("url");

  // 1. Root Message
  if (path === "/") {
    return new Response(JSON.stringify({ 
      status: "Alive", 
      owner: "xCHAMi Studio",
      endpoints: ["/search?q=", "/yt?url=", "/tiktok?url="] 
    }), { headers: corsHeaders });
  }

  // 2. YouTube Search Route
  if (path === "/search") {
    if (!q) return new Response(JSON.stringify({ error: "Query missing" }), { headers: corsHeaders });
    
    const results = await ytSearch(q);
    return new Response(JSON.stringify({
      status: "success",
      data: results
    }), { headers: corsHeaders });
  }

  // 3. YouTube Download Route
  if (path === "/yt") {
    if (!q) return new Response(JSON.stringify({ error: "URL missing" }), { headers: corsHeaders });
    
    const data = await ytDownload(q);
    if (!data) return new Response(JSON.stringify({ status: "fail", message: "Download failed" }), { headers: corsHeaders });

    return new Response(JSON.stringify({
      status: "success",
      title: data.title,
      thumb: data.thumb,
      data: {
          audio_url: data.audio_url, // බොට් කෝඩ් එකේ මේ නමම තියෙන්න ඕනේ
          video_url: data.video_url
      }
    }), { headers: corsHeaders });
  }

  // 4. TikTok Route
  if (path === "/tiktok") {
    if (!q) return new Response(JSON.stringify({ error: "URL missing" }), { headers: corsHeaders });
    
    const data = await tiktokDL(q);
    if(!data) return new Response(JSON.stringify({ status: "fail", message: "Video not found" }), { headers: corsHeaders });

    return new Response(JSON.stringify({
      status: "success",
      title: data.title,
      cover: data.cover,
      url: data.play, 
      wm_url: data.wmplay,
      music: data.music
    }), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: "Invalid Route" }), { status: 404, headers: corsHeaders });
});
