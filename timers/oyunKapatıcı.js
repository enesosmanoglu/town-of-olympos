const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");
const fs = require('fs');

module.exports = async client => {
    const guild = client.guilds.cache.find(g => g.id == ayarlar.sunucu);
    if (!guild) return console.error("Ana sunucu bulunamadı! (ayarlar.sunucu).")

    client.setInterval(async () => {
        let now = parseInt(moment().utcOffset(3).format('x'))

        let tooGames = db.get(`tooGames_${guild.id}`)

        if (!tooGames) return; // hiç oyun yok

        let bekleyenOyunlar = tooGames.filter(tooGame => tooGame && !tooGame.isStarting && !tooGame.isStarted && !tooGame.isFinished)

        bekleyenOyunlar.forEach(async tooGame => {
            if (!tooGame.timestamps) return;

            if (tooGame.players.length >= ayarlar.oyunAyarları.minKişi) return;

            if (now >= (tooGame.timestamps.lastPlayerJoined + ayarlar.oyunAyarları.oyuncuBeklemeSüresi * 1000)) {
                console.log("#" + tooGame.id + " yetersiz kişi sebebiyle kapatıldı.")

                delete tooGame.embed.description;

                tooGame.embed = new Discord.MessageEmbed(tooGame.embed)
                    .setFooter(tooGame.embed.title.replace(/`/g, ""))
                    .setAuthor("YETERSİZ KİŞİ SEBEBİYLE")
                    .setTitle("OYUN #" + tooGame.id +  " İPTAL EDİLDİ!")
                    .setColor("RED")

                let oyuncularDesc = tooGame.embed.fields[tooGame.embed.fields.length - 1].value.split("\n");
                if (oyuncularDesc[oyuncularDesc.length - 1].includes("iptal edilecek")) oyuncularDesc.pop()
                tooGame.embed.fields[tooGame.embed.fields.length - 1].value = oyuncularDesc.join("\n")

                guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
                    .then(tooGameMessage => {
                        tooGameMessage.edit({ embed: tooGame.embed })
                            //.then(msg => console.log(`Updated the content of a message to ${tooGame.embed.title}`))
                            .catch(console.error);
                    })
                    .catch(err => console.error)

                tooGame.isFinished = true;
                tooGame.timestamps.finished = now;
                await db.set(`tooGames_${guild.id}.${tooGame.id}`, tooGame)
            } else {
                const kalanSüre = parseInt(((tooGame.timestamps.lastPlayerJoined + ayarlar.oyunAyarları.oyuncuBeklemeSüresi * 1000) - now) / 1000);

                console.log("#" + tooGame.id + " iptal edilmesine kalan saniye: " + kalanSüre)
                if (kalanSüre <= 4) {
                    console.log("#" + tooGame.id + " iptal edilmesine kalan saniye: " + kalanSüre)
                    tooGame.embed = new Discord.MessageEmbed(tooGame.embed)
                        .setAuthor("OYUN " + ((kalanSüre <= 0) ? ("İPTAL EDİLİYOR!!") : (kalanSüre + " SANİYE SONRA İPTAL EDİLECEK!")))
                        .setColor("YELLOW")

                    let oyuncularDesc = tooGame.embed.fields[tooGame.embed.fields.length - 1].value.split("\n");
                    if (oyuncularDesc[oyuncularDesc.length - 1].includes("iptal edilecek")) {
                        if (kalanSüre) {
                            oyuncularDesc[oyuncularDesc.length - 1] = "**" + kalanSüre + " saniye içinde birisi girmezse oyun iptal edilecek!**"
                        } else {
                            oyuncularDesc.pop();
                        }
                    }

                    tooGame.embed.fields[tooGame.embed.fields.length - 1].value = oyuncularDesc.join("\n")

                    guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
                        .then(tooGameMessage => {
                            tooGameMessage.edit({ embed: tooGame.embed })
                                //.then(msg => console.log(`Updated the content of a message to ${tooGame.embed.title}`))
                                .catch(console.error);
                        })
                        .catch(err => console.error)

                }
            }
        });

    }, 1000);
}
