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

        let başlamışOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)

        başlamışOyunlar.forEach(async tooGame => {
            let desc = {}
            Object.keys(ayarlar.sınıflandırma).forEach(sınıf => {
                if (!desc[sınıf]) desc[sınıf] = []
            });
            Object.keys(tooGame.alive).forEach(userID => {
                let role = tooGame.alive[userID];
                let sınıf = Object.keys(ayarlar.sınıflandırma).find(sınıf => ayarlar.sınıflandırma[sınıf].some(r => r == role));
                if (!sınıf) return
                desc[sınıf].push("**" + role + "**: <@" + userID + ">")
            });

            if (Object.keys(tooGame.alive).length == 2) {
                // sona 2 kişi kalmış
                if (Object.values(tooGame.alive).some(rol => rol == "Aphrodite")) {
                    //son 2ye Aphrodite kalmış
                    console.log("Aphrodite kazandı.")
                    let winnerIDs = Object.keys(tooGame.alive).filter(id => tooGame.alive[id] == "Aphrodite")
                    let winners = {}
                    winnerIDs.forEach(id => {
                        winners[id] = tooGame.alive[id]
                    });

                    let loserIDs = Object.keys(tooGame.alive).filter(id => tooGame.alive[id] != "Aphrodite")
                    let losers = {}
                    loserIDs.forEach(id => {
                        losers[id] = tooGame.alive[id]
                    });
                    Object.assign(tooGame.dead, losers)
                    tooGame.alive = winners;

                    client.endGame(tooGame)
                }
                return;
            }

            if ((desc.kötü.length != 0) && (desc.tarafsız.length == 0) && (desc.iyi.length == 0)) {
                // kötüler kazandı
                client.endGame(tooGame)
                console.log("Kötüler kazandı.")
                return;
            } else if ((desc.kötü.length == 0) && (desc.tarafsız.length == 0) && (desc.iyi.length != 0)) {
                // iyiler kazandı
                client.endGame(tooGame)
                console.log("İyiler kazandı.")
                return;
            } else if ((desc.kötü.length == 0) && (desc.tarafsız.length != 0) && (desc.iyi.length == 0)) {
                // tarafsızlar sona kalmış
                if (desc.tarafsız.length == 1) {
                    // sona tek tarafsız kalmış
                    client.endGame(tooGame)
                    console.log(desc.tarafsız[0] + " kazandı.")
                }
            }
        });

    }, 1000);
}


