console.log("🚀 xCHAMi Studio Hybrid Music API Started...");

// ==========================================
// CONFIGURATION (Power Engines)
// ==========================================
// සින්දු හොයන්න පාවිච්චි කරන Servers (Search Engines)
const SEARCH_ENGINES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.ot.ax",
  "https://pipedapi.drgns.space",
  "https://api-piped.mha.fi"
];

// සින්දු ඩවුන්ලෝඩ් කරන්න පාවිච්චි කරන Engine එක (Cobalt)
const COBALT_API = "https://api.cobalt.tools/api/json";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// 1. හොදම Search Engine එක තෝරාගැනීම
async function searchYouTube(query) {
  for (const host of SEARCH_ENGINES) {
    try {
      console.log(`🔍 Searching on: ${host}...`);
      const res = await fetch(`${host}/search?q=${encodeURIComponent(query)}&filter=videos`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            // හරියටම Video ID එක ගන්නවා
            const video = data.items[0];
            return {
                title: video.title,
                url: `https://www.youtube.com${video.url}`,
                thumb: video.thumbnailUrl,
                duration: video.duration,
                author: video.uploaderName
            };
        }
      }
    } catch (e) {
      console.log(`Engine ${host} failed, trying next...`);
      continue; // ඊළඟ එකට මාරු වෙනවා
    }
  }
  return null; // සේරම ෆේල් වුනොත්
}

// 2. Cobalt හරහා Audio Link එක ගැනීම (High Quality)
async function getDownloadLink(videoUrl) {
    try {
        const res = await fetch(COBALT_API, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Compatible; xCHAMi-Bot/1.0)'
            },
            body: JSON.stringify({
                url: videoUrl,
                vCodec: "h264",
                vQuality: "720",
                aFormat: "mp3",
                isAudioOnly: true // Audio විතරයි
            })
        });

        const data = await res.json();
        if (data.url || data.audio) {
            return data.url || data.audio;
        }
    } catch (e) {
        console.error("Download Engine Failed:", e);
    }
    return null;
}

// ==========================================
// MAIN SERVER
// ==========================================
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. Home Page
  if (url.pathname === "/") {
    return new Response(JSON.stringify({
      status: "Online",
      system: "xCHAMi Hybrid Music Engine",
      message: "API is fully operational."
    }, null, 2), { headers: { "content-type": "application/json" } });
  }

  // 2. API Endpoint
  if (url.pathname === "/api") {
    const q = url.searchParams.get("q");
    if (!q) return new Response(JSON.stringify({ error: "Missing query" }), { status: 400 });

    try {
      let videoData = null;
      let downloadUrl = null;

      // STEP A: Link එකක්ද නමක්ද කියලා බැලීම
      const isUrl = q.includes("youtube.com") || q.includes("youtu.be");

      if (isUrl) {
        // Link එකක් නම් කෙලින්ම Download කරනවා
        downloadUrl = await getDownloadLink(q);
        // විස්තර ටික නිකන් Dummy විදියට හදනවා (URL එකෙන් විස්තර ගන්න අමාරු නිසා ඉක්මනට)
        videoData = {
            title: "YouTube Audio",
            url: q,
            thumb: "https://i.ibb.co/3zpkv0S/music-placeholder.jpg",
            author: "Unknown Artist",
            duration: "N/A"
        };
      } else {
        // නමක් නම් Search කරනවා
        videoData = await searchYouTube(q);
        if (!videoData) {
             return new Response(JSON.stringify({ status: "error", message: "Song not found on any server." }), 
             { status: 404, headers: { "content-type": "application/json" } });
        }
        // හොයාගත්ත Video එකේ Link එක යවලා Download Link එක ගන්නවා
        downloadUrl = await getDownloadLink(videoData.url);
      }

      if (!downloadUrl) {
        return new Response(JSON.stringify({ status: "error", message: "Download failed. Try again." }), 
        { status: 500, headers: { "content-type": "application/json" } });
      }

      // STEP B: Final Response Sending
      return new Response(JSON.stringify({
        status: "success",
        data: {
            title: videoData.title,
            artist: videoData.author,
            thumbnail: videoData.thumb,
            duration: videoData.duration, // තත්පර වලින්
            url: videoData.url,
            dl_link: downloadUrl // මේක තමයි MP3 ලින්ක් එක
        }
      }, null, 2), {
        headers: { 
          "content-type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "content-type": "application/json" } });
    }
  }

  return new Response("404 Not Found", { status: 404 });
});
