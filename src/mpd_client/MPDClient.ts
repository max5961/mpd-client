import net from "node:net";
import { Client, Data, Status } from "./types.js";
import Command from "./composed_classes/Command.js";
import Connection from "./composed_classes/Connection.js";
import State from "./composed_classes/State.js";
import initialStatus from "./initialStatus.js";

export default class MPDClient {
    private client: Client;
    private data: Data;

    public connection: Connection;
    public command: Command;
    public state: State;

    // MPD runs a TCP server on 6600
    // see - https://mpd.readthedocs.io/en/latest/client.html
    constructor() {
        this.client = net.createConnection({ port: 6600 });
        this.data = { status: initialStatus };
        this.connection = new Connection({ client: this.client, data: this.data });
        this.command = new Command({ client: this.client, data: this.data });
        this.state = new State({ client: this.client, data: this.data });
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
        opts = opts ?? {};
        opts.polling = opts.polling ?? true;
        opts.pollingInterval = opts.pollingInterval ?? 500;

        let calls = 0;
        let timeout: NodeJS.Timeout | undefined;

        this.client.on("data", (buffer: Buffer) => {
            // Request status update on initial run
            if (!calls++) {
                return this.command.requestStatus();
            }

            // Update status object based on message MPD sent
            const msg = buffer.toString("utf-8");
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
    }
}

type Handler = (status: Status) => void;
