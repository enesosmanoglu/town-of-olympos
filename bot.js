console.log("\n ".repeat(12))
console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
console.log("Bot başlatılıyor. Lütfen bekleyiniz...")
console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")


const express = require("express");
const app = express();
const http = require("http");
app.get("/", (request, response) => {
    console.log(`¨`);
    response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 10000);

//////////////////////////////////////////////////////////////////////

/* Modüller */
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const db = require("quick.db");
const moment = require("moment");
moment.locale('tr');
const ayarlar = require("./ayarlar");
const eventLoader = require("./util/eventLoader")(client);

const activities_list = ["ria"];

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

getCommands("./komutlar/");
let komutlar = [];
function getCommands(path) {
    fs.readdir(path, (err, files) => {
        if (err) console.error(err);
        files.forEach(f => {
            if (!f.endsWith(".js")) {
                // klasör ya da komut değil
                if (fs.lstatSync(path + f + "/").isDirectory()) {
                    // iç içe fonksiyonla tüm alt klasörlerdeki komutları tarıyoruz.
                    getCommands(path + f + "/");
                }
            } else {
                //console.log(path + f) // Her komutun yolunu ayrı ayrı loglar
                //komut.js
                let props = require(`${path}${f}`);
                komutlar.push(props.help.name);
                client.commands.set(props.help.name, props);
                props.conf.aliases.forEach(alias => {
                    client.aliases.set(alias, props.help.name);
                });
            }
        });
    });
};


client.on("warn", (data) => { console.log("warn:", data) });
//client.on("debug", (data) => {console.log("debug:",data)});   

client.on("shardDisconnect", (data) => { console.log("shardDisconnect:", data) });
client.on("shardError", (data) => { console.log("shardError:", data) });
client.on("shardReady", (data) => { console.log("shardReady:", data) });
client.on("shardReconnecting", (data) => { console.log("shardReconnecting:", data) });
client.on("shardResume", (data) => { console.log("shardResume:", data) });

client.on("invalidated", () => { console.log("invalidated") });
client.on("error", (data) => { console.log("error:", data) });

var hataKontrol = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;

client.on("disconnect", e => {
    console.log("[Botun bağlantısı kaybedildi! id:" + client.id);
});

client.login(process.env.TOKEN);