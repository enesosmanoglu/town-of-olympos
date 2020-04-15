module.exports = async (info) => {
    //console.log("debug:",info)
    if (info.toLowerCase().includes("heartbeat") && info.toLowerCase().includes("latency")) console.log("\n \n[PING] " + info.match(/(\d+)/g).toString().split(",")[1] + "ms\n \n")
}