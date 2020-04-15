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

    let mesaj = message.content.toLowerCase();

    if (mesaj.startsWith("gece") && mesaj.replace("gece", "").split("-")[0].trim().match(/^[0-9\b]+$/)) { // gece 1 - bu gece bizim olsa
        let content = mesaj.split("-")
        let geceContent = content.shift().trim();

        let geceNo = parseInt(geceContent.match(/(\d+)/g)[0]);
        if (geceNo == 0) return message.react("a:ReddetmekGif:688437617330749701");
        if (geceNo > 50) return message.react("a:ReddetmekGif:688437617330749701");
        let not = content.join("-").trim();
        if (!not) return message.react("a:ReddetmekGif:688437617330749701");

        await db.set(`tooGames_${guild.id}.${tooGame.id}.notes.${message.author.id}.${geceNo - 1}`, not)[0].notes[message.author.id];
        await message.react("a:OnaylamakGif:688437605821710516"); // a:accept:608028438137274373
        await console.log("[NOT] " + message.author.tag + " ( " + rol + " ) : " + geceNo + ". " + not)
    } else if (mesaj == "notum") {
        let notlar = db.has(`tooGames_${guild.id}.${tooGame.id}.notes.${message.author.id}`) ? db.get(`tooGames_${guild.id}.${tooGame.id}.notes.${message.author.id}`) : []

        let desc = []
        let i = 1;
        notlar.forEach(not => {
            if (!not) return i++;
            desc.push("GECE " + (i.toString().length == 1 ? ("0" + i) : i) + " - " + not.replace(/`/g, "'"))
            i += 1;
        });
        if (notlar.length == 0)
            desc.push("**NOT BULUNAMADI!**")



        let notEmbed = client.embed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription("```swift\n" + desc.join("\n") + "```")
            .setColor(client.embedColor)

        message.channel.send(notEmbed)
    }

}