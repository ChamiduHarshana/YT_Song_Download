console.log("🚀 xCHAMi Studio Direct-Search API Started...");

// ==========================================
// 1. DIRECT YOUTUBE SEARCH FUNCTION
// ==========================================
// කිසිම API එකක් නැතුව කෙලින්ම YouTube එකෙන් Video ID එක හොයන හැටි
async function searchYoutubeDirect(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    // බොරු බ්‍රව්සරයක් විදියට YouTube එකට කතා කරනවා
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      }
    });

    const html = await response.text();

    // HTML එක ඇතුලෙන් Video ID එක හොයාගන්න පුංචි Regex එකක්
    // මේකෙන් මුලින්ම හම්බෙන Video ID එක ගන්නවා
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);

    if (videoIdMatch && videoIdMatch[1]) {
      return {
        id: videoIdMatch[1],
        url: `https://www.youtube.com/watch?v=${videoIdMatch[1]}`
      };
    } else {
      throw new Error("HTML scraping failed to find video ID");
    }

  } catch (e) {
    console.error("Search Error:", e);
    return null;
  }
}

// ==========================================
// 2. COBALT DOWNLOADER
// ==========================================
async function getDownloadLink(videoUrl) {
    try {
        const res = await fetch("https://api.cobalt.tools/api/json", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            },
            body: JSON.stringify({
                url: videoUrl,
                vCodec: "h264",
                vQuality: "720",
                aFormat: "mp3",
                isAudioOnly: true
            })
        });

        const data = await res.json();
        // සමහර වෙලාවට url එනවා, සමහර වෙලාවට audio කියලා එනවා
        return data.url || data.audio || null;

    } catch (e) {
        console.error("Cobalt Error:", e);
        return null;
    }
}

// ==========================================
// 3. MAIN SERVER
// ==========================================
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Home Route
  if (url.pathname === "/") {
    return new Response(JSON.stringify({
      status: "Running",
      method: "Direct Scraping",
      owner: "xCHAMi Studio"
    }, null, 2), { headers: { "content-type": "application/json" } });
  }

  // API Route
  if (url.pathname === "/api") {
    const q = url.searchParams.get("q");

    if (!q) {
      return new Response(JSON.stringify({ status: "error", message: "Missing query" }), {
        status: 400, headers: { "content-type": "application/json" }
      });
    }

    try {
      let finalUrl = "";
      
      // Step A: Link එකක්ද කියලා බලනවා
      if (q.includes("youtube.com") || q.includes("youtu.be")) {
        finalUrl = q;
      } else {
        // Step B: Link එකක් නෙවෙයි නම් Search කරනවා (New Method)
        const searchResult = await searchYoutubeDirect(q);
        if (!searchResult) {
          return new Response(JSON.stringify({ status: "error", message: "Song not found (Search failed)" }), {
            status: 404, headers: { "content-type": "application/json" }
          });
        }
        finalUrl = searchResult.url;
      }

      // Step C: Download Link එක ගන්නවා
      const downloadLink = await getDownloadLink(finalUrl);

      if (!downloadLink) {
         return new Response(JSON.stringify({ status: "error", message: "Download failed (Cobalt busy)" }), {
            status: 500, headers: { "content-type": "application/json" }
          });
      }

      // Step D: Response එක යවනවා
      return new Response(JSON.stringify({
        status: "success",
        data: {
          title: "YouTube Audio", // Scraping වලින් Title එක ගන්න එක ටිකක් අමාරු නිසා General නමක් දැම්මා
          url: finalUrl,
          dl_link: downloadLink
        }
      }, null, 2), {
        headers: { 
          "content-type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ status: "error", message: error.message }), {
        status: 500, headers: { "content-type": "application/json" }
      });
    }
  }

  return new Response("Not Found", { status: 404 });
});
