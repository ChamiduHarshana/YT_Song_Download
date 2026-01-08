// ඔයාගේ command file එක ඇතුලේ
const axios = require('axios');

// ඔයාගේ අලුත් API URL එක මෙතනට දාන්න
const API_URL = "https://xchami-api.deno.dev/api?q="; 

case 'play':
case 'song':
    if (!text) return reply('සින්දුවේ නම එවන්න!');
    
    reply(`🔍 Searching for: *${text}*...`);

    try {
        // 1. API එකෙන් විස්තර ගන්නවා
        const { data } = await axios.get(API_URL + encodeURIComponent(text));

        if (data.status === "success") {
            const songTitle = data.title;
            const songUrl = data.dl_link; // Audio Link
            const thumb = data.thumbnail;
            const duration = data.duration;

            // 2. විස්තර ටික යවනවා (Caption)
            let desc = `🎧 *xCHAMi MUSIC PLAYER* 🎧\n\n`;
            desc += `📌 *Title:* ${songTitle}\n`;
            desc += `⏱️ *Duration:* ${duration}\n`;
            desc += `👤 *Artist:* ${data.author}\n`;
            desc += `🔗 *Url:* ${data.video_url}\n\n`;
            desc += `_Uploading audio..._`;

            // Photo එක සහ Caption එක යවනවා
            await conn.sendMessage(from, { 
                image: { url: thumb }, 
                caption: desc 
            }, { quoted: mek });

            // 3. Audio එක යවනවා (Voice Note & File)
            // (A) Voice Note (PTT)
            await conn.sendMessage(from, { 
                audio: { url: songUrl }, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: mek });

            // (B) Document File (iPhone users)
            await conn.sendMessage(from, { 
                document: { url: songUrl }, 
                mimetype: 'audio/mpeg', 
                fileName: `${songTitle}.mp3`,
                caption: "© xCHAMi Studio"
            }, { quoted: mek });

        } else {
            reply("❌ සින්දුව හොයාගන්න බැරි වුනා.");
        }

    } catch (e) {
        console.log(e);
        reply("❌ Error එකක් ආවා.");
    }
    break;
