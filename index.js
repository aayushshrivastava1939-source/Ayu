const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");
const express = require("express");
const fs = require("fs-extra");
const pino = require("pino");
const path = require("path");
const axios = require("axios");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const moment = require("moment");
const os = require("os");

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Owner configuration
const OWNER_NUMBER = "917898573354@c.us";
const BOT_NAME = "Ayush shrivastava";
const PREFIX = ".";

// Store active connections
let activeSockets = new Map();
let botStartTime = Date.now();

// ============ COMMAND HANDLER ============
async function handleCommand(sock, msg, command, args, sender) {
    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith("@g.us");
    const isOwner = sender === OWNER_NUMBER;
    
    try {
        // ========== GENERAL COMMANDS ==========
        if (command === "menu" || command === "gmenu") {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            const totalMem = os.totalmem() / 1024 / 1024 / 1024;
            const freeMem = os.freemem() / 1024 / 1024 / 1024;
            const usedMem = totalMem - freeMem;
            
            const menuText = `╔〔 🧚‍♀️*${BOT_NAME}*💐〕╗
 *👋 Hello, ${BOT_NAME} User!*
╚══════════════════════╝

╭─「 *COMMAND PANEL* 」
│🔹 *Run*     : ${days}d ${hours}h ${minutes}m ${seconds}s
│🔹 *Mode*    : Public
│🔹 *Prefix*  : ${PREFIX}
│🔹 *Ram*     : ${usedMem.toFixed(2)} / ${totalMem.toFixed(2)} GB
│🔹 *Time*    : ${moment().format('hh:mm:ss A')}
│🔹 *User*    : ${sender.split("@")[0]}
╰─────────────●●►

*╭────❒ DOWNLOADER ❒*
*├◈ ${PREFIX}ytv <url>*
*├◈ ${PREFIX}yta <url>*
*├◈ ${PREFIX}fb <url>*
*├◈ ${PREFIX}ig <url>*
*├◈ ${PREFIX}tiktok <url>*
*├◈ ${PREFIX}twitter <url>*
*├◈ ${PREFIX}mediafire <url>*
*┕──────────────────❒*

*╭────❒ GENERAL ❒*
*├◈ ${PREFIX}menu*
*├◈ ${PREFIX}ping*
*├◈ ${PREFIX}uptime*
*├◈ ${PREFIX}owner*
*├◈ ${PREFIX}botinfo*
*┕──────────────────❒*

*╭────❒ GROUP ❒*
*├◈ ${PREFIX}tagall*
*├◈ ${PREFIX}admins*
*├◈ ${PREFIX}promote @user*
*├◈ ${PREFIX}demote @user*
*├◈ ${PREFIX}kick @user*
*├◈ ${PREFIX}add 91xxxxx*
*├◈ ${PREFIX}leave*
*├◈ ${PREFIX}groupinfo*
*┕──────────────────❒*

*╭────❒ MEDIA ❒*
*├◈ ${PREFIX}sticker*
*├◈ ${PREFIX}toimage*
*├◈ ${PREFIX}s*
*┕──────────────────❒*

*╭────❒ TOOLS ❒*
*├◈ ${PREFIX}qr <text>*
*├◈ ${PREFIX}ssweb <url>*
*├◈ ${PREFIX}shorturl <url>*
*├◈ ${PREFIX}calc <eq>*
*├◈ ${PREFIX}weather <city>*
*├◈ ${PREFIX}wiki <query>*
*├◈ ${PREFIX}translate <lang> <text>*
*┕──────────────────❒*

*╭────❒ REACTIONS ❒*
*├◈ ${PREFIX}hug @user*
*├◈ ${PREFIX}kiss @user*
*├◈ ${PREFIX}slap @user*
*├◈ ${PREFIX}pat @user*
*├◈ ${PREFIX}poke @user*
*├◈ ${PREFIX}dance*
*├◈ ${PREFIX}cry*
*┕──────────────────❒*

*╭────❒ OWNER ❒*
*├◈ ${PREFIX}block @user*
*├◈ ${PREFIX}unblock @user*
*├◈ ${PREFIX}bc <msg>*
*├◈ ${PREFIX}join <link>*
*├◈ ${PREFIX}leaveall*
*┕──────────────────❒*

*Made by YAMDHUD*`;
            await sock.sendMessage(chatId, { text: menuText });
        }
        
        else if (command === "ping") {
            const start = Date.now();
            await sock.sendMessage(chatId, { text: "🏓 Pinging..." });
            const end = Date.now();
            await sock.sendMessage(chatId, { text: `*Pong!* 🏓\nLatency: ${end - start}ms` });
        }
        
        else if (command === "uptime" || command === "runtime") {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            await sock.sendMessage(chatId, { text: `*Bot Uptime:*\n${days}d ${hours}h ${minutes}m ${seconds}s` });
        }
        
        else if (command === "owner" || command === "creator") {
            await sock.sendMessage(chatId, { text: `*Creator:* Ayush\n*WhatsApp:* wa.me/${OWNER_NUMBER.split("@")[0]}\n*GitHub:* github.com/yamdhund` });
        }
        
        else if (command === "botinfo") {
            const totalMem = os.totalmem() / 1024 / 1024 / 1024;
            const freeMem = os.freemem() / 1024 / 1024 / 1024;
            const usedMem = totalMem - freeMem;
            await sock.sendMessage(chatId, { 
                text: `*🤖 Bot Information*\n\n*Name:* ${BOT_NAME}\n*Version:* 2.0.0\n*Owner:* YAMDHUD\n*Uptime:* ${moment.duration(process.uptime(), 'seconds').humanize()}\n*RAM:* ${usedMem.toFixed(2)}/${totalMem.toFixed(2)} GB\n*Platform:* ${os.platform()}\n*Node.js:* ${process.version}`
            });
        }
        
        // ========== DOWNLOADER COMMANDS ==========
        else if (command === "ytv" || command === "ytmp4") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}ytv <youtube_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Downloading video, please wait..." });
            try {
                const info = await ytdl.getInfo(args[0]);
                const format = ytdl.chooseFormat(info.formats, { quality: '18' });
                await sock.sendMessage(chatId, { 
                    video: { url: format.url },
                    caption: `*Title:* ${info.videoDetails.title}\n*Duration:* ${info.videoDetails.lengthSeconds}s`
                });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Failed to download video!" });
            }
        }
        
        else if (command === "yta" || command === "ytmp3") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}yta <youtube_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Downloading audio, please wait..." });
            try {
                const info = await ytdl.getInfo(args[0]);
                const audioFormat = ytdl.chooseFormat(info.formats, { quality: '140' });
                await sock.sendMessage(chatId, { 
                    audio: { url: audioFormat.url },
                    mimetype: 'audio/mpeg',
                    fileName: `${info.videoDetails.title}.mp3`
                });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Failed to download audio!" });
            }
        }
        
        else if (command === "fb" || command === "facebook") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}fb <facebook_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Downloading Facebook video..." });
            try {
                const response = await axios.get(`https://api.siputzx.my.id/api/d/fb?url=${encodeURIComponent(args[0])}`);
                if (response.data.status && response.data.data.hd) {
                    await sock.sendMessage(chatId, { video: { url: response.data.data.hd }, caption: "Facebook video downloaded!" });
                } else {
                    await sock.sendMessage(chatId, { text: "❌ Failed to get video!" });
                }
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Error downloading Facebook video!" });
            }
        }
        
        else if (command === "ig" || command === "instagram") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}ig <instagram_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Downloading Instagram content..." });
            try {
                const response = await axios.get(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(args[0])}`);
                if (response.data.status && response.data.data.length > 0) {
                    for (let media of response.data.data.slice(0, 3)) {
                        if (media.type === 'video') {
                            await sock.sendMessage(chatId, { video: { url: media.url } });
                        } else {
                            await sock.sendMessage(chatId, { image: { url: media.url } });
                        }
                        await delay(1000);
                    }
                } else {
                    await sock.sendMessage(chatId, { text: "❌ Failed to get media!" });
                }
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Error downloading Instagram content!" });
            }
        }
        
        else if (command === "tiktok") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}tiktok <tiktok_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Downloading TikTok video..." });
            try {
                const response = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(args[0])}`);
                if (response.data.status && response.data.data.nowm) {
                    await sock.sendMessage(chatId, { video: { url: response.data.data.nowm }, caption: "TikTok video without watermark!" });
                } else {
                    await sock.sendMessage(chatId, { text: "❌ Failed to download TikTok video!" });
                }
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Error downloading TikTok video!" });
            }
        }
        
        else if (command === "twitter" || command === "tw") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}twitter <tweet_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Downloading Twitter media..." });
            try {
                const response = await axios.get(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(args[0])}`);
                if (response.data.status && response.data.data.hd) {
                    await sock.sendMessage(chatId, { video: { url: response.data.data.hd }, caption: "Twitter video downloaded!" });
                } else {
                    await sock.sendMessage(chatId, { text: "❌ Failed to download Twitter media!" });
                }
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Error downloading Twitter media!" });
            }
        }
        
        else if (command === "mediafire") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}mediafire <mediafire_url>` });
                return;
            }
            await sock.sendMessage(chatId, { text: "⏬ Getting Mediafire link..." });
            try {
                const response = await axios.get(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(args[0])}`);
                if (response.data.status) {
                    await sock.sendMessage(chatId, { text: `*Title:* ${response.data.data.title}\n*Size:* ${response.data.data.size}\n*Link:* ${response.data.data.link}` });
                } else {
                    await sock.sendMessage(chatId, { text: "❌ Failed to get Mediafire link!" });
                }
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Error fetching Mediafire link!" });
            }
        }
        
        // ========== MEDIA COMMANDS ==========
        else if (command === "sticker" || command === "s") {
            if (msg.message.imageMessage || msg.message.videoMessage) {
                const mediaMessage = msg.message.imageMessage || msg.message.videoMessage;
                const stream = await downloadContentFromMessage(mediaMessage, msg.message.imageMessage ? 'image' : 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                await sock.sendMessage(chatId, { sticker: buffer }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: `*Usage:* Reply to an image/video with ${PREFIX}sticker` });
            }
        }
        
        else if (command === "toimage") {
            if (msg.message.stickerMessage) {
                const stickerMsg = msg.message.stickerMessage;
                const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                await sock.sendMessage(chatId, { image: buffer }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: `*Usage:* Reply to a sticker with ${PREFIX}toimage` });
            }
        }
        
        // ========== TOOLS COMMANDS ==========
        else if (command === "qr") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}qr <text/link>` });
                return;
            }
            const qrText = args.join(" ");
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrText)}`;
            await sock.sendMessage(chatId, { image: { url: qrUrl }, caption: `QR Code for: ${qrText}` });
        }
        
        else if (command === "shorturl") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}shorturl <url>` });
                return;
            }
            try {
                const shortResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`);
                await sock.sendMessage(chatId, { text: `*Shortened URL:*\n${shortResponse.data}` });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Failed to shorten URL!" });
            }
        }
        
        else if (command === "calc" || command === "calculate") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}calc 2+2` });
                return;
            }
            try {
                const result = eval(args.join(" "));
                await sock.sendMessage(chatId, { text: `*Result:* ${result}` });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Invalid calculation!" });
            }
        }
        
        else if (command === "weather") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}weather <city_name>` });
                return;
            }
            try {
                const city = args.join(" ");
                const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=bd5e378503939ddaee76f12ad7a97608&units=metric`);
                const data = weatherRes.data;
                await sock.sendMessage(chatId, { 
                    text: `*Weather in ${data.name}*\n\n🌡️ Temperature: ${data.main.temp}°C\n💧 Humidity: ${data.main.humidity}%\n🌬️ Wind: ${data.wind.speed} m/s\n📝 Condition: ${data.weather[0].description}`
                });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ City not found!" });
            }
        }
        
        else if (command === "wiki") {
            if (!args[0]) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}wiki <query>` });
                return;
            }
            try {
                const wikiRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.join(" "))}`);
                await sock.sendMessage(chatId, { 
                    text: `*${wikiRes.data.title}*\n\n${wikiRes.data.extract.substring(0, 1000)}\n\nRead more: ${wikiRes.data.content_urls.desktop.page}`
                });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ No Wikipedia page found!" });
            }
        }
        
        else if (command === "translate") {
            if (args.length < 2) {
                await sock.sendMessage(chatId, { text: `*Usage:* ${PREFIX}translate <language_code> <text>\nExample: ${PREFIX}translate hi Hello` });
                return;
            }
            const targetLang = args[0];
            const textToTranslate = args.slice(1).join(" ");
            try {
                const translateRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
                const translated = translateRes.data[0][0][0];
                await sock.sendMessage(chatId, { text: `*Translation (${targetLang}):*\n${translated}` });
            } catch (error) {
                await sock.sendMessage(chatId, { text: "❌ Translation failed!" });
            }
        }
        
        // ========== REACTION COMMANDS ==========
        else if (command === "hug") {
            const mentionedUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            await sock.sendMessage(chatId, { text: `🤗 *@${sender.split("@")[0]}* hugged *@${mentionedUser.split("@")[0]}*!`, mentions: [sender, mentionedUser] });
        }
        
        else if (command === "kiss") {
            const mentionedUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            await sock.sendMessage(chatId, { text: `😘 *@${sender.split("@")[0]}* kissed *@${mentionedUser.split("@")[0]}*! 💋`, mentions: [sender, mentionedUser] });
        }
        
        else if (command === "slap") {
            const mentionedUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            await sock.sendMessage(chatId, { text: `👋 *@${sender.split("@")[0]}* slapped *@${mentionedUser.split("@")[0]}*! 💥`, mentions: [sender, mentionedUser] });
        }
        
        else if (command === "pat") {
            const mentionedUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            await sock.sendMessage(chatId, { text: `🖐️ *@${sender.split("@")[0]}* patted *@${mentionedUser.split("@")[0]}*! 🥰`, mentions: [sender, mentionedUser] });
        }
        
        else if (command === "poke") {
            const mentionedUser = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            await sock.sendMessage(chatId, { text: `👉 *@${sender.split("@")[0]}* poked *@${mentionedUser.split("@")[0]}*!`, mentions: [sender, mentionedUser] });
        }
        
        else if (command === "dance") {
            await sock.sendMessage(chatId, { text: `💃 *@${sender.split("@")[0]}* is dancing! 🕺`, mentions: [sender] });
        }
        
        else if (command === "cry") {
            await sock.sendMessage(chatId, { text: `😭 *@${sender.split("@")[0]}* is crying! 🥺`, mentions: [sender] });
        }
        
        // ========== GROUP COMMANDS ==========
        else if (command === "tagall" && isGroup) {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;
            let mentionText = "*📢 Attention everyone!*\n\n";
     
