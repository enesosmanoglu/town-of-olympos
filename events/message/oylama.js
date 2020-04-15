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

    let tooGame = tooGames.find(tooGame => tooGame && Object.keys(tooGame.alive).some(i => i == message.author.id) && tooGame.isVoting && tooGame.isStarted && !tooGame.isFinished)
    if (!tooGame) return //console.log("Kişinin yaşadığı başlamış bir oyun yok!")

    let komut = message.content.toLowerCase();

    if (komut == "notum") return;
    if (komut.startsWith("gece")) return;

    if (komut.match(/^[0-9\b]+$/) && komut != "0") {
        let oyID = parseInt(komut);

        let otherAlives = Object.keys(tooGame.alive).filter(id => id != message.author.id);

        if (oyID > otherAlives.length)
            return message.channel.send(client.embed()
                .setDescription("**Lütfen sadece listedeki sayılardan birini giriniz ◑.◑**")
                .setColor("RED")
            );

        if (db.has(`tooGames_${guild.id}.${tooGame.id}.votes`)) {

            let votes = db.get(`tooGames_${guild.id}.${tooGame.id}.votes`)
            let exVotedUserID = Object.keys(votes).find(votedUserID => votes[votedUserID].some(id => id == message.author.id))
            let votedUserID = otherAlives[oyID - 1]

            if (exVotedUserID == votedUserID) {
                return await message.channel.send(client.embed()
                    .setDescription("**Oyunuzu zaten daha önce <@" + votedUserID + "> üzerinde kullandınız!**")
                    .setColor("RED")
                )
            }

            if (exVotedUserID) {
                // eski verdiği oy varsa kaldır
                await db.set(`tooGames_${guild.id}.${tooGame.id}.votes.${exVotedUserID}`, db.get(`tooGames_${guild.id}.${tooGame.id}.votes.${exVotedUserID}`).filter(id => id != message.author.id))

                // yenisini gönder
                await db.push(`tooGames_${guild.id}.${tooGame.id}.votes.${votedUserID}`, message.author.id)
                await message.channel.send(client.embed()
                    .setDescription("**Oyunuzu <@" + votedUserID + "> olarak güncellediniz!**")
                    .setColor("BLUE")
                ).then(msg => {
                    client.sendInfoToOwner(tooGame, "<@" + message.author.id + "> oy'unu <@" + votedUserID + "> olarak güncelledi!", "BLUE", false, false, false)
                })
                return
            } else {
                // yenisini gönder
                await db.push(`tooGames_${guild.id}.${tooGame.id}.votes.${votedUserID}`, message.author.id)

                await message.channel.send(client.embed()
                    .setDescription("**Oyunuzu <@" + votedUserID + "> üzerinde kullandınız!**")
                    .setColor("GREEN")
                ).then(msg => {
                    client.sendInfoToOwner(tooGame, "<@" + message.author.id + "> oy'unu <@" + votedUserID + "> üzerinde kullandı!", "GREEN", false, false, false)
                })
                return
            }






            // if (!db.has(`tooGames_${guild.id}.${tooGame.id}.votes.${votedUserID}`))
            //     await db.set(`tooGames_${guild.id}.${tooGame.id}.votes.${votedUserID}`, [])

        }


    } else {
        return message.channel.send(client.embed()
            .setDescription("**Lütfen sadece listedeki sayılardan birini giriniz ◑.◑**")
            .setColor("RED")
        );
    }

}