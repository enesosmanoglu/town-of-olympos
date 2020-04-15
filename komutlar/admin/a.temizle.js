// oyun erken sonlandırıldı
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {
    client.lastTooGames = {}
    message.reply(db.set(`tooGames_${message.guild.id}`, []))
    let dbPath = `liste_${message.guild.id}.mutedPlayersID` 
    db.set(dbPath, [])
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