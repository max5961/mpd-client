import { Client, Status, IntervalID, SubClassProps } from "../types.js";

export default class Polling {
    private client: Client;
    private status: Status;
    private polling: IntervalID | null;

    constructor({ client, status }: SubClassProps) {
        this.client = client;
        this.status = status;
        this.polling = null;
    }

    public start(): void {
        if (this.polling !== null) return;

        this.polling = setInterval(() => {
            this.client.write("status\n", "utf-8");
        }, 500);
    }

    public stop(): void {
        if (this.polling === null) return;
        clearInterval(this.polling);
        this.polling = null;
    }
}
