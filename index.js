const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const express = require("express");
const pino = require("pino");
const axios = require("axios");
const ytdl = require("ytdl-core");
const fs = require("fs");
const os = require("os");
const moment = require("moment");

const app = express();
const PORT = process.env.PORT || 3000;

const PREFIX = ".";
const BOT_NAME = "AYUSH BOT";
const OWNER = "917898573354@s.whatsapp.net";

app.get("/", (req, res) => {
    res.send("Bot Running Successfully ✅");
});

app.listen(PORT, () => {
    console.log("Server Running On Port " + PORT);
});

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Ayush Bot", "Chrome", "1.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("Scan QR Code");
            console.log(qr);
        }

        if (connection === "open") {
            console.log("Bot Connected ✅");
        }

        if (connection === "close") {

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log("Connection Closed");

            if (shouldReconnect) {
                startBot();
            }
        }
    });

    // ================= MESSAGE =================

    sock.ev.on("messages.upsert", async ({ messages }) => {

        try {

            const msg = messages[0];

            if (!msg.message || msg.key.fromMe) return;

            const chatId = msg.key.remoteJid;

            const body =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                "";

            if (!body.startsWith(PREFIX)) return;

            const args = body.slice(1).trim().split(/ +/);

            const command = args.shift().toLowerCase();

            const sender = msg.key.participant || msg.key.remoteJid;

            // ================= MENU =================

            if (command === "menu") {

                const uptime = process.uptime();

                const days = Math.floor(uptime / 86400);
                const hours = Math.floor(uptime / 3600) % 24;
                const minutes = Math.floor(uptime / 60) % 60;
                const seconds = Math.floor(uptime % 60);

                const menu = `
╔═══〔 ${BOT_NAME} 〕═══╗

👋 Hello User

⏰ Runtime : ${days}d ${hours}h ${minutes}m ${seconds}s
🕒 Time : ${moment().format("hh:mm:ss A")}
💻 RAM : ${(os.totalmem()/1024/1024/1024).toFixed(2)} GB

╭─❒ GENERAL ❒
│ .menu
│ .ping
│ .owner
│ .runtime
│ .botinfo
╰───────────

╭─❒ DOWNLOADER ❒
│ .ytv link
│ .yta link
│ .fb link
│ .ig link
│ .tiktok link
╰───────────

╭─❒ TOOLS ❒
│ .calc 2+2
│ .weather city
│ .wiki query
│ .shorturl link
│ .qr text
╰───────────

╭─❒ GROUP ❒
│ .tagall
│ .groupinfo
│ .leave
╰───────────

Made By Ayush
`;

                await sock.sendMessage(chatId, {
                    text: menu
                });
            }

            // ================= PING =================

            else if (command === "ping") {

                await sock.sendMessage(chatId, {
                    text: "🏓 Pong!"
                });
            }

            // ================= OWNER =================

            else if (command === "owner") {

                await sock.sendMessage(chatId, {
                    text: "👑 Owner : Ayush\n📱 wa.me/917898573354"
                });
            }

            // ================= BOTINFO =================

            else if (command === "botinfo") {

                await sock.sendMessage(chatId, {
                    text:
`🤖 BOT INFO

Name : ${BOT_NAME}
Platform : ${os.platform()}
Node : ${process.version}
RAM : ${(os.totalmem()/1024/1024/1024).toFixed(2)} GB`
                });
            }

            // ================= RUNTIME =================

            else if (command === "runtime") {

                const uptime = process.uptime();

                const days = Math.floor(uptime / 86400);
                const hours = Math.floor(uptime / 3600) % 24;
                const minutes = Math.floor(uptime / 60) % 60;
                const seconds = Math.floor(uptime % 60);

                await sock.sendMessage(chatId, {
                    text: `⏰ Runtime : ${days}d ${hours}h ${minutes}m ${seconds}s`
                });
            }

            // ================= CALC =================

            else if (command === "calc") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .calc 2+2"
                    });
                }

                try {

                    const result = eval(args.join(" "));

                    await sock.sendMessage(chatId, {
                        text: `Result : ${result}`
                    });

                } catch {

                    await sock.sendMessage(chatId, {
                        text: "Invalid Calculation"
                    });
                }
            }

            // ================= WEATHER =================

            else if (command === "weather") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .weather Delhi"
                    });
                }

                try {

                    const city = args.join(" ");

                    const weather = await axios.get(
                        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=bd5e378503939ddaee76f12ad7a97608&units=metric`
                    );

                    const data = weather.data;

                    await sock.sendMessage(chatId, {
                        text:
`🌤 Weather : ${data.name}

🌡 Temp : ${data.main.temp}°C
💧 Humidity : ${data.main.humidity}%
🌬 Wind : ${data.wind.speed} m/s
☁ Condition : ${data.weather[0].description}`
                    });

                } catch {

                    await sock.sendMessage(chatId, {
                        text: "City Not Found"
                    });
                }
            }

            // ================= SHORTURL =================

            else if (command === "shorturl") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .shorturl https://google.com"
                    });
                }

                try {

                    const short = await axios.get(
                        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`
                    );

                    await sock.sendMessage(chatId, {
                        text: `🔗 ${short.data}`
                    });

                } catch {

                    await sock.sendMessage(chatId, {
                        text: "Failed"
                    });
                }
            }

            // ================= WIKI =================

            else if (command === "wiki") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .wiki India"
                    });
                }

                try {

                    const query = args.join(" ");

                    const wiki = await axios.get(
                        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
                    );

                    await sock.sendMessage(chatId, {
                        text: `📖 ${wiki.data.title}\n\n${wiki.data.extract}`
                    });

                } catch {

                    await sock.sendMessage(chatId, {
                        text: "No Result Found"
                    });
                }
            }

            // ================= QR =================

            else if (command === "qr") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .qr Hello"
                    });
                }

                const text = args.join(" ");

                const qr = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;

                await sock.sendMessage(chatId, {
                    image: { url: qr },
                    caption: "QR Generated ✅"
                });
            }

            // ================= YTV =================

            else if (command === "ytv") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .ytv youtube_link"
                    });
                }

                try {

                    const info = await ytdl.getInfo(args[0]);

                    const format = ytdl.chooseFormat(info.formats, {
                        quality: "18"
                    });

                    await sock.sendMessage(chatId, {
                        video: {
                            url: format.url
                        },
                        caption: info.videoDetails.title
                    });

                } catch {

                    await sock.sendMessage(chatId, {
                        text: "Download Failed"
                    });
                }
            }

            // ================= YTA =================

            else if (command === "yta") {

                if (!args[0]) {
                    return sock.sendMessage(chatId, {
                        text: "Example : .yta youtube_link"
                    });
                }

                try {

                    const info = await ytdl.getInfo(args[0]);

                    const format = ytdl.chooseFormat(info.formats, {
                        quality: "140"
                    });

                    await sock.sendMessage(chatId, {
                        audio: {
                            url: format.url
                        },
                        mimetype: "audio/mpeg",
                        fileName: `${info.videoDetails.title}.mp3`
                    });

                } catch {

                    await sock.sendMessage(chatId, {
                        text: "Download Failed"
                    });
                }
            }

            // ================= TAGALL =================

            else if (command === "tagall") {

                if (!chatId.endsWith("@g.us")) {
                    return sock.sendMessage(chatId, {
                        text: "Group Only Command"
                    });
                }

                const groupMetadata = await sock.groupMetadata(chatId);

                const participants = groupMetadata.participants;

                let text = "📢 TAG ALL\n\n";

                let mentions = [];

                for (let p of participants) {

                    text += `@${p.id.split("@")[0]}\n`;

                    mentions.push(p.id);
                }

                await sock.sendMessage(chatId, {
                    text,
                    mentions
                });
            }

            // ================= GROUPINFO =================

            else if (command === "groupinfo") {

                if (!chatId.endsWith("@g.us")) {
                    return sock.sendMessage(chatId, {
                        text: "Group Only Command"
                    });
                }

                const metadata = await sock.groupMetadata(chatId);

                await sock.sendMessage(chatId, {
                    text:
`👥 Group : ${metadata.subject}

👤 Members : ${metadata.participants.length}

🆔 Group ID :
${metadata.id}`
                });
            }

            // ================= LEAVE =================

            else if (command === "leave") {

                if (sender !== OWNER) {
                    return sock.sendMessage(chatId, {
                        text: "Owner Only"
                    });
                }

                await sock.groupLeave(chatId);
            }

        } catch (err) {

            console.log(err);
        }
    });
}

startBot();
