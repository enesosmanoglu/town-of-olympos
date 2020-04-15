module.exports = async (info) => {
    //console.log("debug:",info)
    if (info.includes("Session Limit Information")) console.log("\n \nBot token günlük kullanım hakkı: " + info.split("\n")[2].replace("Remaining:", "").trim() + "/" + info.split("\n")[1].replace("Total:", "").trim() + "\n \n")
}