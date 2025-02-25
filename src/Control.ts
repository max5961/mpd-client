import net from "node:net";

type Client = ReturnType<typeof net.createConnection>;
type IntervalID = ReturnType<typeof setInterval>;

export default class Control {
    private client: Client;
    public connection: Connection;
    public polling: Polling;
    public write: Write;

    constructor({ client }: { client: Client }) {
        this.client = client;
        this.connection = new Connection({ client });
        this.polling = new Polling({ client });
        this.write = new Write({ client });
    }

    public getData(buffer: Buffer): string {
        const data = buffer.toString("utf-8");
        console.log(data);
        return data;
    }
}

class Connection {
    private client: Client;
    private connected: boolean;

    constructor({ client }: { client: Client }) {
        this.client = client;
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

class Write {
    private client: Client;

    constructor({ client }: { client: Client }) {
        this.client = client;
    }

    public status(): void {
        this.client.write("status\n");
    }

    public idle(): void {
        this.client.write("idle\n");
    }
}

class Polling {
    private client: Client;
    private polling: IntervalID | null;

    constructor({ client }: { client: Client }) {
        this.client = client;
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
