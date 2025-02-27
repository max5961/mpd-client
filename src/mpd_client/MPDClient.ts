import net from "node:net";
import { Client, Data, Status } from "./types.js";
import Command from "./composed_classes/Command.js";
import Connection from "./composed_classes/Connection.js";
import State from "./composed_classes/State.js";
import initialStatus from "./initialStatus.js";

export default class MPDClient {
    private client!: Client;
    private data!: Data;
    private handler!: Handler | null;

    public connection!: Connection;
    public command!: Command;
    public state!: State;

    constructor() {
        // this.listen method publicly defines a handler and it is cached in case
        // connection is initially refused and gained later.  This would be the case
        // if you started the client while mpd was not running, and then started
        // mpd later
        this.handler = null;
        this.connect();
    }

    // MPD runs a TCP server on 6600
    // see - https://mpd.readthedocs.io/en/latest/client.html
    private async connect(refusedConnections: number = 0): Promise<boolean | void> {
        this.client = net.createConnection({ port: 6600 });

        this.client.on("connect", () => {
            this.client = net.createConnection({ port: 6600 });
            this.data = { status: initialStatus };
            this.connection = new Connection({ client: this.client, data: this.data });
            this.command = new Command({ client: this.client, data: this.data });
            this.state = new State({ client: this.client, data: this.data });

            this.handler && this.listen(this.handler!);

            return true;
        });

        this.client.on("error", () => {
            // Attempt connection every 500ms until connection gained.
            setTimeout(() => {
                this.handleRefusedConnection(++refusedConnections);
            }, 500);

            return false;
        });
    }

    private isChanged(msg: string): boolean {
        return msg.startsWith("changed");
    }

    private responseOkay(msg: string): boolean {
        return msg.includes("OK");
    }

    private updateStatus(msg: string): void {
        const pairs = msg
            .split("\n")
            .map((line) => {
                const pair = line.split(":").map((p) => p.trimStart().trimEnd()) as [
                    string,
                    string | number,
                ];

                const num = Number(pair[1]);

                if (!Number.isNaN(num)) {
                    pair[1] = num;
                }

                return pair;
            })

            // There will be some undefined values due to formatting of mpd's message
            .filter((pair) => pair[1] !== undefined);

        // TODO: Add a key for the status of the message (OK)

        const status = Object.fromEntries(pairs);

        if (this.isStatusInterface(status)) {
            this.data.status = status as Status;
        }
    }

    private isStatusInterface(obj: Object): boolean {
        const possibleKeys = new Set(Object.keys(initialStatus));

        for (const key in obj) {
            if (!possibleKeys.has(key)) return false;
        }

        return true;
    }

    public listen(
        handler: Handler,
        opts?: { polling?: boolean; pollingInterval?: number },
    ): void {
        this.handler = handler;

        opts = opts ?? {};
        opts.polling = opts.polling ?? true;
        opts.pollingInterval = opts.pollingInterval ?? 500;

        let calls = 0;
        let timeout: NodeJS.Timeout | undefined;
        let refusedConnection = 0;

        try {
            this.client.on("data", (buffer: Buffer) => {
                const msg = buffer.toString("utf-8");

                // Request status update on initial run
                if (!calls++) {
                    if (!msg.includes("OK MPD")) {
                        throw new Error("Port 6600 already in use");
                    }

                    refusedConnection++;
                    return this.command.requestStatus();
                }

                // Update status object based on message MPD sent
                this.updateStatus(msg);

                // MPD changed, but has only notified us of the change.  Request the
                // status and don't run handler until the status is received.
                if (this.isChanged(msg)) {
                    return this.responseOkay(msg) && this.command.requestStatus();
                }

                // Run callback with the new status
                handler(this.data.status);

                // Request the status on the given interval, or idle and wait for messages
                if (opts.polling && this.state.isPlaying()) {
                    timeout = setTimeout(() => {
                        this.command.requestStatus();
                    }, opts.pollingInterval);
                } else {
                    this.command.idle();
                    clearTimeout(timeout);
                }
            });
        } catch (error: any) {
            if (error.message === "Port 6600 already in use") {
                console.log(error.message);
            } else {
                throw error;
            }
        }
    }

    private async handleRefusedConnection(refusedConnections: number): Promise<void> {
        const connection = await this.connect(++refusedConnections);

        if (connection) {
            this.handler && this.listen(this.handler);
        } else {
            if (refusedConnections === 1) {
                // TODO: Event for refused connection
            }

            // dev
            console.log("refused to connect");
        }
    }
}

type Handler = (status: Status) => void;
