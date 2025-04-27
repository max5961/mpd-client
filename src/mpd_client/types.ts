import net from "node:net";

export type Client = ReturnType<typeof net.createConnection>;

export type State = {
    connected: boolean;
    status: Status;
    pendingResponse: boolean;
};

export type Opts = {
    pollingInterval?: number;
    reconnectInterval?: number;
    port?: number;
};

export type Event = {
    status: Status;
    connected: boolean;
    disconnected: boolean;
    error: Error;
};

export type Job = {
    msg: string;
    resolve: (data: string) => void;
};

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
