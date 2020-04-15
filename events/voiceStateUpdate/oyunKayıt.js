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

    if ((!oldVoiceState.channelID && newVoiceState.channelID) || (oldVoiceState.channelID && newVoiceState.channelID && oldVoiceState.channelID != newVoiceState.channelID)) {
        // Sesli odaya katılmış.
        if (newVoiceChannel.name.includes("Town of Olympos")) {
            if (user.bot && user.id != client.user.id) return member.voice.setChannel(null); // diğer botları too odasına almasın.

            if (!db.has(`tooGames_${guild.id}`)) return; // daha önce hiç oyun oluşturulmamış

            // if (db.get(`tooGames_${guild.id}`).find(g => g.gameRoom.id == newVoiceChannel.id && g.isStarted && !g.isFinished))
            //     return member.voice.setChannel(null); // girilen odada başlamış ve bitmemiş oyun varsa odadan at

            let tooGame = db.get(`tooGames_${guild.id}`).find(g => g && g.gameRoom.id == newVoiceChannel.id && !g.isStarted && !g.isFinished);

            if (!tooGame) return console.log("debug: bekleyen oyun yok"); // girilen odada bekleyen oyun yok

            let başlamışOyunlar = db.get(`tooGames_${guild.id}`).filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)
            if (başlamışOyunlar.some(tooGame => tooGame.ownerID == member.user.id || tooGame.alive.hasOwnProperty(member.user.id)))
                return console.log(member.user.tag + " başka oyunda olduğu için bu oyuna katılamadı!")

            if (tooGame.mode == 0 && member.user.id == tooGame.ownerID) return; // Oyun modu 0'sa kurucuyu sayma

            await tooGame.players.push(member.user.id)
            tooGame.timestamps.lastPlayerJoined = parseInt(moment().utcOffset(3).format('x'))

            await updateMessage(tooGame);

            await db.set(`tooGames_${guild.id}.${tooGame.id}`, tooGame)
        }

    } else if (oldVoiceState.channelID && !newVoiceState.channelID) {
        // sesli odadan ayrılmış
        if (oldVoiceChannel.name.includes("Town of Olympos")) {
            if (!db.has(`tooGames_${guild.id}`)) return; // daha önce hiç oyun oluşturulmamış

            let tooGame = db.get(`tooGames_${guild.id}`).find(g => g.gameRoom.id == oldVoiceChannel.id && !g.isStarted && !g.isFinished);

            if (!tooGame) return console.log("debug: bekleyen oyun yok"); // girilen odada bekleyen oyun yok

            if (tooGame.players.includes(member.user.id)) {
                let newPlayers = []
                tooGame.players.forEach(player => {
                    if (player != member.user.id)
                        newPlayers.push(player)
                });
                tooGame.players = newPlayers;

                if (tooGame.players.length == (ayarlar.oyunAyarları.minKişi - 1))
                    tooGame.timestamps.lastPlayerJoined = parseInt(moment().utcOffset(3).format('x'))

                await updateMessage(tooGame);
                await db.set(`tooGames_${guild.id}.${tooGame.id}`, tooGame)
            }



        }

    }




    async function updateMessage(tooGame) {
        let playersList = [];
        tooGame.players.forEach(player => {
            playersList.push("<@" + player + ">")
        });
        if (tooGame.players.length < ayarlar.oyunAyarları.minKişi) {
            let kalanSüre = ((parseInt(ayarlar.oyunAyarları.oyuncuBeklemeSüresi / 60) == 0) ? (ayarlar.oyunAyarları.oyuncuBeklemeSüresi + " saniye") : (parseFloat(ayarlar.oyunAyarları.oyuncuBeklemeSüresi / 60) + " dakika"));
            playersList.push("**" + kalanSüre + " içinde birisi girmezse oyun iptal edilecek!**")
        } else if (tooGame.players.length < ayarlar.oyunAyarları.maxKişi) {
            playersList.push("**Oyuncular bekleniyor...**")
        }

        tooGame.embed.fields[tooGame.embed.fields.length - 1].value = await playersList.join("\n");

        guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
            .then(tooGameMessage => {
                tooGameMessage.edit({ embed: tooGame.embed })
                    .then(msg => console.log(`Updated the content of a message to ${msg.content}`))
                    .catch(console.error);
            })
            .catch(err => console.error)
        // dbde fonksiyonlar gidiyo !!!
    }


}