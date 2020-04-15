// oyun erken sonlandırıldı
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {
    let guild = message.guild;

    if (!args[0])
        return message.reply("Oyun kodu gir")

    let tooGame = db.get(`tooGames_${guild.id}.${args[0]}`)
    if (!tooGame) return message.reply("Seçilen koda ait oyun bulunamadı.")

    //db.set(`tooGames_${guild.id}.${args[0]}.isFinished`, true)
    client.endGame(tooGame);



};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    perms: ["TOO Yetkili"]
};
exports.help = {
    name: komutAdı,
    description: ``,
    usage: `${komutAdı}`
};

