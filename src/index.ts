import MPDClient from "./mpd_client/MPDClient.js";
import { Status } from "./mpd_client/types.js";

const mpd = new MPDClient();

// Depending on how things go, possibly create context specific layers?
// mpd.state.isPlaying((status, next) => {
//     //
// })
//
// mpd.state.isPaused((status, next) => {
//     //
// })

mpd.listen((status: Status) => {
    console.log("status: ", status);
});
