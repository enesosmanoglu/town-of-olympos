//TK Yetkili kişisinin bulunduğu oda oyun odası seçilerek 'tk-odaları' text odasına 'x' ses odasında yeni oyun oluşturulmuştur
//tarzı bi bilgi mesajı atılır ve oyun başlatma komutu gelene kadar odaya katılan kişilerin isimleri bu bilgi mesajına editlenir. (max 15 kişi)
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {
   
};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    perms: ["TK Yetkili"]
};
exports.help = {
    name: komutAdı,
    description: ``,
    usage: `${komutAdı}`
};