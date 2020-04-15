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

        let başlamamışOyunlar = tooGames.filter(tooGame => tooGame && !tooGame.isStarted && !tooGame.isFinished)
        let başlamışOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)
        let bitmişOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isFinished)

        başlamamışOyunlar.forEach(async tooGame => {
            if (!tooGame.timestamps) return;
            if (!tooGame.isStarting) return;

            if (now >= (tooGame.timestamps.starting + ayarlar.oyunAyarları.rolOkumaSüresi * 1000)) {
                console.log("#" + tooGame.id + " başladı.")

                delete tooGame.embed.description;

                tooGame.embed = new Discord.MessageEmbed(tooGame.embed)
                    .setTitle("OYUN BAŞLADI!")
                    .setColor("GREEN")

                if (tooGame.mode == 0) {
                    delete tooGame.embed.fields[0]
                    let playerID = tooGame.ownerID;
                    let playerMember = guild.members.cache.find(m => m.id == playerID);
                    if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")

                    tooGame.embed.setFooter(tooGame.embed.author.name, tooGame.embed.author.icon_url)
                    tooGame.embed.setAuthor(playerMember.displayName, playerMember.user.displayAvatarURL())
                }

                guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
                    .then(tooGameMessage => {
                        tooGameMessage.edit({ embed: tooGame.embed })
                            .then(msg => console.log(`Updated the content of a message to ${tooGame.embed.title}`))
                            .catch(console.error);
                    })
                    .catch(err => console.error)

                // Yönetici varsa yöneticiye özel dm
                if (tooGame.mode == 0) {
                    client.dmOwnerPanel(tooGame)
                }

                let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id)
                if (!oyunOdası) return console.error(tooGame.gameRoom.id + " id'li oyun odasını bulamıyorum. Oyun Kodu: #" + tooGame.id)

                await oyunOdası.updateOverwrite(guild.roles.everyone, {
                    SPEAK: false
                });
                await oyunOdası.updateOverwrite(guild.roles.cache.find(r => r.name == "TOO Yetkili"), {
                    SPEAK: tooGame.mode ? false : true
                });
                tooGame.players.forEach(async playerID => {
                    console.log("Players:" + JSON.stringify(tooGame.players))
                    await oyunOdası.updateOverwrite(playerID, {
                        SPEAK: true
                    });
                    let playerMember = guild.members.cache.find(m => m.id == playerID);
                    if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")
                    // if (playerMember.voice.channelID) {
                    //     playerMember.voice.setMute(true, "Oyun başladı!")
                    //         .then(async updatedMember => {
                    //             console.log(updatedMember.displayName + ": " + updatedMember.voice.serverMute)
                    //             let dbPath = `liste_${guild.id}.mutedPlayersID`

                    //             await db.push(dbPath, updatedMember.user.id) // pushla

                    //             //await console.log(db.get(dbPath))
                    //         }).catch(() => { })
                    // }
                }); 

                let infoMessages = db.get(`tooGames_${guild.id}.${tooGame.id}.infoMessages`);
                editInfoMessages(guild, infoMessages, "GREEN", "**OYUN BAŞLADI!**");

                tooGame.isStarted = true;
                tooGame.timestamps.started = now;
                tooGame.day.current = 1;
                tooGame.day.count += 1;
                await db.set(`tooGames_${guild.id}.${tooGame.id}`, tooGame)
            } else {
                const kalanSüre = parseInt(((tooGame.timestamps.starting + ayarlar.oyunAyarları.rolOkumaSüresi * 1000) - now) / 1000);
                console.log("#" + tooGame.id + " kalan saniye: " + kalanSüre)

                if (kalanSüre <= 3) {
                    tooGame.embed = new Discord.MessageEmbed(tooGame.embed)
                        .setTitle("OYUN " + ((kalanSüre <= 0) ? ("BAŞLIYOR!!") : (kalanSüre + " SANİYE SONRA BAŞLIYOR")))
                        .setColor("YELLOW")
                        .setDescription("Hazır olun!")

                    guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
                        .then(tooGameMessage => {
                            tooGameMessage.edit({ embed: tooGame.embed })
                                .then(msg => console.log(`Updated the content of a message to ${tooGame.embed.title}`))
                                .catch(console.error);
                        })
                        .catch(err => console.error)

                    let infoMessages = db.get(`tooGames_${guild.id}.${tooGame.id}.infoMessages`);
                    editInfoMessages(guild, infoMessages, "YELLOW", "**OYUN " + ((kalanSüre <= 0) ? ("BAŞLIYOR!!**") : (kalanSüre + " SANİYE SONRA BAŞLIYOR**")));
                }
            }
        });

    }, 1000);
}

function editInfoMessages(guild, infoMessages, color, title) {
    function editEmbed(message) {
        let editedEmbed = new Discord.MessageEmbed(message.embeds[0])
            .setColor(color)
            .setTitle(title)
        message.edit({ embed: editedEmbed })
    }

    Object.keys(infoMessages).forEach(userID => {  
        let msg = infoMessages[userID];

        let playerMember = guild.members.cache.find(m => m.id == userID);
        if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")

        if (playerMember.user.dmChannel) {
            // dm önceden kayıtlanmış
            let channel = playerMember.user.dmChannel;
            if (channel.messages.cache.has(msg.id)) {
                let message = channel.messages.cache.get(msg.id);
                editEmbed(message);
            } else {
                channel.messages.fetch(msg.id)
                    .then(message => {
                        if (!message) return console.error(playerID + " id'li üyenin dmsinde bilgi mesajı bulunamadı!")
                        editEmbed(message);
                    })
                    .catch(console.error);
            }
        } else {
            // dm kayıtlı değil 
            guild.client.channels.fetch(msg.channelID)
                .then(channel => {
                    if (channel.messages.cache.has(msg.id)) {
                        let message = channel.messages.cache.get(msg.id);
                        editEmbed(message);
                    } else {
                        channel.messages.fetch(msg.id)
                            .then(message => {
                                if (!message) return console.error(playerID + " id'li üyenin dmsinde bilgi mesajı bulunamadı!")
                                editEmbed(message);
                            })
                            .catch(console.error);
                    }
                })
                .catch(console.error)
        }

    });
}