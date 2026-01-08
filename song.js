// ඔයාගේ Bot Code එක ඇතුලේ (Case 'play' or 'song')

const axios = require('axios');
const API_URL = "https://oya-hadapu-deno-link-eka.deno.dev/api?q=";

// ... inside the case ...
if (!text) return reply("සින්දුවේ නම ගහන්න!");

// කෙලින්ම API එකට යවනවා
const { data } = await axios.get(API_URL + encodeURIComponent(text));

if (data.status === "success" && data.data) {
    const song = data.data;

    // 1. Image + Caption යවනවා
    let caption = `🎧 *xCHAMi AUDIO PLAYER* 🎧\n\n`;
    caption += `🎵 *Title:* ${song.title}\n`;
    caption += `👤 *Artist:* ${song.artist}\n`;
    caption += `⏱️ *Duration:* ${song.duration}\n\n`;
    caption += `_Downloading..._`;

    await conn.sendMessage(from, { image: { url: song.thumbnail }, caption: caption }, { quoted: mek });

    // 2. Audio එක යවනවා
    await conn.sendMessage(from, { 
        audio: { url: song.download_url }, 
        mimetype: 'audio/mp4', 
        ptt: false // Voice note ඕන නම් true කරන්න
    }, { quoted: mek });

    // 3. Document එක (File) යවනවා
    await conn.sendMessage(from, { 
        document: { url: song.download_url }, 
        mimetype: 'audio/mpeg', 
        fileName: `${song.title}.mp3`,
        caption: "© xCHAMi Studio"
    }, { quoted: mek });

} else {
    reply("සින්දුව හොයාගන්න බැරි වුනා.");
}
