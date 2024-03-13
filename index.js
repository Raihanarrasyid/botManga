const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require("pino");
const {mangaToto, screenshot, mangaTotoDownload} = require("./manga")

async function  connectWa() {
    const auth = await useMultiFileAuthState("xinjian");
    const socket = makeWASocket({
        printQRInTerminal : true,
        auth : auth.state,
        browser : ["JianBrowser", "Safari", "1.0.0"],
        logger : pino({level : "silent"})
    })

    socket.ev.on("creds.update", auth.saveCreds);

    socket.ev.on("connection.update", async ({connection}) => {
        if(connection == "open"){
            console.log("JianBot Running Properly🔥");
        }else if (connection == "close"){
            console.log("Reconnecting");
            connectWa();
        }
    })

    socket.ev.on("messages.upsert", async ({messages, type}) => {
        const cht = messages[0];
        const number = cht.key?.remoteJid.includes("@g.us") ?
                       cht.key?.participant.replace(/[^0-9]/g, "") :
                       cht.key?.remoteJid.replace(/[^0-9]/g, "")
                       ;
        const pesan = (cht.message?.extendedTextMessage?.text ??
                       cht.message?.ephemeralMessage?.message?.extendedTextMessage?.text ??
                       cht.message?.conversation
            )?.toLowerCase() || " ";
        const command = pesan?.split(" ") ? pesan.split(" ")[0] : pesan;


        console.log(number + " : " + pesan)
        let url,datas,text;
        switch (command) {
            case "#ping":
                socket.sendMessage(cht.key.remoteJid, {text : "Menyala abangku🔥"}, {quoted : cht})
                break;
            case "#ss" :
                url = pesan.split(" ")[1];
                socket.sendMessage(cht.key.remoteJid, {text : "Processing⏳"}, {quoted : cht})
                await screenshot(url);
                await socket.sendMessage(cht.key.remoteJid, {image : {url : "./image/image.jpg"}, caption : "Screeenshot dari " + url })
                break;
            case "#mangatoto" :
                await socket.sendMessage(cht.key.remoteJid, {text : "Processing⏳"}, {quoted : cht})
                try {
                    datas = await mangaToto();
                    text = "";
                    for(const data of datas){
                        text += `\n📃${data.title}\n🏷️Genre : ${data.genre}\n📗Chapter: ${data.chp}\n📤UpdateAt : ${data.updateAt}\n\n`                
                    }
                    await socket.sendMessage(cht.key.remoteJid, {text : text})
                } catch (error) {
                    await socket.sendMessage(cht.key.remoteJid, {text : `Error : ${error}`})
                }
                break;
            case "#mangatotodownload" :
                console.log("masuk")
                url = pesan.split(" ")[1];
                await socket.sendMessage(cht.key.remoteJid, {text : "Processing⏳"}, {quoted : cht})
                datas = await mangaTotoDownload(url)
                text = "";

                await socket.sendMessage(cht.key.remoteJid, {text})
                break;
            default:
                break;
        }
    })
}

connectWa();
