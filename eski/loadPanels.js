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

    let başlamışModluOyunlar = tooGames.filter(tooGame => tooGame && tooGame.mode == 0 && tooGame.isStarted && !tooGame.isFinished)

    başlamışModluOyunlar.forEach(async tooGame => {
        let ownerID = tooGame.ownerID;
        let ownerMember = guild.members.cache.find(m => m.id == ownerID);
        if (!ownerMember) return console.error(ownerID + " id'li üye bulunamadı!")

        let msg = tooGame.ownerPanelMsg;
        if (!msg) return console.error(ownerID + " id'li üyenin paneli bulunamadı!")

        client.getDmMessage(ownerMember.user, msg.id)
            .then(message => {
            console.log(message.id)
                client.activatePanel(tooGame, message);
            }) 
            .catch(err => {
                if (err.message == "Unknown Message") {
                    client.dmOwnerPanel(tooGame)
                } else {console.error(err)}
            })

    })
}



