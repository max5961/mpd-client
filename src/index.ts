import { MPDClient } from "./mpd_client/MPDClient.js";

const mpd = new MPDClient();

mpd.on("status", (status) => {
    console.log(status);
});

// Would be better to use like this:
// const mpd = new MPDClient({
//     pollingInterval: 250,
//     reconnectInterval: 500,
//     port: 6600,
//     host: "localhost"
//     // Make constructor extend the configuration object for net.createConnection
// });
// mpd
//     .on("statuschange", (status: Status) => { /* ... */ })
//     .on("connected", handleConnected)
//     .on("disconnected", handleDisconnected)
//     .on("error", handleError);
//
// Frontend usage
// All command methods must push to a queue
// mpd.command.pause() // for commands builtin to this API
// mpd.command.write("foobar") // for commands that this API might end up missing
