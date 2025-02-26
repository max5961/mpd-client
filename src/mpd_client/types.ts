import net from "node:net";

export type Client = ReturnType<typeof net.createConnection>;
export type SubClassProps = { client: Client; status: Status };
export type IntervalID = ReturnType<typeof setInterval>;

export type Status = {
    repeat: number;
    random: number;
    single: number;
    consume: number;
    partition: string;
    playlist: number;
    playlistlength: number;
    mixrampdb: number;
    state: "play" | "pause" | "stop";
    song: number;
    songid: number;
    time: number;
    elapsed: number;
    bitrate: number;
    duration: number;
    audio: number;
    nextsong: number;
    nextsongid: number;
};
