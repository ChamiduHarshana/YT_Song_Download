console.log("🚀 xCHAMi Studio Advanced Music API Started...");

// Piped Instances (Backup සදහා ලින්ක් කිහිපයක්)
// එකක් වැඩ නැත්නම් අනිත් එකෙන් වැඩ කරන විදියට හැදුවේ
const INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.ot.ax",
  "https://pipedapi.drgns.space"
];

// වැඩ කරන Instance එකක් තෝරාගැනීම
async function getWorkingInstance() {
  for (const url of INSTANCES) {
    try {
      const res = await fetch(`${url}/`);
      if (res.ok) return url;
    } catch (e) { continue; }
  }
  return INSTANCES[0]; // බැරිම වුනොත් පළවෙනි එක ගන්නවා
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. Home Page
  if (url.pathname === "/") {
    return new Response(JSON.stringify({
      status: "Active",
      owner: "xCHAMi Studio",
      mode: "Ultra-Fast Deno API",
      usage: "/api?q=Song Name or URL"
    }, null, 2), {
      headers: { "content-type": "application/json" }
    });
  }

  // 2. Main API Logic
  if (url.pathname === "/api") {
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response(JSON.stringify({ status: "error", message: "Missing query (?q=)" }), { 
        status: 400, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    try {
      const BASE_URL = await getWorkingInstance();
      let videoId = "";
      let videoInfo = {};

      // STEP 1: Link එකක්ද Search එකක්ද කියලා බලනවා
      // (සරල regex එකක් මගින් Video ID එක ගන්නවා)
      const urlRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = query.match(urlRegex);

      if (match && match[1]) {
        // Link එකක් නම් ID එක කෙලින්ම ගන්නවා
        videoId = match[1];
      } else {
        // Search එකක් නම් Piped API එකෙන් Search කරනවා
        console.log(`Searching for: ${query} on ${BASE_URL}`);
        const searchRes = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}&filter=videos`);
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
          throw new Error("No results found");
        }
        
        // පළවෙනි Result එක ගන්නවා
        videoId = searchData.items[0].url.split("v=")[1];
      }

      // STEP 2: Video එකේ සින්දුව (Audio Stream) ලබා ගැනීම
      const streamRes = await fetch(`${BASE_URL}/streams/${videoId}`);
      const streamData = await streamRes.json();

      // Audio Files පමණක් ෆිල්ටර් කරගැනීම
      const audioStreams = streamData.audioStreams;
      if (!audioStreams || audioStreams.length === 0) throw new Error("No audio streams found");

      // හොදම Quality එක (m4a format) තෝරාගැනීම
      const bestAudio = audioStreams.find(s => s.format === "m4a") || audioStreams[0];

      // Output JSON එක හැදීම
      const responseData = {
        status: "success",
        data: {
          title: streamData.title,
          artist: streamData.uploader,
          thumbnail: streamData.thumbnailUrl,
          duration: convertDuration(streamData.duration),
          views: streamData.views,
          download_url: bestAudio.url, // කෙලින්ම Download වෙන ලින්ක් එක
          file_type: "m4a", // WhatsApp supports m4a as audio
          quality: bestAudio.quality || "128kbps"
        },
        engine: "xCHAMi Piped Engine"
      };

      return new Response(JSON.stringify(responseData, null, 2), {
        headers: { 
          "content-type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Failed to fetch data",
        details: error.message
      }), { 
        status: 500,
        headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }
  }

  return new Response("Not Found", { status: 404 });
});

// තත්පර ගණන විනාඩි වලට හරවන function එක
function convertDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}
