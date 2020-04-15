module.exports.run = async (client, message, args) => {
    message.member.voice.channel.join()
}
exports.conf = {
    perms: ["Zeus"],
    enabled: true,
    guildOnly: true,
    aliases: ['j']
}

exports.help = {
    name: 'join',
    description: 'Sesliye girer.',
    usage: 'join'
}