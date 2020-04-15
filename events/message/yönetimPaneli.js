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

    let tooGame = tooGames.find(tooGame => tooGame && tooGame.mode == 0 && tooGame.ownerID == message.author.id && tooGame.isStarted && !tooGame.isFinished)
    if (!tooGame) return //console.log("Yöneticisi olduğu başlayan bir oyun yok!")

    let komut = message.content.toLowerCase();

    if (komut.startsWith("canlandır")) {
        let reviveID = komut.replace("canlandır", "").trim();
        client.revivePlayer(tooGame, reviveID, tooGame.ownerID)
        let ölüler = tooGame.dead;
        delete ölüler[reviveID]
        message.channel.send(client.embed()
            .setTitle("YÖNETİM")
            .setDescription("<@" + reviveID + "> canlandırıldı!")
            .addField("Ölüler:", JSON.stringify(ölüler))
        )
    }

    if (komut.startsWith("unmute")) {
        let unmuteSıra = komut.replace("unmute", "").trim();
        let unmuteID = db.get(`tooGames_${guild.id}.${tooGame.id}.list.${tooGame.ownerID}.${unmuteSıra - 1}`)
        if (!unmuteID) return message.reply("Geçerli sayı girilmemiş!")
        client.unmutePlayer(tooGame, unmuteID, tooGame.ownerID)
        let yaşayanlar = tooGame.alive;
        delete yaşayanlar[unmuteID]
        message.channel.send(client.embed()
            .setTitle("YÖNETİM")
            .setDescription("<@" + unmuteID + "> mikrofonu açıldı!")
            //.addField("Ölüler:", JSON.stringify(ölüler))
        )
    }
    if (komut.startsWith("mute")) {
        let muteSıra = komut.replace("mute", "").trim();
        let muteID = db.get(`tooGames_${guild.id}.${tooGame.id}.list.${tooGame.ownerID}.${muteSıra - 1}`)
        if (!muteID) return message.reply("Geçerli sayı girilmemiş!")
        client.mutePlayer(tooGame, muteID, tooGame.ownerID)
        let yaşayanlar = tooGame.alive;
        delete yaşayanlar[muteID]
        message.channel.send(client.embed()
            .setTitle("YÖNETİM")
            .setDescription("<@" + muteID + "> mikrofonu kapandı!")
            //.addField("Ölüler:", JSON.stringify(ölüler))
        )
    }

    switch (komut) {
        case 'props sıfırla':
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps`, ayarlar.createTooGame().roleProps)
            message.channel.send(client.embed()
                .setTitle("YÖNETİM")
                .setDescription(JSON.stringify(db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps`))))
            break;
        case 'medusa sıfırla':

            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.Medusa.selfLimit`, 3)

            let embed3 = client.embed()
                .setTitle("YÖNETİM")
                .setDescription("Medusa'nın hakları yenilendi: " + db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.Medusa.selfLimit`))

            message.channel.send(embed3)
            break;
        case 'gece ölümleri':
            let embed = client.embed()
                .setTitle("YÖNETİM")

            if (Object.keys(tooGame.lastDeaths).length > 0)
                embed.addField("GECE ÖLENLER", "<@" + Object.keys(tooGame.lastDeaths).join(">\n<@") + ">")

            message.channel.send(embed)
            break;
        case 'durum':
            let embed2 = client.embed()
                .setTitle("YÖNETİM")


            if (Object.keys(tooGame.alive).length > 0)
                embed2.addField("YAŞAYANLAR", "<@" + Object.keys(tooGame.alive).join(">\n<@") + ">")
            if (Object.keys(tooGame.dead).length > 0)
                embed2.addField("ÖLÜLER", "<@" + Object.keys(tooGame.dead).join(">\n<@") + ">")

            message.channel.send(embed2)
            break;
        case 'gece':
            if (tooGame.isVoting) return message.channel.send("Gece yapabilmek için oylamanın bitmesi gerekiyor.\n\n`oylama bitir` yazarak oylamayı bitirebilirsiniz.")
            message.react("🌙")
            client.setNight(tooGame);
            break;
        case 'gündüz':
            message.react("☀️")
            client.setDay(tooGame);
            break;
        case 'oylama başlat':
            if (tooGame.day.current == 0) return message.channel.send("Gece oylama açılamaz!")
            if (tooGame.isVoting) return message.channel.send("Zaten açık bir oylama bulunuyor!")
            client.startVoting(tooGame)
            break;
        case 'oylama bitir':
            if (!tooGame.isVoting) return message.channel.send("Açık bir oylama bulunmuyor!\n\n`oylama başlat` yazarak oylama açabilirsiniz.")
            if (tooGame.day.current == 0) return message.channel.send("Gece oylama bitirelemez!")
            client.endVoting(tooGame)
            break;
        case 'oyunu bitir':
            client.endGame(tooGame, tooGame.ownerID)
            break;
        default:
            break;
    }

}