const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");
const fs = require('fs');

module.exports = async (client) => {
    const guild = client.mainGuild();
    client.dayRoles = {}
    client.dayRoles.Athena = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            }
            let targetRole = client.findRole(tooGame, targetID);

            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.jailorID`, aliveID)
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.isProtected`, true)
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.isInJail`, true)
            db.push(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.jailedIDs`, targetID)
            let selectionList = db.get(`tooGames_${guild.id}.${tooGame.id}.list.${aliveID}`);
            if (selectionList && selectionList.some(id => id == targetID)) {
                db.delete(`tooGames_${guild.id}.${tooGame.id}.list.${aliveID}.${selectionList.indexOf(targetID)}`)
                console.log("\n\n###############################Athena seçim yaptığı kişiyi bi daha seçemesin diye listesinden kaldırıldı\n\n")
            } else {
                console.log("\n\n###############################Athena seçtiği kişinin id'sini listesinden kaldıramadım!\n\n")
            }
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.jailTargetID`, targetID)
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.isProtected`, true)
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.isInJail`, true)

            tooGame = client.tooGame(tooGame)

            let targetInfoEmbed = client.embed()
                .setTitle("SORGUYA ALINDIN!")
                .setDescription("Bu mesajdan sonraki `.`_(nokta)_ işaretiyle başlayan her mesaj direkt olarak\n**" + rol + "** rolüne sahip kişiye iletilecektir!\nAynı zamanda onun tarafından yazılan mesajlar da bu kanaldan gelecektir.")
                .setColor("RED")
                .setFooter("Town of Olympos - #" + tooGame.id)
                .addField("ÖRNEK MESAJ:", "```.merhaba```")
            client.sendEmbedToAlive(tooGame, targetInfoEmbed, targetID)
                .then(msg => {
                    let örnekMesaj = ".merhaba"
                    let infoEmbed = client.embed()
                        .setTitle("SORGU BAŞLADI!")
                        .setDescription("Bu mesajdan sonraki `.`_(nokta)_ işaretiyle başlayan her mesaj direkt olarak\n<@" + targetID + "> adlı kişiye iletilecektir!\nAynı zamanda onun tarafından yazılan mesajlar da bu kanaldan gelecektir.\n\nSeçtiğin kişiyi öldürmek istiyorsan **noktasız** `öldür` yazıp göndermen yeterli!")
                        .setColor("GREEN")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                        .addField("ÖRNEK MESAJ:", "```.merhaba```")
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(resolve)
                        .catch(reject)
                })
                .catch(reject)



        })


    }

    client.nightDemeter = {}
    client.nightDemeter.Demeter = (tooGame, aliveID, rol, props) => {
        const guild = client.mainGuild();
        return new Promise((resolve, reject) => {
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            }
            let targetRole = client.findRole(tooGame, targetID);

            let kıtlıkRoles = [].concat("Medusa", ayarlar.sınıflandırma.kötü, ayarlar.sınıflandırma.tarafsız)
            let intCount = 0
            kıtlıkRoles.forEach(async role => {
                await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${role}.skills.cantUseID`, aliveID)
                await db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${role}.skills.canUse`, false)
                intCount += 1
            });

            let interval = setInterval(() => {
                if (kıtlıkRoles.length <= intCount) {
                    clearInterval(interval)

                    let lastEvents = db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents`);

                    console.log("last events: ", lastEvents)

                    let desc = []
                    Object.keys(lastEvents).forEach(userID => {
                        let role = client.findRole(tooGame, userID)
                        if (db.get(`tooGames_${guild.id}.${tooGame.id}.roleProps.${role}.skills.canUse`)) return
                        if (lastEvents[role] && !lastEvents[role].skills || (lastEvents[role] && !lastEvents[role].skills.selectedID && !lastEvents[role].skills.selectedID1)) return
                        if (!lastEvents[role]) return
                        desc.push(`**${role}** seçimini **${lastEvents[role].skills.selectedID1 ? client.findRole(tooGame, lastEvents[role].skills.selectedID1) : client.findRole(tooGame, lastEvents[role].skills.selectedID)}**${lastEvents[role].skills.selectedID2 ? (` ve **${client.findRole(tooGame, lastEvents[role].skills.selectedID2)}**`) : ""} üzerinde kullandı.`)
                    });
                    if (desc.length == 0)
                        desc.push("**Hiçbir şey olmadı!**")

                    let demeterEmbed = client.embed()
                        .setTitle("DÜN GECE OLANLAR")
                        .setDescription(desc.join("\n"))
                        .setFooter("Town of Olympos - #" + tooGame.id)

                    client.sendEmbedToAlive(tooGame, demeterEmbed, aliveID)
                        .then(msg => {
                            resolve(rol + " kıtlık saldı.")
                        })
                        .catch(reject)


                }
            }, 100);

        })
    }

    client.nightMedusa = {}
    client.nightMedusa.Medusa = (tooGame, aliveID, rol, props) => {
        const guild = client.mainGuild();
        return new Promise((resolve, reject) => {
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("KORUMA BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.isProtected`, true)
            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.skills.killVisitor`, true)
            resolve(rol + " koruma bastı.")
        })
    }

    client.nightGuardRoles = {}
    client.nightGuardRoles.Hipokrat = (tooGame, aliveID, rol, props) => {
        const guild = client.mainGuild();
        return new Promise((resolve, reject) => {
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.isProtected`, true)

            resolve(true)
        })
    }
    client.nightGuardRoles.Apollo = (tooGame, aliveID, rol, props) => {
        const guild = client.mainGuild();
        return new Promise((resolve, reject) => {
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${targetRole}.isProtected`, true)

            resolve(true)
        })
    }

    client.nightRoles = {}
    client.nightRoles.Zeus = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("SALDIRI BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);


            let yardakçıRol = "Poseidon" // öldüren kişi olarak gözükecek rol
            let yardakçıHasToAlive = true; // öldüren kişi olarak gözükecek role ait gerçek kişinin hayatta olması mı gerekiyor? hayırsa öldüren kişi rolün kendisi olarak gözükür
            let yardakçıID = client.findUserIDFromRole(tooGame, yardakçıRol);



            if (typeof yardakçıID == "array")
                yardakçıID = yardakçıID[0];

            let killerID = yardakçıHasToAlive ? (tooGame.alive.hasOwnProperty(yardakçıID) ? yardakçıID : aliveID) : yardakçıID;

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                if (killerID == aliveID) {
                    client.killAtNight(tooGame, aliveID, targetID)
                } else {
                    if (typeof yardakçıID == "array")
                        yardakçıID.forEach(yardakçı => {
                            client.killAtNight(tooGame, yardakçı, targetID)
                        });
                    else
                        client.killAtNight(tooGame, yardakçıID, targetID)
                }

            }

            if (tooGame.roleProps[targetRole].isProtected) {// saldırdığı kişinin koruması var
                let infoEmbed = client.embed()
                    .setTitle("SALDIRI BAŞARISIZ OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİDE KORUMA VAR!")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }


            client.killAtNight(tooGame, targetID, killerID)
            let infoEmbed = client.embed()
                .setTitle("SALDIRI BAŞARILI OLDU!")
                .setDescription("SEÇTİĞİN KİŞİ " + (killerID == aliveID ? "ÖLDÜ" : (yardakçıRol.toUpperCase() + " TARAFINDAN ÖLDÜRÜLDÜ")) + "!")
                .setColor("GREEN")
                .setFooter("Town of Olympos - #" + tooGame.id)
            client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                .then(resolve)
                .catch(reject)
        })
    }
    client.nightRoles.Poseidon = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let zeusID = client.findUserIDFromRole(tooGame, "Zeus");

            if (tooGame.alive.hasOwnProperty(zeusID))
                return resolve(rol + " yeteneğini kullanamıyor çünkü zeus hayatta."); // zeus yaşıyorsa poseidon'a iş düşmez

            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("SALDIRI BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            if (tooGame.roleProps[targetRole].isProtected) {// saldırdığı kişinin koruması var
                let infoEmbed = client.embed()
                    .setTitle("SALDIRI BAŞARISIZ OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİDE KORUMA VAR!")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }

            let killerID = aliveID;

            client.killAtNight(tooGame, targetID, killerID)
            let infoEmbed = client.embed()
                .setTitle("SALDIRI BAŞARILI OLDU!")
                .setDescription("SEÇTİĞİN KİŞİ ÖLDÜ!")
                .setColor("GREEN")
                .setFooter("Town of Olympos - #" + tooGame.id)
            client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                .then(resolve)
                .catch(reject)
        })
    }
    client.nightRoles.Hades = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("TEHDİT BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            if (tooGame.roleProps[targetRole].isProtected) {// saldırdığı kişinin koruması var
                let infoEmbed = client.embed()
                    .setTitle("TEHDİT BAŞARISIZ OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİDE KORUMA VAR!")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }

            let changedRole = "Poseidon";

            let rnd = client.getRandomInt(1, 6);
            if (rnd == 1) {
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
                    .setDescription(rol + " seni tehdit etti ve tehditinde başarılı oldu.")
                    .addField(changedRole.toUpperCase(), (ayarlar.rolBilgileri[changedRole] ? ayarlar.rolBilgileri[changedRole] : "Rol açıklaması bulunamadı. Lütfen yetkililere bildiriniz!"))
                    .setImage(ayarlar.rolResimleri[changedRole] ? ayarlar.rolResimleri[changedRole] : "")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, changedInfoEmbed, targetID);
                let infoEmbed = client.embed()
                    .setTitle("TEHDİT BAŞARILI OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİ ARTIK BİR **" + changedRole.toUpperCase() + "**!")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
            } else {
                let infoEmbed = client.embed()
                    .setTitle("TEHDİT BAŞARISIZ OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİNİN ROLÜ DEĞİŞMEDİ!")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
            }
        })
    }
    client.nightRoles.Ares = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("SALDIRI BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (ayarlar.rolPaketleri.büyükTanrılar.some(r => r == targetRole)) {
                // büyük tanrıya saldırmış
                let infoEmbed = client.embed()
                    .setTitle("SALDIRI BAŞARISIZ OLDU!")
                    .setDescription("Güçlü bir tanrıya saldırmış olmalısın.")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            if (tooGame.roleProps[targetRole].isProtected) {// saldırdığı kişinin koruması var
                let infoEmbed = client.embed()
                    .setTitle("SALDIRI BAŞARISIZ OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİDE KORUMA VAR!")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }

            let killerID = aliveID;

            client.killAtNight(tooGame, targetID, killerID)
            let infoEmbed = client.embed()
                .setTitle("SALDIRI BAŞARILI OLDU!")
                .setDescription("SEÇTİĞİN KİŞİ ÖLDÜ!")
                .setColor("GREEN")
                .setFooter("Town of Olympos - #" + tooGame.id)
            client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                .then(resolve)
                .catch(reject)
        })
    }
    client.nightRoles.Aphrodite = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID1 = props.skills.selectedID1;
            let targetID2 = props.skills.selectedID2;
            if (!targetID1 || !targetID2) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("ÇARPIŞMA BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole1 = client.findRole(tooGame, targetID1);
            let targetRole2 = client.findRole(tooGame, targetID2);
            let targetProps1 = tooGame.roleProps[targetRole1];
            let targetProps2 = tooGame.roleProps[targetRole2];


            if (targetProps1.skills.killVisitor && !targetProps2.skills.killVisitor) {
                // 1. kişinin ziyaretçi öldürme yeteneği açık
                client.killAtNight(tooGame, targetID2, targetID1)
                let infoEmbed = client.embed()
                    .setTitle("BAŞARILI!")
                    .setDescription("İki tanrı birbirine girdi ve 1 kazananı oldu.")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }
            if (!targetProps1.skills.killVisitor && targetProps2.skills.killVisitor) {
                // 2. kişinin ziyaretçi öldürme yeteneği açık
                client.killAtNight(tooGame, targetID1, targetID2)
                let infoEmbed = client.embed()
                    .setTitle("BAŞARILI!")
                    .setDescription("İki tanrı birbirine girdi ve 1 kazananı oldu.")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }
            if (targetProps1.skills.killVisitor && targetProps2.skills.killVisitor) {
                // 2 kişinin de ziyaretçi öldürme yeteneği açık
                client.killAtNight(tooGame, targetID1, targetID2)
                client.killAtNight(tooGame, targetID2, targetID1)
                let infoEmbed = client.embed()
                    .setTitle("BAŞARILI!")
                    .setDescription("İki tanrı birbirine girdi ve 2'si de birbirini öldürdü.")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }

            if (!targetProps1.killer && !targetProps2.killer) {
                // iki tarafın da öldürme yeteneği yok
                let infoEmbed = client.embed()
                    .setTitle("BAŞARISIZ!")
                    .setDescription("Çarpışma sonucu ölen olmadı.")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }
            if (targetProps1.killer && !targetProps2.killer) {
                // 1 2 yi öldürür
                client.killAtNight(tooGame, targetID2, targetID1)
                let infoEmbed = client.embed()
                    .setTitle("BAŞARILI!")
                    .setDescription("İki tanrı birbirine girdi ve 1 kazananı oldu.")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }
            if (!targetProps1.killer && targetProps2.killer) {
                // 2 1 i öldürür
                client.killAtNight(tooGame, targetID1, targetID2)
                let infoEmbed = client.embed()
                    .setTitle("BAŞARILI!")
                    .setDescription("İki tanrı birbirine girdi ve 1 kazananı oldu.")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }
            if (targetProps1.killer && targetProps2.killer) {
                // iki tarafın da öldürme yeteneği var

                let üçBüyükler = ayarlar.rolPaketleri.büyükTanrılar;

                if (üçBüyükler.some(r => r == targetRole1) && üçBüyükler.some(r => r == targetRole2)) {
                    // üç büüykler kendi arasına düşmüş
                    let infoEmbed = client.embed()
                        .setTitle("BAŞARISIZ!")
                        .setDescription("İki tanrı birbirine girdi ama kazanan olmadı.")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(resolve)
                        .catch(reject)
                } else {
                    let aresID = üçBüyükler.some(r => r == targetRole1) ? targetID2 : targetID1;
                    // üç büyükler vs ares
                    client.killAtNight(tooGame, aresID, aresID == targetID1 ? targetID2 : targetID1)
                    let infoEmbed = client.embed()
                        .setTitle("BAŞARILI!")
                        .setDescription("İki tanrı birbirine girdi ve 1 kazananı oldu.")
                        .setColor("GREEN")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(resolve)
                        .catch(reject)
                }


                return;
            }

            resolve(true)
        })
    }
    client.nightRoles.Hera = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("ZİYARET BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            let infoEmbed = client.embed()
                .setDescription("Ziyaret ettiğin kişi bir **" + targetRole + "**!")
                .setColor("GREEN")
                .setFooter("Town of Olympos - #" + tooGame.id)
            client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                .then(resolve)
                .catch(reject)
        })
    }
    client.nightRoles.Athena = (tooGame, aliveID, rol, props) => {
        return new Promise(async (resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                // reset athena
                console.log(rol + "yeteneğini kullanmamış")
                client.resetAliveID(client.tooGame(tooGame), aliveID)
                    .then(() => {
                        resolve(rol + " yeteneğini kullanmamış");
                    })
                return
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("SALDIRI BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => {
                            console.log(rol + " rolünün yeteneği blocklanmıştır.")

                        })
                        .catch(reject)

                    // reset athena
                    client.resetAliveID(client.tooGame(tooGame), aliveID)
                        .then(() => {
                            resolve(rol + " rolünün yeteneği blocklanmıştır.");
                        })
                    return
                }
            }

            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            if (targetRole == "Ares" && !props.skills.killSelected) {
                // ares'i sorguya almış ve öldürmemiş
                client.killAtNight(tooGame, aliveID, targetID)
            }

            if (props.skills.killSelected) {
                // sorguya aldığını öldürmeyi seçmiş
                client.killAtNight(tooGame, targetID, aliveID)
                let infoEmbed = client.embed()
                    .setTitle("SALDIRI BAŞARILI OLDU!")
                    .setDescription("SORGULADIĞIN KİŞİ ÖLDÜ!")
                    .setColor("GREEN")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
            }

            resolve(true)
        })
    }
    client.nightRoles.Pegasus = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("DİRİLTME BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            client.revivePlayer(tooGame, targetID, aliveID)
                .then(() => {
                    let infoEmbed = client.embed()
                        .setTitle("DİRİLTME BAŞARILI OLDU!")
                        .setDescription("<@" + targetID + "> artık hayatta!")
                        .setColor("GREEN")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(resolve)
                        .catch(reject)

                    return
                })

        })
    }
    client.nightRoles.Artemis = (tooGame, aliveID, rol, props) => {
        return new Promise((resolve, reject) => {
            const guild = client.mainGuild();
            let targetID = props.skills.selectedID;
            if (!targetID) {
                // yeteneğini kullanmamış
                return resolve(rol + " yeteneğini kullanmamış");
            } else {
                if (!props.skills.canUse) {
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.limit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exLimit`))
                    if (db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}`).hasOwnProperty("exSelfLimit"))
                        db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${rol}.selfLimit`, db.get(`tooGames_${guild.id}.${tooGame.id}.lastEvents.${rol}.exSelfLimit`))

                    let infoEmbed = client.embed()
                        .setTitle("SALDIRI BAŞARISIZ OLDU!")
                        .setColor("RED")
                        .setFooter("Town of Olympos - #" + tooGame.id)
                    client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                        .then(() => { resolve(rol + " rolünün yeteneği blocklanmıştır.") })
                        .catch(reject)

                    return
                }
            }
            let targetRole = client.findRole(tooGame, targetID);

            if (tooGame.roleProps[targetRole].skills && tooGame.roleProps[targetRole].skills.killVisitor) {
                // saldırdığı kişinin ziyaretçi öldürme yeteneği açık
                client.sendInfoToVisitorKiller(tooGame, targetID)
                client.killAtNight(tooGame, aliveID, targetID)
            }

            if (tooGame.roleProps[targetRole].isProtected) {// saldırdığı kişinin koruması var
                let infoEmbed = client.embed()
                    .setTitle("SALDIRI BAŞARISIZ OLDU!")
                    .setDescription("SEÇTİĞİN KİŞİDE KORUMA VAR!")
                    .setColor("RED")
                    .setFooter("Town of Olympos - #" + tooGame.id)
                client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                    .then(resolve)
                    .catch(reject)
                return;
            }

            if (ayarlar.sınıflandırma.iyi.some(r => r == targetRole)) {
                // masum birini öldürmüş
                db.set(`tooGames_${guild.id}.${tooGame.id}.roleProps.${"Artemis"}.suicide`, true);
            }

            client.killAtNight(tooGame, targetID, aliveID)
            let infoEmbed = client.embed()
                .setTitle("SALDIRI BAŞARILI OLDU!")
                .setDescription("SEÇTİĞİN KİŞİ ÖLDÜ!")
                .setColor("GREEN")
                .setFooter("Town of Olympos - #" + tooGame.id)
            client.sendEmbedToAlive(tooGame, infoEmbed, aliveID)
                .then(resolve)
                .catch(reject)
        })
    }



}