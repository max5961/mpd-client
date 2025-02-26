import { Client, Data, SubClassProps } from "../types.js";

export default class Connection {
    private client: Client;
    private data: Data;
    private connected: boolean;

    constructor({ client, data }: SubClassProps) {
        this.client = client;
        this.data = data;
        this.connected = false;
    }

    public setConnected(connected: boolean): void {
        this.connected = connected;
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public checkConnection(data: string): void {
        if (this.connected) return;

        if (data.includes("OK MPD")) {
            this.setConnected(true);
        } else {
            console.log("Error connecting to MPD client");
            this.client.end();
        }
    }

    public endConnection(): void {
        this.client.end();
    }
}
