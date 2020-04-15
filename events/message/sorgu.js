const Discord = require("discord.js");
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const moment = require("moment");
const fs = require("fs");


module.exports = async message => {
    if (message.author.bot) return; // bot mesajlarını sayma
    if (message.channel.type != "dm") return; // sadece dm mesajları sayılacak

    const client = message.client;
    const guild = client.guilds.cache.find(g => g.id == ayarlar.sunucu);
    if (!guild) return console.error("Ana sunucu bulunamadı! (ayarlar.sunucu).")

    let tooGames = db.get(`tooGames_${guild.id}`)
    if (!tooGames) return //console.log("Sunucuda hiç oyun bulunamadı!")

    let tooGame = tooGames.find(tooGame => tooGame && Object.keys(tooGame.alive).some(i => i == message.author.id) && tooGame.isStarted && !tooGame.isFinished)
    if (!tooGame) return //console.log("Kişinin yaşadığı başlamış bir oyun yok!")

    let rol = client.findRole(tooGame, message.author.id);
    let props = tooGame.roleProps[rol];

    if (!props.isInJail && rol != "Athena") return;

    let mesaj = message.content.toLowerCase();

    if (mesaj.startsWith(".")) {
        message.react("⚫")
        let content = mesaj.replace(".", "")
        if (props.jailTargetID) {
            // mesajı yazan jailor
            let jailorMessageEmbed = client.embed()
                .setAuthor(rol)
                .setDescription(content)

            client.sendEmbedToAlive(tooGame, jailorMessageEmbed, props.jailTargetID)
                .then(async msg => {
                    await message.react("🔵")
                    await message.reactions.cache.find(r => r.emoji.name == "⚫").users.remove(client.user)
                })
        } else if (props.jailorID) {
            // mesajı yazan suçlu
            let jailorMessageEmbed = client.embed()
                .setAuthor(message.author.tag)
                .setDescription(content)
            client.sendEmbedToAlive(tooGame, jailorMessageEmbed, props.jailorID)
                .then(async msg => {
                    await message.react("🔵")
                    await message.reactions.cache.find(r => r.emoji.name == "⚫").users.remove(client.user)
                })
        }
    } else if (mesaj == "öldür") {
        if (props.jailTargetID) {
            // mesajı yazan jailor
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.killSelected`, true);
            message.react("a:OnaylamakGif:688437605821710516")
        }
    }

}