const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");
const fs = require('fs');

module.exports = async (client) => {
    const guild = client.guilds.cache.find(g => g.id == ayarlar.sunucu);
    if (!guild) return console.error("Ana sunucu bulunamadı! (ayarlar.sunucu).")

    let tooGames = db.get(`tooGames_${guild.id}`)
    if (!tooGames) return console.log("Sunucuda hiç oyun bulunamadı!")

    let başlamışOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)

    başlamışOyunlar.forEach(async tooGame => {
        if (!tooGame.isVoting) return;

        console.log("#" + tooGame.id + " - Loading voting panels...")

        Object.keys(tooGame.alive).forEach(aliveID => {
            let msgID = db.get(`tooGames_${guild.id}.${tooGame.id}.voteMsgIDs.${aliveID}`)
            if (!msgID) return console.error(aliveID + " id'li oyuncunun oylama panel mesajı bulunamadı!")

            client.getDmMessage(aliveID, msgID)
                .then(message => {
                    console.log(message.id)
                    client.activateVoting(tooGame, message);
                })
                .catch(err => {
                    if (err.message == "Unknown Message") {
                        client.sendVoting(tooGame, aliveID);
                    } else { console.error(err) }
                })



        });

    })
}



