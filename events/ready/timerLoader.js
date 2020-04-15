const moment = require('moment');
moment.locale("tr");
const path = require('path');
const fs = require('fs');

module.exports = async (client) => {
    // require("/app/timers/oyunBaşlatıcı.js")(client);
    // require("/app/timers/geceGündüz.js")(client);
    // require("/app/timers/oyunKapatıcı.js")(client);
    fs.readdir(path.join("/app", "timers"), "utf8", (err, files) => {
        files.forEach(file => {
            if (!fs.lstatSync(path.join("/app", "timers", file)).isDirectory()) {
                require(path.join("/app", "timers", file))(client);
                console.log("Timer loaded: " + path.join("/app", "timers", file))
            } else {
                fs.readdir(path.join("/app", "timers", file), "utf8", (err, files2) => {
                    files2.forEach(fi => {
                        require(path.join("/app", "timers", file, fi))(client);
                        console.log("Timer loaded: " + path.join("/app", "timers", file))
                    })
                })
            }
        })
    })
}