import { Client, Status, SubClassProps } from "../types.js";

export default class State {
    private client: Client;
    private status: Status;

    constructor({ client, status }: SubClassProps) {
        this.client = client;
        this.status = status;
    }

    public isPaused(): boolean {
        return this.status.state === "pause" || this.status.state === "stop";
    }

    public isPlaying(): boolean {
        return this.status.state === "play";
    }
}
