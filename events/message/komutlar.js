const Discord = require("discord.js");
const ayarlar = require("/app/ayarlar");
const db = require('quick.db');
const moment = require("moment");
const fs = require("fs");


module.exports = async message => {
    let client = message.client;

    if (message.author.bot) return; // BOT SPAM KORUMA
    if (!message.content.startsWith(ayarlar.prefix)) return; // KOMUT DEĞİLSE DEVAMI GELMESİN

    let command = message.content.split(" ")[0].slice(ayarlar.prefix.length);
    let args = message.content.split(" ").slice(1);
    let cmd;
    if (client.commands.has(command)) {
        cmd = client.commands.get(command);
    } else if (client.aliases.has(command)) {
        cmd = client.commands.get(client.aliases.get(command));
    }
    if (cmd) {
        if (!message.guild) {
            if (cmd.conf.guildOnly) {
                const ozelmesajuyari = new Discord.MessageEmbed()
                    .setColor(484848)
                    .setTimestamp()
                    .setAuthor(message.author.username, message.author.avatarURL)
                    .setTitle("Bu komut özel mesajlarda kullanılamaz.");
                return message.author.send(ozelmesajuyari);
            } else {
                cmd.run(client, message, args);
            }
        } else {
            if (!cmd.conf.perms)
                cmd.conf.perms = ["@everyone"]
            yetkiliKontrol(message, cmd, args, cmd.conf.perms);
        }
    }
};

function yetkiliKontrol(message, cmd, args, yetkiliRoller) {
    let client = message.client;
    let yetkiliMi = false;

    yetkiliRoller.forEach(rol => {
        if (message.member.roles.cache.find(r => r.name == rol)) yetkiliMi = true;
    });

    if (!yetkiliMi)
        return message.channel.send(
            new Discord.MessageEmbed()
                .setDescription(`Yetkin yok maalesef (ಥ﹏ಥ)'`)
                .setColor(484848)
                .setTimestamp()
        )
            .then(msg => msg.delete({ timeout: 10000 }));

    cmd.run(client, message, args);
}
