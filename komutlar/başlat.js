//oluştur komutunu yazan yöneticiyle aynı olmazsa ya da yazan kişi oyun oluşturmadıysa
//lütfen önce oyun oluşturun tarzı bi hata. 
//bu komutu kullanan kişinin en son oluşturduğu oyun baz alınır ve oyun başlatılır.
const Discord = require('discord.js');
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const path = require('path');
const moment = require("moment");
moment.locale("tr");

const komutAdı = __filename.replace(__dirname, "").replace("/", "").replace(".js", "")

exports.run = async (client, message, args) => {
    const guild = message.guild;
    const tooYetkili = message.member;

    const oyunOdası = tooYetkili.voice.channel;

    if (!oyunOdası || !oyunOdası.name.includes("Town of Olympos")) return message.reply("Lütfen önce bir Town of Olympos ses odasına giriniz.")

    if (!db.has(`tooGames_${guild.id}`)) return message.reply("Lütfen önce bir oyun oluşturunuz. " + ayarlar.prefix + "oluştur"); // daha önce hiç oyun oluşturulmamış

    if (db.get(`tooGames_${guild.id}`).find(g => g.gameRoom.id == oyunOdası.id && g.isStarted && !g.isFinished))
        return message.reply("Bulunduğunuz ses odasında devam eden bir oyun bulunuyor."); //  odada başlamış ve bitmemiş oyun var

    let tooGame = db.get(`tooGames_${guild.id}`).find(g => g.gameRoom.id == oyunOdası.id && !g.isStarted && !g.isFinished);

    if (!tooGame) return message.reply("Lütfen önce bir oyun oluşturunuz. " + ayarlar.prefix + "oluştur");  // girilen odada bekleyen oyun yok

    if (tooGame.players.length < ayarlar.oyunAyarları.minKişi)
        return message.channel.send(new Discord.MessageEmbed()
            .setTitle("OYUN BAŞLATILAMADI!")
            .setDescription("Oyun başlaması için en az **" + ayarlar.oyunAyarları.minKişi + "** oyuncu olması gerekiyor!\nDaha **" + (ayarlar.oyunAyarları.minKişi - tooGame.players.length) + "** oyuncuya ihtiyacınız var.")
        );

    if (tooGame.players.length > ayarlar.oyunAyarları.maxKişi)
        return message.channel.send(new Discord.MessageEmbed()
            .setTitle("OYUN BAŞLATILAMADI!")
            .setDescription("Oyun başlaması için en fazla **" + ayarlar.oyunAyarları.maxKişi + "** oyuncu olması gerekiyor!\**" + (tooGame.players.length - ayarlar.oyunAyarları.maxKişi) + "** oyuncunun çıkması gerekiyor.")
        );

    let playersList = [];
    tooGame.players.forEach(player => {
        playersList.push("<@" + player + ">")
    });

    tooGame.embed.fields[tooGame.embed.fields.length - 1].value = playersList.join("\n")

    tooGame.embed = new Discord.MessageEmbed(tooGame.embed)
        .setAuthor(tooGame.embed.title.replace(/`/g, ""))
        .setTitle("OYUN 1 DAKİKA SONRA BAŞLIYOR")
        .setColor("PURPLE")
        .setDescription("Tüm oyunculara roller rastgele dağıtılmış ve özel mesajdan bildirilmiştir.")

    guild.channels.cache.find(c => c.id == tooGame.message.channelID).messages.fetch(tooGame.message.id)
        .then(tooGameMessage => {
            tooGameMessage.edit({ embed: tooGame.embed })
                .then(msg => console.log(`Updated the content of a message to ${msg.content}`))
                .catch(console.error);
        })
        .catch(err => console.error)



    let büyükTanrılar = ayarlar.rolPaketleri.büyükTanrılar;
    let dağıtılacakRoller = ayarlar.rolPaketleri[tooGame.players.length] ? ayarlar.rolPaketleri[tooGame.players.length] : ayarlar.rolPaketleri[15]

    // Üyelere rastgele rol dağıtımı.
    tooGame.players.forEach(async playerID => {
        let randomInt = getRandomInt(0, dağıtılacakRoller.length - 1);
        let selectedRole = dağıtılacakRoller[randomInt];
        dağıtılacakRoller.splice(randomInt, 1);

        if (!tooGame.roles[selectedRole])
            tooGame.roles[selectedRole] = [playerID]
        else
            tooGame.roles[selectedRole].push(playerID);

        console.log("Added: " + selectedRole)

        let playerMember = guild.members.cache.find(m => m.id == playerID);
        if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")

    });




    // Rol ve Üye eşleşmeleri tamamlandı. Hepsine DM at!
    Object.keys(tooGame.roles).forEach(role => {
        let playerIDs = tooGame.roles[role];

        playerIDs.forEach(playerID => {
            let playerMember = guild.members.cache.find(m => m.id == playerID);
            if (!playerMember) return console.error(playerID + " id'li üye bulunamadı!")

            const rolBilgiEmbed = new Discord.MessageEmbed()
                .setAuthor("ROLÜN BELİRLENDİ")
                .setTitle("**1 DAKİKA SONRA OYUN BAŞLAYACAK!**")
                .setColor(1)
                .setImage(ayarlar.rolResimleri[role] ? ayarlar.rolResimleri[role] : "")
                .addField("✧".repeat(33), "**" + role.toUpperCase() + "**\n" + (ayarlar.rolBilgileri[role] ? ayarlar.rolBilgileri[role] : "Rol açıklaması bulunamadı. Lütfen yetkililere bildiriniz!"))
                .addField("✧".repeat(33), "```• Burada yazan mesajları chate atıp info vermek veya sesli okumak yasaktır.\n• Oyun bitmeden sesli odadan ayrılırsan geri dönebilmek için 3 dakikan var.\n• Zamanında geri dönemezsen oyunda ölü durumuna düşersin ve -20 puan alırsın.```")

            playerMember.send(rolBilgiEmbed)
                .then(async msg => {
                    db.set(`tooGames_${guild.id}.${tooGame.id}.infoMessages.${playerID}`, { id: msg.id, channelID: msg.channelID })
                    if (!tooGame.infoMessages)
                        tooGame.infoMessages = [];

                    tooGame.infoMessages[playerID] = { id: msg.id, channelID: msg.channelID }

                    // Rol büyük tanrıysa ek bilgi.
                    if (büyükTanrılar.some(r => r == role)) {
                        let seçilenTanrılarDesc = []
                        büyükTanrılar.forEach(tanrı => {
                            if (tanrı == role) return; // Kendi rolünü tekrar yazma
                            if (Object.keys(tooGame.roles).some(r => r == tanrı))
                                seçilenTanrılarDesc.push("**" + tanrı + "**: <@" + tooGame.roles[tanrı] + ">")
                        });
                        if (seçilenTanrılarDesc.length == 0) {
                            // Büyük tanrı yalnız kalmış :(
                            playerMember.send(new Discord.MessageEmbed()
                                .setDescription(`Bu oyun yalnızsın.\nBütün işler sana düştü.`))
                        } else {
                            playerMember.send(new Discord.MessageEmbed()
                                .setDescription(`Bu oyun ${seçilenTanrılarDesc.join(", ")} seçildi.\n\nGeceleri hayatta kalanlarınız benim aracılığımla iletişimde olacak.\n\`-\`(kısa çizgi) işareti ile başlayan her mesajı otomatik olarak ileteceğim.`)
                                .addField("ÖRNEK MESAJ:", "```-merhaba```")
                            )                        }

                    }
                })
        });
    });


    // Oyun yöneticisi varsa panelleri gönder.
    if (tooGame.mode == 0) {
        let ownerID = tooGame.ownerID;
        let ownerMember = guild.members.cache.find(m => m.id == ownerID);
        if (!ownerMember) return console.error(ownerID + " id'li oyun yöneticisi bulunamadı!")

        const panelEmbed = new Discord.MessageEmbed()
            .setAuthor("ROLLER TÜM OYUNCULARA RASTGELE DAĞITILDI")
            .setTitle("**1 DAKİKA SONRA OYUN BAŞLAYACAK!**")
            .setColor(1)
            .addField("✧".repeat(33), "```Oyun başladığı zaman kontrol panelleri gönderilecektir.```")

    }

    // Tüm oyuncuları canlı olarak ayarla
    Object.keys(tooGame.roles).forEach(role => {
        let playerIDs = tooGame.roles[role];

        playerIDs.forEach(playerID => {
            tooGame.alive[playerID] = role;
        });
    });

    let giveExpUsers = tooGame.players;

    if (tooGame.mode == 0)
        giveExpUsers = giveExpUsers.concat(tooGame.ownerID)

    client.addPointToUsers("başlat", giveExpUsers)
        .then(console.log)

    // Oyuna yeni girişleri kapatmak için oyun başlıyor.
    tooGame.isStarting = true;
    // Oyun başlıyor. 1 dakika sonra başlayacak!
    tooGame.timestamps.starting = parseInt(moment().utcOffset(3).format('x'))

    //await console.log(tooGame)
    await db.set(`tooGames_${guild.id}.${tooGame.id}`, tooGame)
};

exports.conf = {
    enabled: true,
    guildOnly: true,
    aliases: [],
    perms: ["TOO Yetkili"]
};
exports.help = {
    name: komutAdı,
    description: ``,
    usage: `${komutAdı}`
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}