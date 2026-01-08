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
// HELPER: FETCH WITH RETRY (API මාරු කරමින් උත්සාහ කිරීම)
// ==========================================
async function fetchVideoData(url) {
    // URL එකේ තියෙන අනවශ්‍ය කෑලි (?si=...) අයින් කිරීම
    let cleanUrl = url;
    if(url.includes("youtu")) {
        cleanUrl = url.split("?si=")[0].split("&si=")[0];
    }

    // STRATEGY 1: Dark-Yasiya API (Best for SL)
    try {
        const res = await fetch(`https://www.dark-yasiya-api.site/download/ytmp3?url=${cleanUrl}`);
        const data = await res.json();
        if (data.status && data.result) {
            return {
                title: data.result.title,
                thumb: data.result.thumbnail,
                video: data.result.dl_link, // Video Link
                audio: data.result.dl_link  // Audio Link
            };
        }
    } catch (e) {
        console.log("Strategy 1 Failed");
    }

    // STRATEGY 2: Dreaded API (Backup)
    try {
        const res = await fetch(`https://api.dreaded.site/api/ytdl/video?url=${cleanUrl}`);
        const data = await res.json();
        if (data.result) {
            return {
                title: data.result.title,
                thumb: data.result.thumbnail,
                video: data.result.mp4,
                audio: data.result.mp3
            };
        }
    } catch (e) {
        console.log("Strategy 2 Failed");
    }

    return null;
}

// ==========================================
// MAIN SERVER
// ==========================================
serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const q = url.searchParams.get("url") || url.searchParams.get("q");

  // 1. Root Check
  if (path === "/") {
    return new Response(JSON.stringify({ 
      status: "Alive", 
      message: "xCHAMi Proxy Server Running! 🔥" 
    }), { headers: corsHeaders });
  }

  // 2. YouTube Route
  if (path === "/yt") {
    if (!q) return new Response(JSON.stringify({ error: "Link missing" }), { headers: corsHeaders });

    const data = await fetchVideoData(q);

    if (data) {
        return new Response(JSON.stringify({
            status: "success",
            title: data.title,
            thumb: data.thumb,
            data: {
                video_url: data.video,
                audio_url: data.audio
            }
        }), { headers: corsHeaders });
    } else {
        return new Response(JSON.stringify({ 
            status: "fail", 
            message: "All APIs busy. Try again later." 
        }), { headers: corsHeaders });
    }
  }

  return new Response("Not Found", { status: 404 });
});
