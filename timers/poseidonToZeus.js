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

        let başlamışOyunlar = tooGames.filter(tooGame => tooGame && !Object.values(tooGame.alive).some(rol => rol == "Zeus") && Object.values(tooGame.alive).some(rol => rol == "Poseidon") && tooGame.isStarting && !tooGame.isFinished)

        başlamışOyunlar.forEach(async tooGame => {
            let targetRole = "Poseidon"
            let changedRole = "Zeus"

            let players = [];
            tooGame.roles[targetRole].forEach(id => {
                players.push(id)
            });
            players.forEach(targetID => {
                // eski rolü kaldır
                db.set(`tooGames_${guild.id}.${tooGame.id}.roles.${targetRole}`, db.get(`tooGames_${guild.id}.${tooGame.id}.roles.${targetRole}`).filter(id => id != targetID))
                // yeni rolü kaydet
                db.push(`tooGames_${guild.id}.${tooGame.id}.roles.${changedRole}`, targetID)
                if (tooGame.alive.hasOwnProperty(targetID))
                    db.set(`tooGames_${guild.id}.${tooGame.id}.alive.${targetID}`, changedRole)
                if (tooGame.dead.hasOwnProperty(targetID))
                    db.set(`tooGames_${guild.id}.${tooGame.id}.dead.${targetID}`, changedRole)

                let changedInfoEmbed = client.embed()
                    .setAuthor("ROL DEĞİŞİMİ GERÇEKLEŞTİ!")
                    .setTitle("YENİ ROLÜN : **" + changedRole.toUpperCase() + "**!")
                    .setDescription("_Hayatta olan " + changedRole + " bulunamadığı için " + changedRole + "'a dönüştün!_")
                    .addField(changedRole.toUpperCase(), (ayarlar.rolBilgileri[changedRole] ? ayarlar.rolBilgileri[changedRole] : "Rol açıklaması bulunamadı. Lütfen yetkililere bildiriniz!"))
                    .setImage(ayarlar.rolResimleri[changedRole] ? ayarlar.rolResimleri[changedRole] : "")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, changedInfoEmbed, targetID);
            });

        });

    }, 1000);
}


