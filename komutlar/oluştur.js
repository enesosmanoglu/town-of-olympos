//too Yetkili kişisinin bulunduğu oda oyun odası seçilerek 'too-odaları' text odasına 'x' ses odasında yeni oyun oluşturulmuştur
//tarzı bi bilgi mesajı atılır ve oyun başlatma komutu gelene kadar odaya katılan kişilerin isimleri bu bilgi mesajına editlenir. (max 15 kişi)
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

    let tooTextCh = message.channel.name.includes("town-of-olympos-") ? message.channel : guild.channels.cache.find(g => g.name.includes("town-of-olympos-"))
    if (!tooTextCh) return message.reply("Town of Olympos Yazı kanalı bulunamadı. Lütfen içerisinde 'town-of-olympos-' geçen bir metin kanalı açınız.")

    // SUNUCUDA DAHA ÖNCE OYUN OLUŞTURULMUŞ MU
    if (db.has(`tooGames_${guild.id}`)) {
        // KODU YAZANIN SESLİ KANALINDA BAŞLAMIŞ VE BİTMEMİŞ BİR OYUN VAR MI?
        let aktifOyun = db.get(`tooGames_${guild.id}`).find(g => g.gameRoom.id == oyunOdası.id && g.isStarted && !g.isFinished);
        if (aktifOyun)
            return message.reply("Bulunduğunuz sesli odada aktif bir oyun bulunuyor. Lütfen başka bir odaya geçiniz.")

        // SUNUCUDA OLUŞTURULMUŞ VE BAŞLAMAMIŞ BİR OYUN VAR MI?
        let bekleyenOyun = db.get(`tooGames_${guild.id}`).find(g => !g.isStarting && !g.isStarted && !g.isFinished);
        if (bekleyenOyun) {
            let msgURL = "https://discordapp.com/channels/" + guild.id + "/" + bekleyenOyun.message.channelID + "/" + bekleyenOyun.message.id
            let msgRoom = guild.channels.cache.find(g => g.id == bekleyenOyun.message.channelID)
            let gameRoom = guild.channels.cache.find(g => g.id == bekleyenOyun.gameRoom.id)
            gameRoom.createInvite()
                .then(invite => {
                    message.reply(new Discord.MessageEmbed() //  odada başlamış ve bitmemiş oyun var
                        .setTitle("Halihazırda oluşturulmuş ve başlamamış bir oyun bulunuyor!")
                        .setDescription("Lütfen aktif oyuna katılınız veya başlamasını bekleyiniz.\n\nAktif oyuna katılmak için aşağıdaki ses ve metin kanalını kullanabilirsiniz:")

                        .addField("Ses Kanalı", "**[" + gameRoom.name + "](" + invite.url + ")**", true)
                        .addField("Metin Kanalı", "**[#" + msgRoom.name + "](" + msgURL + ")**", true)
                    );
                })
                .catch(console.error);
            return;
        }
    }

    let başlamışOyunlar = db.get(`tooGames_${guild.id}`).filter(tooGame => tooGame && tooGame.isStarted && !tooGame.isFinished)
    if (başlamışOyunlar.some(tooGame => tooGame.ownerID == member.user.id || tooGame.alive.hasOwnProperty(member.user.id)))
        return message.reply("Zaten aktif bir oyunda bulunuyorsun. Lütfen önce o oyunu tamamla. ")

    // OYUN ID'Sİ ÖNCEDEN OYNANMIŞ OYUN VARSA ONUN ID'SİNİN BİR FAZLASI ALINIR. HİÇ OYUN YOKSA 0 BAŞLATILIR.
    let gameID = db.has(`tooGames_${guild.id}`) ? db.get(`tooGames_${guild.id}`).length : 0;

    let tooEmbed = new Discord.MessageEmbed()
        .setTitle(`Town of Olympos - \`#${gameID}\``)
        .setDescription(`Yeni bir oyun oluşturuldu.`)
        .setColor("000")

    oyunOdası.createInvite()
        .then(async invite => {
            tooEmbed.description += `\n\nKatılmak için tıklayın: **[${oyunOdası.name}](${invite.url})**`

            let gameMode = args[0] ? parseInt(args[0]) : 0;
            let players = []
            let playersList = [];

            if (gameMode == 0) {
                tooEmbed.addField(`Oyun Yöneticisi`, `<@${message.author.id}>`)
            }

            tooEmbed.addField(`Oyuncular`, `**Bekleniyor...**`)

            oyunOdası.members.forEach(member => {
                if (gameMode == 0 && member.user.id == message.author.id) return;// Oyun modu 0'sa kurucuyu sayma
                playersList.push("<@" + member.user.id + ">")
                players.push(member.user.id)
            });
            if (players.length < ayarlar.oyunAyarları.minKişi)
                playersList.push("**" + ((parseInt(ayarlar.oyunAyarları.oyuncuBeklemeSüresi / 60) == 0) ? (ayarlar.oyunAyarları.oyuncuBeklemeSüresi + " saniye") : (parseFloat(ayarlar.oyunAyarları.oyuncuBeklemeSüresi / 60) + " dakika")) + " içinde birisi girmezse oyun iptal edilecek!**")
            else if (players.length < ayarlar.oyunAyarları.maxKişi)
                playersList.push("**Oyuncular bekleniyor...**")

            tooEmbed.fields[tooEmbed.fields.length - 1].value = await playersList.join("\n");

            await tooTextCh.send(tooEmbed)
                .then(async msg => {

                    let msgURL = "https://discordapp.com/channels/" + guild.id + "/" + msg.channel.id + "/" + msg.id
                    let bilgiEmbed = new Discord.MessageEmbed()
                        .setAuthor(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
                        .setDescription(`**[#${tooTextCh.name}](${msgURL})** kanalında yeni bir **Town of Olympos** oyunu oluşturuldu.`)
                        .setTimestamp()

                    // GENEL CHAT'E BİLGİ MESAJI AT
                    let genelChat = guild.channels.cache.find(c => c.name == "genel-chat");
                    let tooRole = guild.roles.cache.find(r => r.name == "Town of Olympos");
                    await genelChat.send(tooRole ? tooRole : null, { embed: bilgiEmbed })

                    if (message.channel.id != tooTextCh.id && message.channel.id != genelChat.id) {
                        // EĞER OLUŞTUR KOMUTU BAŞKA BİR ODADA YAZILDIYSA O ODAYA DA BİLGİ MESAJI AT
                        await message.channel.send(bilgiEmbed)
                    }

                    let tooGame = ayarlar.createTooGame()
                    tooGame.id = gameID
                    tooGame.mode = gameMode
                    tooGame.ownerID = message.author.id
                    tooGame.gameRoom = oyunOdası
                    tooGame.message = msg
                    tooGame.embed = tooEmbed
                    tooGame.guild = guild
                    tooGame.players = players


                    //await db.delete(`tooGames_${guild.id}`) // debug modu || daha sonra bu satırı kapat

                    await db.push(`tooGames_${guild.id}`, tooGame)
                    //await message.reply(JSON.stringify(db.get(`tooGames_${guild.id}.${tooGame.id}`)))
                })



        })









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