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

    client.lastTooGames = {}

    let tooGames = db.get(`tooGames_${guild.id}`)
    if (tooGames) {
        tooGames.filter(g => g).forEach(tooGame => {
            client.lastTooGames[tooGame.id] = tooGame
            console.log("    loaded game #" + tooGame.id)
        });
    }

    client.setInterval(async () => {
        let now = parseInt(moment().utcOffset(3).format('x'))

        let tooGames = db.get(`tooGames_${guild.id}`)

        if (!tooGames) return; // hiç oyun yok

        let başlamamışOyunlar = tooGames.filter(tooGame => tooGame && !tooGame.isStarted && !tooGame.isFinished)
        let başlamışOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)
        let bitmişOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isFinished)

        başlamışOyunlar.forEach(async tooGame => {
            if (!tooGame.timestamps) return;

            if (!client.lastTooGames[tooGame.id] || client.lastTooGames[tooGame.id].day.current != tooGame.day.current || client.lastTooGames[tooGame.id].day.count != tooGame.day.count) {
                if (!client.lastTooGames[tooGame.id]) {
                    client.lastTooGames[tooGame.id] = tooGame
                }

                client.lastTooGames[tooGame.id].day.current = tooGame.day.current
                client.lastTooGames[tooGame.id].day.count = tooGame.day.count
                console.log("#" + tooGame.id + " gece/gündüz değişti. Gece/Gündüz durumu: " + tooGame.day.current)

                if (tooGame.day.count == 1) {
                    // ilk gün
                    console.log("#" + tooGame.id + " ilk defa " + (tooGame.day.current ? "gündüz" : "gece") + " oldu.")
                    if (tooGame.day.current == 0) {
                        // ilk kez gece oldu
                        client.nightEvents(tooGame);
                    } else {
                        // ilk kez gündüz oldu
                        client.dayEvents(tooGame);
                    }
                } else {
                    // diğer günler
                    await console.log("#" + tooGame.id + " gece/gündüz değişti. Gece/Gündüz durumu: " + tooGame.day.current)
                    if (tooGame.day.current == 0) {
                        //gece oldu
                        client.nightEvents(tooGame);
                    } else {
                        // gündüz oldu
                        client.dayEvents(tooGame);
                    }
                }

            }

        });

    }, 1000);
}


