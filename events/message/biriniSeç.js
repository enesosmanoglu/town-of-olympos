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
    if (!tooGames) return console.log("Sunucuda hiç oyun bulunamadı!")

    let tooGame = tooGames.find(tooGame => tooGame && Object.keys(tooGame.alive).some(i => i == message.author.id) && tooGame.isStarted && !tooGame.isFinished)
    if (!tooGame) return console.log("Kişinin yaşadığı başlamış bir oyun yok!")

    let rol = client.findRole(tooGame, message.author.id);

    console.log("rol: ", rol)
    console.log("day:", tooGame.day)

    if (rol != "Athena" && tooGame.day.current == 1)
        return console.log("gündüz sadece athena seçebilir")

    let props = tooGame.roleProps[rol];

    if (props.isInJail) return console.log("inJail")

    if (!props.skills) return console.log("no skill")

    let komut = message.content.toLowerCase();

    if (komut.startsWith("seç ")) {
        let args = komut.replace("seç ", "").split(" ").filter(g => g != "");

        let multipleChoice = props.skills.hasOwnProperty("selectedID2");

        if (args.length != (multipleChoice ? 2 : 1))
            return message.channel.send(client.embed()
                .setDescription("Eksik ya da fazla bilgi girdiniz!")
                .setColor("RED")
            );


        if (multipleChoice && !args[1])
            return message.channel.send(client.embed()
                .setDescription("Lütfen 2 adet sıra numarası giriniz. Örnek: `seç 6 9`")
                .setColor("RED")
            );

        let oyID = parseInt(args[0]);
        let oyID2 = multipleChoice ? parseInt(args[1]) : null;

        if (oyID == 0 || oyID2 == 0 || !client.sayıMı(args[0]) || (multipleChoice && !client.sayıMı(args[1])))
            return message.channel.send(client.embed()
                .setDescription("**Lütfen sadece listedeki sayılardan birini giriniz ◑.◑**")
                .setColor("RED")
            );

        let otherAlives = tooGame.list[message.author.id]
        if (!otherAlives) return console.log(message.author.id + " idli oyuncunun seçim listesi bulunamadı!")

        if (oyID > otherAlives.length || (multipleChoice && oyID2 > otherAlives.length))
            return message.channel.send(client.embed()
                .setDescription("**Lütfen sadece listedeki sayılardan birini giriniz ◑.◑**")
                .setColor("RED")
            );

        let votedUserID = otherAlives[oyID - 1]
        let votedUserID2 = multipleChoice ? otherAlives[oyID2 - 1] : null

        if (db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID`) || db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID1`)) {
            let exSelectedUserID = db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID` + (multipleChoice ? "1" : ""))
            let exSelectedUserID2 = multipleChoice ? db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID2`) : null

            console.log(message.author.id, " liste ", otherAlives.length)
            console.log(exSelectedUserID, votedUserID)
            if ((exSelectedUserID == votedUserID && (multipleChoice ? (exSelectedUserID2 == votedUserID2) : true)) || (multipleChoice && exSelectedUserID == votedUserID2 && exSelectedUserID2 == votedUserID)) {
                return await message.channel.send(client.embed()
                    .setDescription(`**${multipleChoice ? "Seçimlerinizi" : "Seçiminizi"} zaten daha önce <@${votedUserID}>${multipleChoice ? ` ve <@${votedUserID2}>` : ""} üzerinde kullandınız!**`)
                    .setColor("RED")
                )
            }

            // yenisini gönder
            await db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${message.author.id}.skills.selectedID` + (multipleChoice ? "1" : ""), votedUserID)
            await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID` + (multipleChoice ? "1" : ""), votedUserID)
            if (multipleChoice) {
                await db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${message.author.id}.skills.selectedID2`, votedUserID2)
                await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID2`, votedUserID2)
            }

            //zaten daha önce limitten kesildi.
            // if (db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`))
            //     await db.subtract(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, 1)
            // if (votedUserID == message.author.id || votedUserID2 == message.author.id)
            //     if (db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`))
            //         await db.subtract(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, 1)

            await message.channel.send(client.embed()
                .setDescription(`**${multipleChoice ? "Seçimlerinizi" : "Seçiminizi"} <@${votedUserID}>${multipleChoice ? ` ve <@${votedUserID2}>` : ""} olarak güncellediniz!**`)
                .setColor("BLUE")
            ).then(msg => {
                client.sendInfoToOwner(tooGame, `<@${message.author.id}>(${rol}) güncelledi:\n    <@${votedUserID}>(${client.findRole(tooGame, votedUserID)})${multipleChoice ? ` ve <@${votedUserID2}>(${client.findRole(tooGame, votedUserID2)})` : ""}`, "BLUE", false, false, false)
                client.reportToHermes(tooGame, `**${rol}** seçimini **${client.findRole(tooGame, votedUserID)}**${multipleChoice ? ` ve **${client.findRole(tooGame, votedUserID2)}**` : ""} olarak güncelledi.`)
            })
            return
        } else {
            // yenisini gönder
            await db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${message.author.id}.skills.selectedID` + (multipleChoice ? "1" : ""), votedUserID)
            await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID` + (multipleChoice ? "1" : ""), votedUserID)
            if (multipleChoice) {
                await db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${message.author.id}.skills.selectedID2`, votedUserID2)
                await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.selectedID2`, votedUserID2)
            }

            if (db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`)) {
                await db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${message.author.id}.exLimit`, props.limit)
                await db.subtract(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, 1)
            }
            if (votedUserID == message.author.id || votedUserID2 == message.author.id)
                if (db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`)) {
                    await db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${message.author.id}.exSelfLimit`, props.selfLimit)
                    await db.subtract(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, 1)
                }

            await message.channel.send(client.embed()
                .setDescription(`**${multipleChoice ? "Seçimlerinizi" : "Seçiminizi"} <@${votedUserID}>${multipleChoice ? ` ve <@${votedUserID2}>` : ""} üzerinde kullandınız!**`)
                .setColor("GREEN")
            ).then(msg => {
                client.sendInfoToOwner(tooGame, `<@${message.author.id}>(${rol}) seçti:\n    <@${votedUserID}>(${client.findRole(tooGame, votedUserID)})${multipleChoice ? ` ve <@${votedUserID2}>(${client.findRole(tooGame, votedUserID2)})` : ""}`, "GREEN", false, false, false)
                client.reportToHermes(tooGame, `**${rol}** seçimini **${client.findRole(tooGame, votedUserID)}**${multipleChoice ? ` ve **${client.findRole(tooGame, votedUserID2)}**` : ""} üzerinde kullandı.`)
            })

            return
        }


    }

}