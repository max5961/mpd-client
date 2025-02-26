import net from "node:net";
import { Client, Status } from "./types.js";
import Command from "./composed_classes/Command.js";
import Connection from "./composed_classes/Connection.js";
import Polling from "./composed_classes/Polling.js";
import State from "./composed_classes/State.js";
import initialStatus from "./initialStatus.js";

export default class MPDClient {
    private client: Client;
    private status: Status;

    public connection: Connection;
    public polling: Polling;
    public command: Command;
    public state: State;

    // MPD runs a TCP server on 6600
    // see - https://mpd.readthedocs.io/en/latest/client.html
    constructor() {
        this.client = net.createConnection({ port: 6600 });
        this.status = initialStatus;
        this.connection = new Connection({ client: this.client, status: this.status });
        this.polling = new Polling({ client: this.client, status: this.status });
        this.command = new Command({ client: this.client, status: this.status });
        this.state = new State({ client: this.client, status: this.status });
    }

    private isChanged(msg: string): boolean {
        return msg.startsWith("changed");
    }

    private responseOkay(msg: string): boolean {
        return msg.includes("OK");
    }

    private msgToStatusObj(msg: string): void {
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

        const status = Object.fromEntries(pairs);

        if (this.isStatusInterface(status)) {
            this.status = status as Status;
        }
    }

    private isStatusInterface(obj: Object): boolean {
        const possibleKeys = new Set(Object.keys(initialStatus));

        for (const key in obj) {
            if (!possibleKeys.has(key)) return false;
        }

        return true;
    }

    public listen(handler: Handler): void {
        let calls = 0;

        this.client.on("data", (buffer: Buffer) => {
            if (!calls++) {
                return this.command.requestStatus();
            }

            const msg = buffer.toString("utf-8");
            this.msgToStatusObj(msg);

            // MPD changed, get the status, but don't pass off to handler
            // until status is sent
            if (this.isChanged(msg)) {
                return this.responseOkay(msg) && this.command.requestStatus();
            }

            this.command.idle();
            handler(this.status);
        });
    }
}

type Handler = (status: Status) => void;
