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

    if (!member.voice.serverMute) return; // sadece muteli olanlarla ilgilen

    let tooGames = db.get(`tooGames_${guild.id}`)
    if (!tooGames) return; // hiç oyun yok

    let dbPath = `liste_${guild.id}.mutedPlayersID`
    // if (db.has(dbPath))
    //     console.log("[unmute.js] mutedPlayersID:",db.get(dbPath))

    if ((!oldVoiceState.channelID && newVoiceState.channelID) || (oldVoiceState.channelID && newVoiceState.channelID && oldVoiceState.channelID != newVoiceState.channelID)) {
        // Sesli odaya katılmış. veya sesli oda değiştirmiş
        if (newVoiceChannel.name.includes("Town of Olympos") && tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished).some(tooGame => tooGame.gameRoom.id == newVoiceChannel.id))
            return; // girilen odada devam eden oyun varsa mute kaldırma

        // id'si mute id listesinde kayıtlıysa ve oyun devam etmiyorsa sil
        function isInGame(userID) {
            return new Promise(function (resolve, reject) {
                let başlamışOyunlar = tooGames.filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)
                if (!başlamışOyunlar)
                    resolve(false)

                resolve(başlamışOyunlar.some(tooGame => tooGame.players.some(id => id == userID)))
            })
        }

        let dbPath = `liste_${guild.id}.mutedPlayersID`

        if (!db.has(dbPath)) // yoksa
            return; // salla

        isInGame(member.user.id)
            .then(yes => {
                console.log(yes)
                if (!yes) {
                    if (db.has(dbPath) && db.get(dbPath).some(id => id == member.user.id)) {
                        // muteli id listesinde kayıtlı
                        member.voice.setMute(false, "Oyun bitmiş!")
                            .then(async updatedMember => {
                                let list = db.get(dbPath);
                                await db.set(dbPath, list.filter(i => i && i != member.user.id)) // boşları alalım
                                await console.log(member.user.id + " idli üye oyunda olmadığı için mutesi kaldırıldı.")
                            })
                            .catch(err => console.error("Muteli kalmış bi oyuncunun mutesini kaldırırken hata meydana geldi: " + err.message))

                    }
                }
            })




    }


}