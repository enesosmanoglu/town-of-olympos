module.exports.run = async (client, message, args) => {
    message.member.voice.channel.leave()
}
exports.conf = {
    perms: ["Zeus"],
    enabled: true,
    guildOnly: true,
    aliases: ['l']
}

exports.help = {
    name: 'leave',
    description: 'Sesliden çıkar.',
    usage: 'leave'
}