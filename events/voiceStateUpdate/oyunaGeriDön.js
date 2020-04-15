const Discord = require("discord.js");
const db = require("quick.db");
const ayarlar = require("/app/ayarlar");
const moment = require("moment");
moment.locale("tr");

module.exports = async (oldVoiceState, newVoiceState) => {
    const guild = newVoiceState.guild;
    const client = newVoiceState.guild.client;
    const userID = newVoiceState.id;
    const user = client.users.cache.find(u => u.id == userID);
    const member = guild.member(user);

    const oldVoiceChannel = guild.channels.cache.find(c => c.id == oldVoiceState.channelID)
    const newVoiceChannel = guild.channels.cache.find(c => c.id == newVoiceState.channelID)

    let tooGames = db.get(`tooGames_${guild.id}`)
    if (!tooGames) return; // hiç oyun yok

    if ((!oldVoiceState.channelID && newVoiceState.channelID) || (oldVoiceState.channelID && newVoiceState.channelID && oldVoiceState.channelID != newVoiceState.channelID)) {
        // Sesli odaya katılmış. veya sesli oda değiştirmiş

        // id'si devam eden bir oyunda bulunuyorsa oyun odasına gönder
        function isInGame(userID) {
            return new Promise(function (resolve, reject) {
                let başlamışOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)
                if (!başlamışOyunlar)
                    resolve(false)

                resolve(başlamışOyunlar.find(tooGame => tooGame.players.some(id => id == userID) || (tooGame.mode == 0 && tooGame.ownerID == userID)))
            })
        }

        isInGame(member.user.id)
            .then(tooGame => {
                if (tooGame) {
                    if (newVoiceChannel.id != tooGame.gameRoom.id) {
                        let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id)
                        if (oyunOdası)
                            member.voice.setChannel(oyunOdası)
                                .then(member => {
                                    member.send(client.embed()
                                        .setTitle("#" + tooGame.id + " kodlu oyun hala devam ediyor!")
                                        .setDescription("Seni oyun odasına geri gönderdim.\n\nOyun bitmeden başka bir odaya katılamazsın.")
                                        .setColor("RED")
                                    )
                                })
                    }
                }
            })




    }


}