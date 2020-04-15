const fs = require('fs');
const reqEvent = (event) => require(`../events/${event}`);

module.exports = client => {

  fs.readdir("/app/events/", "utf8", (err, files) => {
    files.forEach(file => {
      if (file.endsWith(".js")) {
        if (!fs.lstatSync("/app/events/" + file).isDirectory()) {
          if (["ready.js", "error.js"].some(i => i == file)) {
            client.on(file.replace(".js", ""), () => reqEvent(file)(client, arguments));
          } else {
            client.on(file.replace(".js", ""), reqEvent(file));
          }
        }
      } else {
        if (fs.lstatSync("/app/events/" + file).isDirectory()) {
          fs.readdir("/app/events/" + file, "utf8", (err, files2) => {
            if (["ready", "error"].some(i => i == file)) {
              files2.forEach(fi => {
                console.log(fi)
                client.on(file.replace(".js", ""), () => reqEvent(file + "/" + fi)(client, arguments));
              })
            } else {
              files2.forEach(fi => {
                client.on(file.replace(".js", ""), reqEvent(file + "/" + fi));
              })
            }
          })
        }
      }


    })
  })
};
