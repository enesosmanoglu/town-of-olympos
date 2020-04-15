// oyun erken sonlandırıldı
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {
    await db.add(`tooGames_${message.guild.id}.${args[0]}.day.count`, 1)
    message.reply(args[0] + " oyununun gün sayısı arttırıldı.")
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