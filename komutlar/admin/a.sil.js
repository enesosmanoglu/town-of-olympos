// oyun erken sonlandırıldı
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {
    if (!args[0])
        return message.reply("Oyun kodu gir")

    let tooGame = db.get(`tooGames_${message.guild.id}.${args[0]}`)
    if (!tooGame) return message.reply("Seçilen koda ait oyun bulunamadı.")

    if (!tooGame.isFinished) return message.reply("Silmek için oyunun bitmesi gerekiyor!")

    const embed = new Discord.MessageEmbed()
        .setAuthor(message.member.displayName, message.author.displayAvatarURL())
        .setTitle(`Town of Olympos - #${args[0]}`)
        .setDescription(`Oyun kaydı <@${message.author.id}> tarafından silindi.`)

    message.guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
        .then(tooGameMessage => {
            tooGameMessage.edit({ embed: embed })
                .then(async msg => {

                    await db.delete(`tooGames_${message.guild.id}.${args[0]}`)
                    await db.set(`tooGames_${message.guild.id}`, db.get(`tooGames_${message.guild.id}`).filter(g => g))
                    await console.log(db.get(`tooGames_${message.guild.id}`))
                    await console.log(`${msg.embeds[0].title} | ${msg.embeds[0].description}`)
                    await message.channel.send(embed).then(msg => msg.delete({ timeout: 10000 }))

                })
                .catch(console.error);
        })
        .catch(console.error)


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