// oyun erken sonlandırıldı
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {

    let tooGames = db.get(`tooGames_${message.guild.id}`)

    if (!tooGames)
        return message.reply("Bu sunucuya ait hiçbir oyun bulunamadı!")

    let gamesListDesc = [];

    tooGames.forEach(tooGame => {
        gamesListDesc.push("`#" + tooGame.id + "`: " + tooGame.gameRoom.name + " (`" + tooGame.isStarting + "/" + tooGame.isStarted + "/" + tooGame.isFinished + "`)")
    }); 

    const embed = new Discord.MessageEmbed()
        .setAuthor(message.member.displayName, message.author.displayAvatarURL())
        .setTitle(`Town of Olympos - Oyun Listesi`)
        .setDescription(gamesListDesc.join("\n"))




    await message.channel.send(embed).then(msg => msg.delete({ timeout: 20000 }))

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