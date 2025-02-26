import { Client, Status, SubClassProps } from "../types.js";

export default class Connection {
    private client: Client;
    private status: Status;
    private connected: boolean;

    constructor({ client, status }: SubClassProps) {
        this.client = client;
        this.status = status;
        this.connected = false;
    }

    public setConnected(connected: boolean): void {
        this.connected = connected;
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public checkConnection(status: string): void {
        if (this.connected) return;

        if (status.includes("OK MPD")) {
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
