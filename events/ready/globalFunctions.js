const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");
const fs = require('fs');

module.exports = async (client) => {
    /* ↓↓  GLOBAL FUNCTIONS  ↓↓ */
    client.mainGuild = () => {
        return client.guilds.cache.find(g => g.id == ayarlar.sunucu)
    }
    client.tooGame = (tooGame) => {
        const guild = client.mainGuild();
        return db.get(`tooGames_${guild.id}.${tooGame.id}`)
    }
    client.addPointToUsers = (pointType, userIDs) => {
        let guild = client.mainGuild();

        return new Promise((resolve, reject) => {
            if (!["başlat", "bitir"].some(tür => tür == pointType))
                return resolve("Geçersiz puan türü girildi. [başlat,bitir]")

            let msgContent = ayarlar.olympos.prefix + ayarlar.olympos.commands.addPoint + " " + pointType + " <@" + userIDs.join("> <@") + ">"

            let msgChannel = guild.channels.cache.find(c => c.name == ayarlar.olympos.channelName)
            if (!msgChannel) return resolve("Komut kanalı bulunamadı! (" + ayarlar.olympos.channelName + ")")

            msgChannel.send(msgContent)
                .then(() => {
                    resolve("Komut başarıyla gönderildi.")
                })
                .catch(reject)
        })

    }
    client.embedColor = "2f3136";
    client.embed = (data) => {
        let newEmbed = new Discord.MessageEmbed(data);
        if (!newEmbed.color) newEmbed.setColor(client.embedColor)
        return newEmbed
    }
    client.findRole = (tooGame, userID) => {
        tooGame = client.tooGame(tooGame);
        return Object.keys(tooGame.roles).find(rol => tooGame.roles[rol].some(id => id == userID));
    }
    client.findUserIDFromRole = (tooGame, role) => {
        let IDs = Object.values(tooGame.roles).find(id => id == tooGame.roles[role]);

        if (!IDs)
            return false
        else if (!IDs.length == 1)
            return IDs[0]
        else
            return IDs
    }
    client.sayıMı = (str) => {
        return str.toString().match(/^[0-9\b]+$/)
    }
    client.getRandomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /* ↑↑  GLOBAL FUNCTIONS  ↑↑ */

    /* ↓↓  GET FUNCTIONS  ↓↓ */
    client.getChannelMessage = (channel, messageID) => {
        if (!channel.id) channel = client.channels.cache.find(c => c.id == channel); // channel yerine id gönderilirse channeli bul

        return new Promise(function (resolve, reject) {
            if (!channel) reject("Channel bulunamadı!")
            if (channel.messages.cache.has(messageID)) {
                resolve(channel.messages.cache.get(messageID));
            } else {
                channel.messages.fetch(messageID)
                    .then(message => {
                        if (!message) return reject(channel.id + " id'li kanalda " + messageID + " id'li mesaj bulunamadı!")
                        resolve(message)
                    })
                    .catch(reject);
            }
        })
    }
    client.getDmChannel = (user) => {
        if (user.user) user = user.user; // User yerine member gönderilirse çalışsın.
        if (!user.id) user = client.users.cache.find(u => u.id == user); // user yerine id gönderilirse useri bul

        return new Promise(function (resolve, reject) {
            if (!user) reject("User bulunamadı!")
            if (user.dmChannel) {
                // dm önceden kayıtlanmış
                resolve(user.dmChannel);
            } else {
                // dm kayıtlı değil 
                user.createDM()
                    .then(channel => {
                        resolve(channel);
                    })
                    .catch(reject)
            }
        })
    }
    client.getDmMessage = (user, messageID) => {
        if (user.user) user = user.user; // User yerine member gönderilirse çalışsın.
        if (!user.id) user = client.users.cache.find(u => u.id == user); // user yerine id gönderilirse useri bul

        return new Promise(function (resolve, reject) {
            if (!user) reject("User bulunamadı!")
            client.getDmChannel(user)
                .then(channel => {
                    client.getChannelMessage(channel, messageID)
                        .then(resolve)
                        .catch(reject)
                })
                .catch(reject)
        })
    }
    /* ↑↑  GET FUNCTIONS  ↑↑ */

    /* ↓↓  EMBED FIELD FUNCTIONS  ↓↓ */
    client.addAlives = (tooGame, embed, alivesTitle = false) => {
        let editingEmbed = embed ? embed : tooGame.embed
        if (Object.keys(tooGame.alive).length != 0) {
            editingEmbed.addField(alivesTitle ? alivesTitle : "Hayattaki Oyuncular", "<@" + Object.keys(tooGame.alive).join(">\n<@") + ">")
        }
        return editingEmbed;
    }
    client.addDeads = (tooGame, embed, deadsTitle = false) => {
        let editingEmbed = embed ? embed : tooGame.embed
        if (Object.keys(tooGame.dead).length != 0) {
            editingEmbed.addField(deadsTitle ? deadsTitle : "Ölü Oyuncular", "<@" + Object.keys(tooGame.dead).join(">\n<@") + ">")
        }
        return editingEmbed;
    }
    client.addAllPlayers = (tooGame, embed, alivesTitle = false, deadsTitle = false, clearFields = true) => {
        let editingEmbed = embed ? embed : tooGame.embed
        if (clearFields)
            editingEmbed.fields = []
        editingEmbed = client.addAlives(tooGame, editingEmbed, alivesTitle);
        editingEmbed = client.addDeads(tooGame, editingEmbed, deadsTitle);
        return editingEmbed;
    }
    client.addAliveRoles = (tooGame, embed, alivesTitle = false) => {
        let editingEmbed = embed ? embed : tooGame.embed
        if (Object.keys(tooGame.alive).length != 0) {
            let aliveDesc = []
            Object.keys(tooGame.alive).forEach(aliveID => {
                aliveDesc.push("**" + tooGame.alive[aliveID] + "**: <@" + aliveID + ">")
            });
            editingEmbed.addField(alivesTitle ? alivesTitle : "Hayatta Kalan Roller", aliveDesc.join("\n"))
        }
        return editingEmbed;
    }
    client.addDeadRoles = (tooGame, embed, deadsTitle = false) => {
        let editingEmbed = embed ? embed : tooGame.embed
        if (Object.keys(tooGame.dead).length != 0) {
            let aliveDesc = []
            Object.keys(tooGame.dead).forEach(aliveID => {
                aliveDesc.push("**" + tooGame.dead[aliveID] + "**: <@" + aliveID + ">")
            });
            editingEmbed.addField(deadsTitle ? deadsTitle : "Ölen Roller", aliveDesc.join("\n"))
        }
        return editingEmbed;
    }
    client.addAllRoles = (tooGame, embed, alivesTitle = false, deadsTitle = false, clearFields = true) => {
        let editingEmbed = embed ? embed : tooGame.embed
        if (clearFields)
            editingEmbed.fields = []
        editingEmbed = client.addAliveRoles(tooGame, editingEmbed, alivesTitle)
        editingEmbed = client.addDeadRoles(tooGame, editingEmbed, deadsTitle)
        return editingEmbed;
    }
    /* ↑↑  EMBED FIELD FUNCTIONS  ↑↑ */

    /* ↓↓  SEND INFO FUNCTIONS  ↓↓ */
    client.sendInfo = (tooGame, info, color = "BLACK", alivesTitle = false, deadsTitle = false, includeOwner = false, setTitle = true) => {
        client.sendInfoToGameChannel(tooGame, info, color, alivesTitle, deadsTitle, includeOwner)
        client.sendInfoToAllAlives(tooGame, info, color)
        client.sendInfoToOwner(tooGame, info, color, alivesTitle, deadsTitle, setTitle)
    }
    client.sendInfoToGameChannel = (tooGame, info, color = "BLACK", alivesTitle = false, deadsTitle = false, includeOwner = false) => {
        const guild = client.mainGuild();

        let gameChannel = guild.channels.cache.find(c => c.id == tooGame.message.channelID);
        if (!gameChannel) return console.error(tooGame.message.channelID + " id'li oyun kanalı bulunamadı!")

        let infoEmbed = client.embed()
            .setTitle(info)
            .setColor(color)
            .setFooter("Town of Olympos - #" + tooGame.id)

        if (includeOwner && tooGame.mode == 0) {
            let playerID = tooGame.ownerID;
            let playerMember = guild.members.cache.find(m => m.id == playerID);
            if (playerMember)
                infoEmbed.setAuthor(playerMember.displayName, playerMember.user.displayAvatarURL())
        }
        if (alivesTitle)
            infoEmbed = client.addAlives(tooGame, infoEmbed, alivesTitle);
        if (deadsTitle)
            infoEmbed = client.addDeads(tooGame, infoEmbed, deadsTitle);

        gameChannel.send({ embed: infoEmbed })
    }
    client.sendInfoToAllAlives = (tooGame, info, color = "BLACK") => {
        const guild = client.mainGuild();

        Object.keys(tooGame.alive).forEach(aliveID => {
            let aliveMember = guild.members.cache.find(m => m.id == aliveID);
            if (!aliveMember) return console.error(aliveID + " id'li üye bulunamadı!")

            let infoEmbed = client.embed()
                .setTitle(info)
                .setColor(color)
                .setFooter("Town of Olympos - #" + tooGame.id)

            aliveMember.send(infoEmbed)
        });
    }
    client.sendInfoToOwner = (tooGame, info, color = "BLACK", alivesTitle = "Hayattaki Roller", deadsTitle = "Ölmüş Roller", setTitle = true) => {
        const guild = client.mainGuild();
        if (tooGame.mode == 0) {
            let ownerID = tooGame.ownerID;
            let ownerMember = guild.members.cache.find(m => m.id == ownerID);
            if (!ownerMember) return console.error(ownerID + " id'li üye bulunamadı!")

            let infoEmbed = client.embed()
                .setColor(color)
                .setFooter("Town of Olympos - #" + tooGame.id)

            if (setTitle)
                infoEmbed.setTitle(info)
            else
                infoEmbed.setDescription(info)

            if (alivesTitle)
                infoEmbed = client.addAlives(tooGame, infoEmbed, alivesTitle);
            if (deadsTitle)
                infoEmbed = client.addDeads(tooGame, infoEmbed, deadsTitle);

            ownerMember.send(infoEmbed)
        }
    }
    /* ↑↑  SEND INFO FUNCTIONS  ↑↑ */

    /* ↓↓  SEND EMBED FUNCTIONS  ↓↓ */
    client.sendEmbed = (tooGame, embed) => {
        client.sendEmbedToGameChannel(tooGame, embed)
        client.sendEmbedToAllAlives(tooGame, embed)
        client.sendEmbedToOwner(tooGame, embed)
    }
    client.sendEmbedToGameChannel = (tooGame, embed) => {
        return new Promise(function (resolve, reject) {
            embed.setFooter("Town of Olympos - #" + tooGame.id)
            const guild = client.mainGuild();
            let gameChannel = guild.channels.cache.find(c => c.id == tooGame.message.channelID);
            if (!gameChannel) return reject(tooGame.message.channelID + " id'li oyun kanalı bulunamadı!")
            if (tooGame.mode == 0 && !embed.author) {
                let playerID = tooGame.ownerID;
                let playerMember = guild.members.cache.find(m => m.id == playerID);
                if (playerMember)
                    embed.setAuthor(playerMember.displayName, playerMember.user.displayAvatarURL())
            }
            gameChannel.send({ embed: embed })
                .then(resolve)
                .catch(reject)
        })
    }
    client.sendEmbedToAllDeads = (tooGame, embed, disregardPlayers = []) => {
        const resolves = [], rejects = []
        return new Promise(function (resolve, reject) {
            embed.setFooter("Town of Olympos - #" + tooGame.id)
            const guild = client.mainGuild();
            Object.keys(tooGame.dead).forEach(aliveID => {
                if (disregardPlayers.some(id => id == aliveID)) return;
                let aliveMember = guild.members.cache.find(m => m.id == aliveID);
                if (!aliveMember) return rejects.push(aliveID + " id'li üye bulunamadı!")
                aliveMember.send(embed)
                    .then(data => { if (data) resolves.push(data) })
                    .catch(data => { if (data) rejects.push(data) })
            });
            let interval = setInterval(() => {
                if (resolves.length + rejects.length >= Object.keys(tooGame.dead).length) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.sendEmbedToAllAlives = (tooGame, embed, disregardPlayers = []) => {
        const resolves = [], rejects = []
        return new Promise(function (resolve, reject) {
            embed.setFooter("Town of Olympos - #" + tooGame.id)
            const guild = client.mainGuild();
            Object.keys(tooGame.alive).forEach(aliveID => {
                if (disregardPlayers.some(id => id == aliveID)) return;
                let aliveMember = guild.members.cache.find(m => m.id == aliveID);
                if (!aliveMember) return rejects.push(aliveID + " id'li üye bulunamadı!")
                aliveMember.send(embed)
                    .then(data => { if (data) resolves.push(data) })
                    .catch(data => { if (data) rejects.push(data) })
            });
            let interval = setInterval(() => {
                if (resolves.length + rejects.length >= Object.keys(tooGame.alive).length) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.sendEmbedToOwner = (tooGame, embed) => {
        return new Promise(function (resolve, reject) {
            embed.setFooter("Town of Olympos - #" + tooGame.id)
            const guild = client.mainGuild();
            if (tooGame.mode == 0) {
                let ownerID = tooGame.ownerID;
                let ownerMember = guild.members.cache.find(m => m.id == ownerID);
                if (!ownerMember) return reject(ownerID + " id'li üye bulunamadı!")
                ownerMember.send(embed)
                    .then(resolve)
                    .catch(reject)
            }
        })
    }
    client.sendEmbedToAlive = (tooGame, embed, aliveID) => {
        return new Promise(function (resolve, reject) {
            embed.setFooter("Town of Olympos - #" + tooGame.id)
            const guild = client.mainGuild();
            if (tooGame.alive.hasOwnProperty(aliveID)) {
                let aliveMember = guild.members.cache.find(m => m.id == aliveID);
                if (!aliveMember) return reject(aliveID + " id'li üye bulunamadı!")
                aliveMember.send(embed)
                    .then(resolve)
                    .catch(reject)
            } else {
                reject("Seçilen kişi hayatta değil.")
            }
        })
    }
    /* ↑↑  SEND EMBED FUNCTIONS  ↑↑ */

    /* ↓↓  VOTING FUNCTIONS  ↓↓ */
    client.activateVoting = (tooGame, votingMsg) => {
        const guild = client.mainGuild();
        let user = votingMsg.channel.recipient;
        let userID = user.id;
        console.log(userID + " voting")

        const sayıEmojiler = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', "11:697131802493583471", "12:697131823821619210", "13:697131853114769450", "14:697132049089298502", "15:697132103313129502"]

        for (let i = 0; i < Object.keys(tooGame.alive).length - 1; i++) { // oylamada oy veren kişi bulunmadığı için -1
            votingMsg.react(sayıEmojiler[i + 1])
        }

        //////////////////////////////////////////
        const filter = (reaction, user) => user.id === userID && sayıEmojiler.some(e => e == reaction.emoji.name.split(":")[0])
        const collector = votingMsg.createReactionCollector(filter, {});
        collector.interval = setInterval(() => {
            if (db.has(`tooGames_${guild.id}.${tooGame.id}.isVoting`) && !db.get(`tooGames_${guild.id}.${tooGame.id}.isVoting`)) {
                console.log("oylama bitti " + tooGame.id)
                collector.stop("Oylama bitti.")
            }
        }, 1000);
        collector.on('collect', async  r => {
            console.log(`#${tooGame.id} Voting - Collected ${r.emoji.name} from ${userID}'s panel`)
            if (db.get(`tooGames_${guild.id}.${tooGame.id}.isFinished`)) {
                return collector.stop("Oyun bitmiş.")
            }
            if (!db.get(`tooGames_${guild.id}.${tooGame.id}.isVoting`)) {
                return collector.stop("Oylama yapılmıyor.")
            }
            let votedUserID = r.message.embeds[0].fields[0].value.split("\n")[sayıEmojiler.findIndex(e => e.startsWith(r._emoji.name)) - 1].split("@")[1].replace(">", "");
            await db.push(`tooGames_${guild.id}.${tooGame.id}.votes.${votedUserID}`, userID)
        });
        collector.on('dispose', (reaction, user) => {
            console.log(`2     #${tooGame.id} Voting - Removed ${reaction.emoji.name} from ${user.id}'s panel`)
            console.log(`#${tooGame.id} Voting - Removed ${reaction.emoji.name} from ${userID}'s panel`)
        });
        collector.on('end', async collected => {
            await clearInterval(collector.interval)
            await console.log("Oylar:", db.get(`tooGames_${guild.id}.${tooGame.id}.votes`))
            await votingMsg.delete()
                .then(() => {
                    console.log(`${tooGame.id} oylaması bittiği için ${userID} id'li kişinin oylama paneli kaldırıldı."`)
                })
        });
        /////////////////////////////////////////
    }
    client.sendVoting = (tooGame, aliveID) => {
        const guild = client.mainGuild();

        if (db.get(`tooGames_${guild.id}.${tooGame.id}.day.current`) == 1) {
            // sadece gündüz çalışsın
            let votingEmbed = client.embed()
                .setTitle("OYLAMA BAŞLADI")
                .setDescription(`Bugün asılmasını istediğin kişinin **sadece** 	__sıra numarası__ olacak şekilde bu özel mesaj kanalından göndermelisin.

                Oylama süresi bitene kadar seçimini değiştirebilirsin.

                **NOT:** Eğer oylama sonucunda en yüksek oylar eşit çıkarsa kimse ölmez ve oyun geceden devam eder.
                `)

            let desc = []
            let i = 1;
            Object.keys(tooGame.alive).forEach(otherAliveID => {
                if (otherAliveID == aliveID) return; // oy veren kişiyi ekleme
                let otherAliveMember = guild.members.cache.find(m => m.id == otherAliveID)
                desc.push(`${i} - <@${otherAliveID}> ` + (otherAliveMember ? `(aka **${otherAliveMember.displayName}**)` : ""))
                i += 1
            });
            votingEmbed.addField("Oy Verilebilecek Oyuncular", desc.join("\n"))

            client.getDmChannel(aliveID)
                .then(channel => {
                    channel.send(votingEmbed)
                        .then(async votingMsg => {
                            //await db.set(`tooGames_${guild.id}.${tooGame.id}.voteMsgIDs.${aliveID}`, votingMsg.id)
                            //await client.activateVoting(tooGame, votingMsg)
                        })
                })

        }
    }
    client.startVoting = async (tooGame) => {
        const guild = client.mainGuild();
        await db.set(`tooGames_${guild.id}.${tooGame.id}.votes`, {})
        await db.set(`tooGames_${guild.id}.${tooGame.id}.isVoting`, true)

        let startVotingEmbed = client.embed()
            .setTitle("OYLAMA BAŞLADI!")
            .setImage("https://i.hizliresim.com/TLyWn1.png")
            .setColor("GREEN")

        startVotingEmbed = client.addAlives(tooGame, startVotingEmbed, "Oylanacak Oyuncular")

        client.sendEmbedToGameChannel(tooGame, startVotingEmbed)
        client.sendEmbedToOwner(tooGame, startVotingEmbed)
        Object.keys(tooGame.alive).forEach(aliveID => {
            client.sendVoting(tooGame, aliveID)
        })
    }
    client.endVoting = async (tooGame) => {
        const guild = client.mainGuild();
        db.set(`tooGames_${guild.id}.${tooGame.id}.isVoting`, false)
        let endVotingEmbed = client.embed()
            .setTitle("OYLAMA BİTTİ!")
            .setColor("RED")

        // Oy sayılarını ekle
        let votesDesc = [];
        Object.keys(tooGame.votes).sort((a, b) => tooGame.votes[b].length - tooGame.votes[a].length).forEach(votedUserID => {
            let votes = tooGame.votes[votedUserID];
            if (votes.length == 0) return;
            votesDesc.push(`<@${votedUserID}> : ${votes.length} oy`)
        });
        if (Object.keys(tooGame.votes).length == 0)
            votesDesc.push("**Oy veren/alan kimse yok!**")

        endVotingEmbed.addField("Alınan Oy Sayıları", votesDesc.join("\n"))


        let diedID = 0;

        if (Object.keys(tooGame.votes).length == 0) {
            endVotingEmbed.setDescription("KİMSE ASILMADI!")
        } else {
            // Ölen kişiyi hesapla
            let votedUserIDs = Object.keys(tooGame.votes).sort((a, b) => tooGame.votes[b].length - tooGame.votes[a].length);
            console.log("oylar: ", tooGame.votes)
            if (!votedUserIDs[1] || tooGame.votes[votedUserIDs[0]].length != tooGame.votes[votedUserIDs[1]].length) {
                diedID = votedUserIDs[0]
            } else {
                endVotingEmbed.setDescription("KİMSE ASILMADI!")
            }
        }

        await client.sendEmbedToGameChannel(tooGame, endVotingEmbed)
            .then(async msg => {
                let msgURL = "https://discordapp.com/channels/" + guild.id + "/" + msg.channel.id + "/" + msg.id

                endVotingEmbed.fields[0].value = "[Görmek için tıklayın!](" + msgURL + ")"

                if (diedID) {
                    endVotingEmbed.setDescription("BİR KİŞİ ASILDI!")
                }

                await client.sendEmbedToAllAlives(tooGame, endVotingEmbed)
                await client.sendEmbedToOwner(tooGame, endVotingEmbed)

                if (diedID)
                    await client.hang(tooGame, diedID, `Oylamada ${tooGame.votes[diedID].length} oy alarak ölüme terk edildi.`, true)
                else
                    await client.setNight(tooGame);

            })

    }
    /* ↑↑  VOTING FUNCTIONS  ↑↑ */

    /* ↓↓  PANEL FUNCTIONS  ↓↓ */
    client.activatePanel = (tooGame, ownerPanelMsg) => {
        const guild = client.mainGuild();
        let ownerID = tooGame.ownerID;
        console.log(ownerID + " panel")

        const yönetimEmojileri = ['🌙', '☀️', '📊', '❌', '🔚']

        yönetimEmojileri.forEach(async emoji => {
            await ownerPanelMsg.react(emoji);
        });

        //////////////////////////////////////////
        const filter = (reaction, user) => user.id === ownerID && yönetimEmojileri.some(e => e == reaction.emoji.name.split(":")[0])
        const collector = ownerPanelMsg.createReactionCollector(filter, {});
        collector.on('collect', r => {
            console.log(`Collected ${r.emoji.name}`)
            //r.users.remove(client.users.cache.find(u => u.id == ownerID))
            if (db.get(`tooGames_${guild.id}.${tooGame.id}.isFinished`)) {
                return collector.stop("Oyun bitmiş.")
            }

            switch (r.emoji.name) {
                case '🌙':
                    client.setNight(tooGame);
                    break;
                case '☀️':
                    client.setDay(tooGame);
                    break;
                case '📊':
                    // Oylama başlat
                    client.startVoting(tooGame)
                    break;
                case '❌':
                    // Oylama bitir
                    client.endVoting(tooGame)
                    break;
                case '🔚':
                    // Oyunu bitir
                    client.endGame(tooGame)
                    break;
                default:
                    break;
            }
        });
        collector.on('dispose', r => console.log(`Removed ${r.emoji.name}`));
        collector.on('end', collected => console.log(`${tooGame.id} paneli kapatıldı."`));
        /////////////////////////////////////////
    }
    client.dmOwnerPanel = async (tooGame) => {
        const guild = client.mainGuild();
        let ownerID = tooGame.ownerID;

        let ownerMember = guild.members.cache.find(m => m.id == ownerID);
        if (!ownerMember) return console.error(ownerID + " id'li üye bulunamadı!")

        // Dağıtılan Roller
        let desc = {}
        Object.keys(tooGame.roles).forEach(role => {
            let playerIDs = tooGame.roles[role];
            playerIDs.forEach(playerID => {
                let sınıf = Object.keys(ayarlar.sınıflandırma).find(sınıf => ayarlar.sınıflandırma[sınıf].some(r => r == role));
                if (!desc[sınıf]) desc[sınıf] = []
                desc[sınıf].push("**" + role + "**: <@" + playerID + ">")
            });
        });
        let rolesEmbed = client.embed()
            .setTitle("DAĞITILAN ROLLER")
            .setFooter("Town of Olympos - #" + tooGame.id)
        Object.keys(desc).forEach(sınıf => {
            rolesEmbed.addField(sınıf.replace(/i/g, "İ").toUpperCase(), desc[sınıf].join("\n"))
        });
        await ownerMember.send(rolesEmbed)

        // Yönetim Paneli
        await ownerMember.send(client.embed()
            .setTitle("YÖNETİM PANELİ")
            .addField("Kullanılabilecek Komutlar", `
            > \`\`gece\`\` : Gece yapar.
            > \`\`gündüz\`\` : Gündüz yapar.

            > \`\`oylama başlat\`\` : Oylama başlatır.
            > \`\`oylama bitir\`\` : Aktif oylamayı bitirir.

            > \`\`oyunu bitir\`\` : Oyunu sonlandırır, hayattaki herkes oyunu kazanmış sayılır.
            `)
            .addField("KULLANIM", "Satır başındaki, kutu içerisindeki komutları bu özel mesaj kanalından direkt olarak gönderiniz.")
            .addField("NOT", "Gündüz yapmak otomatik olarak gün atlatır.")
            .setFooter("Town of Olympos - #" + tooGame.id)
        )
            .then(async ownerPanelMsg => {
                tooGame.ownerPanelMsg = { id: ownerPanelMsg.id, channelID: ownerPanelMsg.channel.id }
                await db.set(`tooGames_${guild.id}.${tooGame.id}.ownerPanelMsg`, { id: ownerPanelMsg.id, channelID: ownerPanelMsg.channel.id })
                //await client.activatePanel(tooGame, ownerPanelMsg)
            })
    }
    /* ↑↑  PANEL FUNCTIONS  ↑↑ */

    client.sendSelectionPanel = async (tooGame, aliveID) => {
        const guild = client.mainGuild();
        return new Promise(async (resolve, reject) => {
            let rol = client.findRole(tooGame, aliveID);
            let props = tooGame.roleProps[rol];

            let multipleChoice = props.skills.hasOwnProperty("selectedID2")

            let selectionEmbed = client.embed()
                .setTitle((rol == "Athena" ? "GÜNDÜZ" : "GECE") + " BAŞLADI " + rol.toUpperCase())
                .setDescription(`${(rol == "Athena" ? "Bu gece" : "Bugün")} yeteneğini kullanmak istediğin ${multipleChoice ? "kişilerin" : "kişinin"} __sıra numarası__nı \`seç ${multipleChoice ? "6 9" : "6"}\` olacak şekilde bu özel mesaj kanalından göndermelisin.

        DİKKAT: **Seçimini yalnızca bir kez yapabilirsin. Değişiklik yapılamayacaktır!**

        NOT: _Eğer rolünün bilgilerini unuttuysan her zaman \`rol bilgisi\` yazarak ulaşabilirsin!_
        `)

            if (props.limit && props.limit >= 0)
                selectionEmbed.addField("Kalan Kullanım Hakkı", props.limit)
            if (props.selfLimit && props.selfLimit >= 0)
                selectionEmbed.addField("Kalan Kendine Kullanım Hakkı", props.selfLimit)

            let desc = []
            let i = 1;

            if (props.onlySelf) {
                let aliveMember = guild.members.cache.find(m => m.id == aliveID)
                db.push(`tooGames_${guild.id}.${tooGame.id}.list.${aliveID}`, [aliveID])
                desc.push(`${i} - <@${aliveID}> ` + (aliveMember ? `(aka **${aliveMember.displayName}**)` : ""))
            } else {

                if (!props.onlyDeads)
                    Object.keys(tooGame.alive).forEach(otherAliveID => {
                        let diğerRol = client.findRole(tooGame, otherAliveID);
                        if (otherAliveID == aliveID && !props.includeSelf) return;
                        if (otherAliveID == aliveID && props.includeSelf && !props.selfLimit) return;
                        if (ayarlar.rolPaketleri.büyükTanrılar.some(r => r == rol))
                            if (ayarlar.rolPaketleri.büyükTanrılar.some(r => r == diğerRol)) return; // büyük tanrılara birbirini ekleme
                        if (props.jailedIDs && props.jailedIDs.some(id => id == otherAliveID)) return;//önceden sorgulanan kişiyi ekleme

                        let otherAliveMember = guild.members.cache.find(m => m.id == otherAliveID)
                        db.push(`tooGames_${guild.id}.${tooGame.id}.list.${aliveID}`, otherAliveID)
                        desc.push(`${i} - <@${otherAliveID}> ` + (otherAliveMember ? `(aka **${otherAliveMember.displayName}**)` : ""))
                        i += 1
                    });
                else
                    Object.keys(tooGame.dead).forEach(otherAliveID => {
                        let diğerRol = client.findRole(tooGame, otherAliveID);
                        if (otherAliveID == aliveID && !props.includeSelf) return;
                        if (otherAliveID == aliveID && props.includeSelf && !props.selfLimit) return;
                        if (ayarlar.rolPaketleri.büyükTanrılar.some(r => r == rol))
                            if (ayarlar.rolPaketleri.büyükTanrılar.some(r => r == diğerRol)) return; // büyük tanrılara birbirini ekleme

                        let otherAliveMember = guild.members.cache.find(m => m.id == otherAliveID)
                        db.push(`tooGames_${guild.id}.${tooGame.id}.list.${aliveID}`, otherAliveID)
                        desc.push(`${i} - <@${otherAliveID}> ` + (otherAliveMember ? `(aka **${otherAliveMember.displayName}**)` : ""))
                        i += 1
                    });

            }



            if (desc.length == 0)
                desc.push("**" + (rol == "Athena" ? "Bugün" : "Bu gece") + " seçebilecek kimse yok!**")
            selectionEmbed.addField("Seçilebilecek Oyuncular", desc.join("\n"))

            client.sendEmbedToAlive(tooGame, selectionEmbed, aliveID)
                .then(resolve)
                .catch(reject)
        })
    }
    client.reportToHermes = (tooGame, info) => {
        let hermesIDs = tooGame.roles["Hermes"];
        if (!hermesIDs || hermesIDs.length == 0) return;

        const guild = client.mainGuild();

        let resolves = [], rejects = [];
        return new Promise(function (resolve, reject) {
            hermesIDs.forEach(hermesID => {

                if (!client.tooGame(tooGame).alive.hasOwnProperty(hermesID)) return; // hermes yaşamıyosa bilgi verme

                let hermesMember = guild.members.cache.find(m => m.id == hermesID);
                if (!hermesMember) return reject(hermesID + " id'li üye bulunamadı!")
                let embed = client.embed()
                    .setTitle("🌙 " + ((tooGame.day.count - 1) == 1 ? "İLK" : ((tooGame.day.count - 1) + ".")) + " GECE")
                    .setDescription(info)
                    .setFooter("Town of Olympos - #" + tooGame.id)
                    .setColor("BLUE")

                hermesMember.send(embed)
                    .then(data => { if (data) resolves.push(data) })
                    .catch(data => { if (data) rejects.push(data) })
            });
            let interval = setInterval(() => {
                if (resolves.length + rejects.length >= hermesIDs.length) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.sendInfoToVisitorKiller = (tooGame, visitorKillerID) => {
        const guild = client.mainGuild();
        return new Promise(function (resolve, reject) {

            let visitorKillerMember = guild.members.cache.find(m => m.id == visitorKillerID);
            if (!visitorKillerMember) return resolve(visitorKillerID + " id'li üye bulunamadı!")
            let embed = client.embed()
                .setDescription("Geçtiğimiz gece misafirin vardı, ama ne yazık ki taşa dönüştü. (▼-▼*)")
                .setFooter("Town of Olympos - #" + tooGame.id)
                .setColor("GRAY")

            visitorKillerMember.send(embed)
                .then(resolve)
                .catch(reject)
        })
    }

    client.sendUnmutePanel = async (tooGame, ownerID) => {
        const guild = client.mainGuild();
        return new Promise(async (resolve, reject) => {
            let ownerMember = guild.members.cache.find(m => m.id == ownerID);
            if (!ownerMember) return console.error(ownerID + " id'li üye bulunamadı!")

            // Dağıtılan Roller
            let desc = {}
            let i = 1;
            Object.keys(tooGame.alive).forEach(aliveID => {
                let role = client.findRole(tooGame, aliveID);
                let sınıf = Object.keys(ayarlar.sınıflandırma).find(sınıf => ayarlar.sınıflandırma[sınıf].some(r => r == role));
                if (!desc[sınıf]) desc[sınıf] = []
                desc[sınıf].push(i + ". **" + role + "**: <@" + aliveID + ">")
                db.push(`tooGames_${guild.id}.${tooGame.id}.list.${ownerID}`, aliveID)
                i += 1;
            });
            let description = []
            Object.values(desc).forEach(asd => {
                asd.forEach(element => {
                    description.push(element);
                });
            });
            description.sort((a, b) => parseInt(a.slice(0, 1)) - parseInt(b.slice(0, 1)));
            console.log(description)
            let unmuteEmbed = client.embed()
                .setTitle("MİKROFON AÇMA/KAPATMA PANELİ")
                .setFooter("Town of Olympos - #" + tooGame.id)
                .setDescription(description.join("\n"))
            // Object.keys(desc).forEach(sınıf => {
            //     unmuteEmbed.addField(sınıf.replace(/i/g, "İ").toUpperCase(), desc[sınıf].join("\n"))
            // });
            await ownerMember.send(unmuteEmbed)
                .then(async unmutePanelMsg => {
                    tooGame.ownerPanelMsg = { id: unmutePanelMsg.id, channelID: unmutePanelMsg.channel.id }
                    await db.set(`tooGames_${guild.id}.${tooGame.id}.unmutePanelMsg`, { id: unmutePanelMsg.id, channelID: unmutePanelMsg.channel.id })
                })



        })
    }

    client.checkRoleProps = (tooGame) => { // gece olunca çalışır 6
        const guild = client.mainGuild();

        Object.keys(tooGame.alive).forEach(aliveID => {
            let rol = client.findRole(tooGame, aliveID)
            let props = tooGame.roleProps[rol];

            if (!props.skills) return;

            // refresh tooGame
            tooGame = client.tooGame(tooGame)

            // intihar varsa öldür
            if (props.suicide) {
                let suicideEmbed = client.embed()
                    .setTitle("GECE BAŞLADI " + rol.toUpperCase())
                    .setDescription(`Masum birini öldürdüğün için bu gece vicdan azabından intihar ediceksin.`)
                client.sendEmbedToAlive(tooGame, suicideEmbed, aliveID)
                client.killAtNight(tooGame, aliveID, aliveID)
                return;
            }

            if ((props.skills.hasOwnProperty("selectedID") || props.skills.hasOwnProperty("selectedID1")) && (props.limit || props.selfLimit)) {
                // oyuncu seçme paneli gönderilecek.
                if (rol == "Athena") return;
                if (props.isInJail) return;
                client.sendSelectionPanel(client.tooGame(tooGame), aliveID)
            }


        });
    }
    client.dayPickerKillers = (tooGame) => { // gece başlayınca çalışır 5
        const guild = client.mainGuild();
        let resolves = [], rejects = [];
        return new Promise((resolve, reject) => {
            Object.keys(tooGame.alive).forEach(aliveID => {
                let rol = client.findRole(tooGame, aliveID);
                let props = tooGame.roleProps[rol];

                if (!props.skills) return resolves.push("no skill");

                console.log("gündüz yapılan seçimler için aranıyor: " + rol)

                if (client.dayRoles.hasOwnProperty(rol))
                    client.dayRoles[rol](tooGame, aliveID, rol, props)
                        .then(data => {
                            if (data) {
                                console.log(rol + " data: " + data)
                                resolves.push(data)
                            }
                        })
            })
            let interval = setInterval(() => {
                let toplam = Object.keys(tooGame.alive).filter(aliveID => client.dayRoles.hasOwnProperty(client.findRole(tooGame, aliveID))).length;
                console.log(toplam, resolves.length, rejects.length)
                if (resolves.length + rejects.length >= toplam) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.nightPickerKillers = (tooGame) => { // gündüz başlayınca çalışır 5
        const guild = client.mainGuild();
        let resolves = [], rejects = [];
        return new Promise((resolve, reject) => {
            Object.keys(tooGame.alive).forEach(aliveID => {
                let rol = client.findRole(tooGame, aliveID);
                let props = tooGame.roleProps[rol];

                if (!props.skills) return resolves.push("no skill")

                if (client.nightRoles.hasOwnProperty(rol)) {

                    console.log("checking role:       " + rol)
                    client.nightRoles[rol](tooGame, aliveID, rol, props)
                        .then(data => {
                            if (data) {
                                console.log(rol + " başarıyla uygulandı.")
                                resolves.push(data)
                            }
                        })

                } else {
                    resolves.push("night role değil.")
                }
            });
            let interval = setInterval(() => {
                let toplam = Object.keys(tooGame.alive).filter(aliveID => client.nightRoles.hasOwnProperty(client.findRole(tooGame, aliveID))).length;
                //console.log(toplam, resolves.length, rejects.length)
                if (resolves.length + rejects.length >= toplam) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.nightPickerGuards = (tooGame) => { // gündüz başlayınca çalışır 4
        const guild = client.mainGuild();
        let resolves = [], rejects = [];
        return new Promise((resolve, reject) => {
            Object.keys(tooGame.alive).forEach(aliveID => {
                let rol = client.findRole(tooGame, aliveID);
                let props = tooGame.roleProps[rol];

                if (!props.skills) return resolves.push("no skill");

                if (client.nightGuardRoles.hasOwnProperty(rol))
                    client.nightGuardRoles[rol](tooGame, aliveID, rol, props)
                        .then(data => {
                            if (data) {
                                console.log(rol + " başarıyla uygulandı.")
                                resolves.push(data)
                            }
                        })
            });
            let interval = setInterval(() => {
                let toplam = Object.keys(tooGame.alive).filter(aliveID => client.nightGuardRoles.hasOwnProperty(client.findRole(tooGame, aliveID))).length;

                if (resolves.length + rejects.length >= toplam) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.nightPickerMedusa = (tooGame) => { // gündüz başlayınca çalışır 3
        const guild = client.mainGuild();
        let resolves = [], rejects = [];
        return new Promise((resolve, reject) => {
            Object.keys(tooGame.alive).forEach(aliveID => {
                let rol = client.findRole(tooGame, aliveID);
                let props = tooGame.roleProps[rol];

                if (!props.skills) return resolves.push("no skill");

                if (client.nightMedusa.hasOwnProperty(rol))
                    client.nightMedusa[rol](tooGame, aliveID, rol, props)
                        .then(data => {
                            if (data) {
                                console.log(rol + " başarıyla uygulandı.")
                                resolves.push(data)
                            }
                        })
            });
            let interval = setInterval(() => {
                let toplam = Object.keys(tooGame.alive).filter(aliveID => client.nightMedusa.hasOwnProperty(client.findRole(tooGame, aliveID))).length;

                if (resolves.length + rejects.length >= toplam) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }
    client.nightPickerDemeter = (tooGame) => { // gündüz başlayınca çalışır 3
        const guild = client.mainGuild();
        let resolves = [], rejects = [];
        return new Promise((resolve, reject) => {
            Object.keys(tooGame.alive).forEach(aliveID => {
                let rol = client.findRole(tooGame, aliveID);
                let props = tooGame.roleProps[rol];

                if (!props.skills) return resolves.push("no skill");

                if (client.nightDemeter.hasOwnProperty(rol))
                    client.nightDemeter[rol](tooGame, aliveID, rol, props)
                        .then(data => {
                            if (data) {
                                console.log(rol + " başarıyla uygulandı.")
                                resolves.push(data)
                            }
                        })
            });
            let interval = setInterval(() => {
                let toplam = Object.keys(tooGame.alive).filter(aliveID => client.nightDemeter.hasOwnProperty(client.findRole(tooGame, aliveID))).length;

                if (resolves.length + rejects.length >= toplam) {
                    clearInterval(interval)
                    resolve(resolves)
                    reject(rejects)
                }
            }, 100);
        })
    }

    client.dayEvents = async (tooGame) => {// gündüz başlayınca çalışır 1
        const guild = client.mainGuild();
        tooGame = db.get(`tooGames_${guild.id}.${tooGame.id}`);

        let info = "☀️ " + (tooGame.day.count == 1 ? "İLK" : (tooGame.day.count + ".")) + " GÜN BAŞLADI!"
        //client.sendInfo(client.tooGame(tooGame), info, "YELLOW", false, false, !tooGame.mode)
        await client.sendInfoToGameChannel(client.tooGame(tooGame), info, "YELLOW", false, false, !tooGame.mode)

        if (tooGame.mode == 0)
            client.sendUnmutePanel(client.tooGame(tooGame), tooGame.ownerID)

        client.nightPickerDemeter(client.tooGame(tooGame))
            .then((result) => {
                console.log("nightPickerDemeter okeyto")
                if (result) console.log("nightPickerDemeter result: " + result)
                client.nightPickerMedusa(client.tooGame(tooGame))
                    .then((result) => {
                        console.log("nightPickerMedusa okeyto")
                        if (result) console.log("nightPickerMedusa result: " + result)
                        client.nightPickerGuards(client.tooGame(tooGame))
                            .then((result) => {
                                console.log("nightPickerGuards okeyto")
                                if (result) console.log("nightPickerGuards result: " + result)
                                client.nightPickerKillers(client.tooGame(tooGame))
                                    .then((result) => {
                                        console.log("nightPickerKillers okeyto")
                                        if (result) console.log("nightPickerKillers result: " + result)
                                        client.checkDeaths(client.tooGame(tooGame))
                                            .then((result) => {
                                                console.log("checkDeaths okeyto")
                                                if (result) console.log("checkDeaths result: " + result)

                                                console.log("gündüz okeyto")

                                                let athenaID = client.findUserIDFromRole(tooGame, "Athena")

                                                if (client.tooGame(tooGame).alive.hasOwnProperty(athenaID)) {
                                                    client.resetAliveID(client.tooGame(tooGame), athenaID)
                                                        .then(() => {
                                                            console.log("\n\n     sending panel to athena")
                                                            client.sendSelectionPanel(client.tooGame(tooGame), athenaID)
                                                        })
                                                }

                                            })
                                            .catch(console.error)
                                    })
                                    .catch(console.error)
                            })
                            .catch(console.error)
                    })
                    .catch(console.error)
            })
            .catch(console.error)
    }
    client.nightEvents = async (tooGame) => { // gece başlayınca çalışır 1
        const guild = client.mainGuild();
        tooGame = db.get(`tooGames_${guild.id}.${tooGame.id}`);

        let info = "🌙 " + (tooGame.day.count == 1 ? "İLK" : (tooGame.day.count + ".")) + " GECE BAŞLADI!"
        //await client.sendInfo(tooGame, info, "BLACK", false, false, !tooGame.mode)
        await client.sendInfoToGameChannel(client.tooGame(tooGame), info, "BLACK", false, false, !tooGame.mode)


        // Object.keys(tooGame.alive).forEach(async aliveID => {
        //     let aliveMember = guild.members.cache.find(m => m.id == aliveID);
        //     if (aliveMember) {
        //         await console.log("Gece olduğu için " + aliveMember.user.tag + " susturuldu. Oyun kodu: #" + tooGame.id)
        //         await aliveMember.voice.setMute(true)
        //     }
        // });

        // resets
        let aliveCount = 0;
        Object.keys(tooGame.alive).forEach(aliveID => {
            if (client.findRole(tooGame, aliveID) == "Athena") return aliveCount += 1;

            client.resetAliveID(tooGame, aliveID)
                .then(() => {
                    aliveCount += 1;
                })
        })
        db.set(`tooGames_${guild.id}.${tooGame.id}.lastEvents`, {})

        let interval = setInterval(() => {
            if (aliveCount >= Object.keys(tooGame.alive).length) {
                clearInterval(interval)

                // run role events
                client.dayPickerKillers(client.tooGame(tooGame))
                    .then((result) => {
                        if (result) console.log("dayPickerKillers result: " + result)

                        client.checkRoleProps(client.tooGame(tooGame))
                    })
                    .catch(console.error)
            }
        }, 100);



    }
    client.setDay = (tooGame) => {
        const guild = client.mainGuild();
        if (db.get(`tooGames_${guild.id}.${tooGame.id}.day.current`) != 1) {
            // sadece gündüz değilse çalışsın
            db.add(`tooGames_${guild.id}.${tooGame.id}.day.count`, 1)
            db.set(`tooGames_${guild.id}.${tooGame.id}.day.current`, 1)
        }
    }
    client.setNight = (tooGame) => {
        const guild = client.mainGuild();
        if (db.get(`tooGames_${guild.id}.${tooGame.id}.day.current`) != 0) {
            // sadece gece değilse çalışsın
            db.set(`tooGames_${guild.id}.${tooGame.id}.lastDeaths`, {})
            db.set(`tooGames_${guild.id}.${tooGame.id}.day.current`, 0)
        }
    }
    client.resetAliveID = (tooGame, aliveID) => {
        const guild = client.mainGuild();
        return new Promise(async (resolve, reject) => {
            let rol = client.findRole(tooGame, aliveID)
            let props = tooGame.roleProps[rol];

            console.log("  resetting " + rol)

            // reset selection lists
            await db.set(`tooGames_${guild.id}.${tooGame.id}.list.${aliveID}`, [])

            if (props.skills) {
                // reset skills
                Object.keys(props.skills).forEach(async key => {
                    await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.skills.${key}`, (ayarlar.createTooGame().roleProps[rol].skills && ayarlar.createTooGame().roleProps[rol].skills[key]) ? ayarlar.createTooGame().roleProps[rol].skills[key] : false)
                });
            }

            // reset protects
            await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.isProtected`, ayarlar.createTooGame().roleProps[rol].isProtected ? ayarlar.createTooGame().roleProps[rol].isProtected : false)

            // reset jails
            await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.isInJail`, false)
            await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.jailorID`, 0)
            await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.jailTargetID`, 0)

            resolve(true)
        })
    }

    /* ↓↓  GAME FUNCTIONS  ↓↓ */
    client.endGame = async (tooGame, finisherUserID) => {
        const guild = client.mainGuild();

        if (tooGame.isFinished)
            return console.error("Oyun #" + tooGame.id + " zaten bitmiş.")

        let embed = new Discord.MessageEmbed()
            .setTitle(`Town of Olympos - #${tooGame.id}`)

        if (finisherUserID)
            embed.setDescription(`Oyun <@${finisherUserID}> tarafından bitirildi.`)
        else
            embed.setDescription(`Oyun bitti.`)


        if (tooGame.mode == 0) {
            let ownerMember = guild.members.cache.find(m => m.id == tooGame.ownerID)
            if (ownerMember)
                embed.setAuthor(ownerMember.displayName, ownerMember.user.displayAvatarURL())
        }

        let giveExpUsers = [];
        if (Object.keys(tooGame.alive).length != 0) {
            let aliveDesc = []
            Object.keys(tooGame.alive).forEach(aliveID => {
                aliveDesc.push("**" + tooGame.alive[aliveID] + "**: <@" + aliveID + ">")
                giveExpUsers.push(aliveID)
            });
            if (tooGame.hangs)
                Object.keys(tooGame.hangs).forEach(hangedID => {
                    let hangedRole = tooGame.hangs[hangedID];
                    if (hangedRole == "Dionysos") {
                        aliveDesc.push("**" + hangedRole + "**: <@" + hangedID + ">")
                        giveExpUsers.push(hangedID)
                    }
                });
            embed.addField("Kazananlar", aliveDesc.join("\n"))
        }
        if (Object.keys(tooGame.dead).length != 0) {
            let aliveDesc = []
            Object.keys(tooGame.dead).forEach(aliveID => {
                let deadRole = tooGame.dead[aliveID];
                if (deadRole == "Dionysos" && tooGame.hangs.hasOwnProperty(aliveID)) return;
                aliveDesc.push("**" + tooGame.dead[aliveID] + "**: <@" + aliveID + ">")
            });
            embed.addField("Kaybedenler", aliveDesc.join("\n"))
        }

        if (tooGame.mode == 0)
            giveExpUsers = giveExpUsers.concat(tooGame.ownerID)

        client.addPointToUsers("bitir", giveExpUsers)
            .then(console.log)


        await db.set(`tooGames_${guild.id}.${tooGame.id}.isFinished`, true)
        await db.set(`tooGames_${guild.id}.${tooGame.id}.timestamps.finished`, parseInt(moment().utcOffset(3).format('x')))

        let tooGameChannel = await guild.channels.cache.get(tooGame.message.channelID)
        if (!tooGameChannel) {
            return console.error("#" + tooGame.id + " - Text kanalı bulunamadı.");
        }
        let tooGameMessage = await tooGameChannel.messages.cache.get(tooGame.message.id)
        if (!tooGameMessage) {
            tooGameChannel.messages.fetch(tooGame.message.id)
                .then(tooGameMessage => {
                    tooGameMessage.edit({ embed: embed })
                        .then(async msg => {
                            await console.log(`${msg.embeds[0].title} | ${msg.embeds[0].description}`)
                        })
                        .catch(console.error);
                })
        } else {
            tooGameMessage.edit({ embed: embed })
                .then(async msg => {
                    await console.log(`${msg.embeds[0].title} | ${msg.embeds[0].description}`)
                })
                .catch(console.error);
        }

        //await tooGameChannel.send(embed)//.then(msg => msg.delete({ timeout: 10000 }))
        client.sendEmbed(tooGame, embed)
        client.sendEmbedToAllDeads(tooGame, embed)

        let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id)
        if (!oyunOdası) return console.error(tooGame.gameRoom.id + " id'li ses odasını bulamıyorum. Oyun Kodu: #" + tooGame.id)

        await oyunOdası.updateOverwrite(guild.roles.everyone, {
            SPEAK: null
        });
        await oyunOdası.updateOverwrite(guild.roles.cache.find(r => r.name == "TOO Yetkili"), {
            SPEAK: null
        });
        tooGame.players.forEach(async playerID => {
            if (oyunOdası.permissionOverwrites.get(playerID))
                oyunOdası.permissionOverwrites.get(playerID).delete()

            let playerMember = guild.members.cache.find(m => m.id == playerID);
            if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")
            if (playerMember.voice.channelID)
                playerMember.voice.setMute(false, "Oyun bitti!")
                    .then(async updatedMember => {
                        console.log(updatedMember.displayName + ": " + updatedMember.voice.serverMute)
                        let dbPath = `liste_${guild.id}.mutedPlayersID`

                        if (!db.has(dbPath)) // yoksa
                            await db.set(dbPath, []) // boş oluştur

                        if (db.has(dbPath) && db.get(dbPath).some(id => id == updatedMember.user.id)) {
                            let list = db.get(dbPath);
                            await db.set(dbPath, list.filter(i => i && i != updatedMember.user.id)) // boşları alalım
                            //await console.log(db.get(dbPath))
                        }
                    })
                    .catch(() => { })
        });

    }
    client.killAlive = async (tooGame, aliveID, ölümBilgisi = "Kader olarak..") => {
        const guild = client.mainGuild();
        return new Promise(async (resolve, reject) => {
            if (tooGame.alive.hasOwnProperty(aliveID)) {
                await db.set(`tooGames_${guild.id}.${tooGame.id}.dead.${aliveID}`, tooGame.alive[aliveID])
                await db.delete(`tooGames_${guild.id}.${tooGame.id}.alive.${aliveID}`)

                let killedMember = guild.members.cache.find(m => m.id == aliveID);
                if (killedMember) {
                    await console.log(killedMember.user.tag + " öldü. Oyun kodu: #" + tooGame.id)

                    killedMember.voice.setMute(true, "Öldü.")

                    let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id)
                    if (oyunOdası) {
                        if (oyunOdası.permissionOverwrites.get(aliveID))
                            oyunOdası.permissionOverwrites.get(aliveID).delete()
                    }
                }

                await console.log("yaşayanlar:", db.get(`tooGames_${guild.id}.${tooGame.id}.alive`))

                await client.getDmChannel(aliveID)
                    .then(channel => {
                        let deadEmbed = client.embed()
                            .setTitle("ÖLDÜN!")
                            .setImage("https://i.hizliresim.com/VBimxX.png")
                            .setFooter("Town of Olympos - #" + tooGame.id)
                        //.addField("Ölüm Bilgisi", ölümBilgisi) // birden fazla kişi öldürdüyse ilk öldüren yazıyo
                        channel.send(deadEmbed)
                            .then(msg => {
                                resolve(msg)
                            })
                            .catch(reject)
                    })
                    .catch(reject)
            } else {
                resolve(aliveID + " id'li kişi zaten ölü olduğu için öldürülemedi.")
            }
        })
    }
    client.killAtNight = async (tooGame, userID, killerID) => {
        const guild = client.mainGuild();
        if (tooGame.alive.hasOwnProperty(userID)) {
            let killerRole = client.findRole(tooGame, killerID);
            let killedRole = client.findRole(tooGame, userID);
            let censoredRole = ayarlar.rolPaketleri.büyükTanrılar.some(t => t == killerRole) ? "ÜÇ BÜYÜKLER" : killerRole;

            if (userID == killerID) {
                killerRole = "KENDİSİ"
                censoredRole = "KENDİSİ"
            }

            db.set(`tooGames_${guild.id}.${tooGame.id}.lastDeaths.${userID}`, censoredRole)
            console.log(`${userID}(${killedRole}) id'li oyuncu ${killerRole.toUpperCase()} tarafından öldürüldü.`)
            client.reportToHermes(tooGame, `${killedRole}, **${killerRole.toUpperCase()}** tarafından öldürüldü.`)
        }
    }
    client.revivePlayer = async (tooGame, deadID, reviverID) => {
        const guild = client.mainGuild();
        return new Promise(async (resolve, reject) => {
            if (tooGame.dead.hasOwnProperty(deadID)) {
                await db.set(`tooGames_${guild.id}.${tooGame.id}.alive.${deadID}`, tooGame.dead[deadID])
                let deads = await db.get(`tooGames_${guild.id}.${tooGame.id}.dead`)
                delete deads[deadID]
                await db.set(`tooGames_${guild.id}.${tooGame.id}.dead`, deads)

                let revivedMember = guild.members.cache.find(m => m.id == deadID);
                if (revivedMember) {
                    await console.log(revivedMember.user.tag + " canlandı. Oyun kodu: #" + tooGame.id)

                    client.unmutePlayer(tooGame, deadID)

                    let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id)
                    if (oyunOdası) {
                        await oyunOdası.updateOverwrite(deadID, {
                            SPEAK: true
                        });
                    }
                }

                await console.log("ölüler:", db.get(`tooGames_${guild.id}.${tooGame.id}.dead`))

                await client.sendEmbedToGameChannel(tooGame, client.embed().setDescription("<@" + deadID + "> hayata geri döndü!"))

                await client.getDmChannel(deadID)
                    .then(channel => {
                        let reviveEmbed = client.embed()
                            .setTitle("HAYATA DÖNDÜN!")
                            .setImage("")
                            .setFooter("Town of Olympos - #" + tooGame.id)
                            .addField("Hayata Döndüren", client.findRole(tooGame, reviverID))
                        channel.send(reviveEmbed)
                            .then(msg => {
                                resolve(msg)
                            })
                            .catch(reject)
                    })
                    .catch(reject)
            } else {
                resolve(deadID + " id'li kişi zaten hayatta olduğu için hayata döndürülemedi.")
            }
        })
    }
    client.unmutePlayer = async (tooGame, unmuteID) => {
        const guild = client.mainGuild();
        let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id);
        if (!oyunOdası) return console.error("Oyun odası bulunamadı! id: " + tooGame.gameRoom.id)

        let playerID = unmuteID;

        if (oyunOdası.permissionOverwrites.get(playerID))
            oyunOdası.permissionOverwrites.get(playerID).delete()

        let playerMember = guild.members.cache.find(m => m.id == playerID);
        if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")
        playerMember.voice.setMute(false, "Yönetici")
            .then(async updatedMember => {
                if (!updatedMember.voice.serverMute) {// unmute başarılı
                    let dbPath = `liste_${guild.id}.mutedPlayersID`

                    if (!db.has(dbPath)) // yoksa
                        await db.set(dbPath, []) // boş oluştur

                    if (db.has(dbPath) && db.get(dbPath).some(id => id == updatedMember.user.id)) {
                        let list = db.get(dbPath);
                        await console.log(db.set(dbPath, list.filter(i => i && i != updatedMember.user.id))) // boşları alalım
                        await console.log(db.get(dbPath))
                    }
                }
            }).catch(console.error)
    }
    client.mutePlayer = async (tooGame, unmuteID) => {
        const guild = client.mainGuild();
        let oyunOdası = guild.channels.cache.find(c => c.id == tooGame.gameRoom.id);
        if (!oyunOdası) return console.error("Oyun odası bulunamadı! id: " + tooGame.gameRoom.id)

        let playerID = unmuteID;

        await oyunOdası.updateOverwrite(playerID, {
            SPEAK: true
        });
        let playerMember = guild.members.cache.find(m => m.id == playerID);
        if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")
        playerMember.voice.setMute(true, "Oyun başladı!")
            .then(async updatedMember => {
                if (updatedMember.voice.serverMute) {// mute başarılı
                    let dbPath = `liste_${guild.id}.mutedPlayersID`

                    if (!db.has(dbPath)) // yoksa
                        await db.push(dbPath, updatedMember.user.id) // pushla
                    else if (!db.get(dbPath).some(id => id == updatedMember.user.id)) // yoksa
                        await db.push(dbPath, updatedMember.user.id) // pushla

                    await console.log(db.get(dbPath))
                }
            }).catch(console.error)
    }
    client.hang = async (tooGame, userID, ölümBilgisi = "Darağacının ziyaretçisi var!") => {
        const guild = client.mainGuild();
        tooGame = client.tooGame(tooGame); // refresh tooGame
        if (tooGame.alive.hasOwnProperty(userID)) {
            client.killAlive(tooGame, userID, ölümBilgisi)
                .then(async result => {
                    if (result) {
                        let deadEmbed = client.embed()
                            .setDescription("<@" + userID + "> ASILDI!")
                            .setImage("https://i.hizliresim.com/FPXYOa.png")
                            .addField("Ölüm Bilgisi", ölümBilgisi)
                        client.sendEmbedToGameChannel(tooGame, deadEmbed)
                            .then(async msg => {
                                let hangedRole = client.findRole(tooGame, userID)
                                console.log("Asılan rol: " + hangedRole)

                                await db.set(`tooGames_${guild.id}.${tooGame.id}.hangs.${userID}`, hangedRole)


                                let deadID = userID;

                                let notlar = db.has(`tooGames_${guild.id}.${tooGame.id}.notes.${deadID}`) ? db.get(`tooGames_${guild.id}.${tooGame.id}.notes.${deadID}`) : []
                                let desc = []
                                let i = 1;
                                notlar.forEach(not => {
                                    if (!not) return i++;
                                    desc.push("GECE " + (i.toString().length == 1 ? ("0" + i) : i) + " - " + not.replace(/`/g, "'"))
                                    i += 1;
                                });
                                if (notlar.length == 0)
                                    desc.push("**NOT BULUNAMADI!**")

                                let deadPlayer = guild.members.cache.find(m => m.id == deadID)

                                let notEmbed = client.embed()
                                    .setTitle("ÖLEN KİŞİNİN NOTLARI")
                                    .setDescription("<@" + deadID + ">\n```swift\n" + desc.join("\n") + "```")
                                    .setColor(client.embedColor)

                                if (deadPlayer)
                                    notEmbed.setAuthor(deadPlayer.user.tag, deadPlayer.user.displayAvatarURL({ dynamic: true }))

                                client.sendEmbedToGameChannel(tooGame, notEmbed)
                                    .then(msg => {
                                        client.setNight(tooGame);
                                    })



                                /*
                                let msgURL = "https://discordapp.com/channels/" + guild.id + "/" + msg.channel.id + "/" + msg.id
 
                                let spoilerEmbed = client.embed()
                                    .setDescription("BİRİSİ ASILDI!")
                                    .setThumbnail("https://image.flaticon.com/icons/png/512/123/123985.png")
                                    .addField("Ölüm Bilgisi", "[Görmek için tıklayın!](" + msgURL + ")")
 
                                await client.sendEmbedToAllAlives(tooGame, spoilerEmbed, [userID])
                                await client.sendEmbedToOwner(tooGame, spoilerEmbed)
                                */

                            })

                    }
                })
        }
    }
    client.checkDeaths = async (tooGame) => {
        const guild = client.mainGuild();
        console.log("Checking deaths for " + JSON.stringify(tooGame.lastDeaths), Object.keys(tooGame.lastDeaths))
        return new Promise((resolve, reject) => {
            if (tooGame.lastDeaths && Object.keys(tooGame.lastDeaths).length != 0) {
                Object.keys(tooGame.lastDeaths).forEach(killedID => {
                    client.killAlive(tooGame, killedID, "**" + tooGame.lastDeaths[killedID].toUpperCase() + "** tarafından katledildin!")
                        .then(result => {
                            if (result) {
                                console.log(result)
                            }
                        })
                });
                let embed = client.embed()
                    .setTitle("DÜN GECE ÖLENLER VAR!")
                    .setImage("https://i.hizliresim.com/u5SH3Z.png")

                let desc = []
                Object.keys(tooGame.lastDeaths).forEach(deadID => {
                    desc.push(`<@${deadID}> öldürüldü. Öldüren kişi: **${tooGame.lastDeaths[deadID].toUpperCase()}**`)
                });

                embed.addField("Ölüm Bilgileri", desc)

                client.sendEmbedToGameChannel(tooGame, embed)
                    .then(msg => {
                        // ölenlerin notlarını yayınla
                        Object.keys(tooGame.lastDeaths).forEach(deadID => {
                            let notlar = db.has(`tooGames_${guild.id}.${tooGame.id}.notes.${deadID}`) ? db.get(`tooGames_${guild.id}.${tooGame.id}.notes.${deadID}`) : []
                            let desc = []
                            let i = 1;
                            notlar.forEach(not => {
                                if (!not) return i++;
                                desc.push("GECE " + (i.toString().length == 1 ? ("0" + i) : i) + " - " + not.replace(/`/g, "'"))
                                i += 1;
                            });
                            if (notlar.length == 0)
                                desc.push("**NOT BULUNAMADI!**")

                            let deadPlayer = guild.members.cache.find(m => m.id == deadID)

                            let notEmbed = client.embed()
                                .setTitle("ÖLEN KİŞİNİN NOTLARI")
                                .setDescription("<@" + deadID + ">\n```swift\n" + desc.join("\n") + "```")
                                .setColor(client.embedColor)

                            if (deadPlayer)
                                notEmbed.setAuthor(deadPlayer.user.tag, deadPlayer.user.displayAvatarURL({ dynamic: true }))

                            client.sendEmbedToGameChannel(tooGame, notEmbed)
                        });


                        resolve("işlem tamam")
                    })
                    .catch(reject)
            } else {
                resolve("lastDeaths bulunamadı!")
            }
        })
    }
    /* ↑↑  GAME FUNCTIONS  ↑↑ */
}