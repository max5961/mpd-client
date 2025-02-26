import { Client, Data, SubClassProps } from "../types.js";

export default class State {
    private client: Client;
    private data: Data;

    constructor({ client, data }: SubClassProps) {
        this.client = client;
        this.data = data;
    }

    public isPaused(): boolean {
        return this.data.status.state === "pause" || this.data.status.state === "stop";
    }

    public isPlaying(): boolean {
        return this.data.status.state === "play";
    }
}
