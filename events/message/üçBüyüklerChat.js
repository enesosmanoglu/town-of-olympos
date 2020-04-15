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

    if (!ayarlar.rolPaketleri.büyükTanrılar.some(role => role == rol))
        return // büyük tanrı değilse sg

    let props = tooGame.roleProps[rol];

    let mesaj = message.content.toLowerCase();

    if (!mesaj.startsWith("-")) return;
    if (props.isInJail) return console.log("inJail")

    message.react("⚫")

    mesaj = mesaj.replace("-", "")

    Object.keys(tooGame.alive).filter(aliveID => aliveID != message.author.id && ayarlar.rolPaketleri.büyükTanrılar.some(role => role == tooGame.alive[aliveID])).forEach(aliveID => {

        let embed = client.embed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setTitle(rol)
            .setDescription(mesaj)

        client.sendEmbedToAlive(tooGame, embed, aliveID)
            .then(async () => {
                await message.react("🔵")
                let exReact = message.reactions.cache.find(r => r.emoji.name == "⚫");
                if (exReact)
                    await exReact.users.remove(client.user)
            })

    });

}