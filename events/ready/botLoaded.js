const moment = require('moment');
moment.locale("tr");

module.exports = async (client) => {
    console.log(`[${moment().utcOffset(3).format('DD-MM-YYYY HH:mm:ss')}] Aktif, ${client.commands.size} komut yüklendi!`);
    console.log(`[${moment().utcOffset(3).format('DD-MM-YYYY HH:mm:ss')}] ${client.user.tag} giriş yaptı.`);
}