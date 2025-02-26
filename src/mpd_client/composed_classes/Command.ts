import { Client, Status, SubClassProps } from "../types.js";

export default class Command {
    private client: Client;
    private status: Status;

    constructor({ client, status }: SubClassProps) {
        this.client = client;
        this.status = status;
    }

    // MPD will respond with the status message in next response
    public requestStatus(): void {
        this.client.write("status\n");
    }

    // Keep stream open to listen for MPD messages
    public idle(): void {
        this.client.write("idle\n");
    }
}
