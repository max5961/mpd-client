import net from "node:net";
import EventEmitter from "node:events";
import JobsQueue from "./subclasses/JobsQueue.js";
import Command from "./subclasses/Command.js";
import { initialStatus } from "./initializers.js";
import { parseStatus } from "./parsers/parseStatus.js";
import { Client, State, Event, Opts } from "./types.js";

export class MPDClient {
    private client!: Client;
    private jobsQueue!: JobsQueue;
    public command: Command;
    private state: State;
    private opts: Required<Opts>;
    private emitter: EventEmitter;

    constructor(opts: Opts = {}) {
        this.state = { connected: false, status: initialStatus, pendingResponse: false };
        this.emitter = new EventEmitter();
        this.command = new Command();

        opts.pollingInterval = opts.pollingInterval ?? 500;
        opts.reconnectInterval = opts.reconnectInterval ?? 500;
        opts.port = opts.port ?? 6600;
        this.opts = opts as Required<Opts>;

        this.connect();
    }

    private connect = (): void => {
        this.client = net.createConnection({ port: this.opts.port });
        this.jobsQueue = new JobsQueue(this.client);
        this.command = new Command(this.jobsQueue);

        this.client.on("connect", () => {
            console.log("MPD - connected");

            this.state.connected = true;
            this.state.pendingResponse = true;
            this.handleData();

            // Start polling once connected
            this.poll();
        });

        const handleConnectionError = () => {
            console.log("MPD - no connection"); // dev

            setTimeout(() => {
                this.connect();
            }, 500);
        };

        this.client.on("error", (e) => {
            if (e.message.includes("ECONNREFUSED")) {
                handleConnectionError();
            }
        });

        this.client.on("close", () => {
            console.log("ayo we closed");
        });

        this.client.on("ready", () => {
            console.log("MPD is ready");
        });

        this.client.on("connectionAttemptFailed", handleConnectionError);
    };

    private handleData = (): void => {
        if (!this.state.connected) return;

        this.client.on("data", (data: Buffer) => {
            const response = data.toString("utf-8");
            this.jobsQueue.performNext(response);
        });
    };

    private poll = async (): Promise<void> => {
        const ID = setInterval(async () => {
            if (!this.state.connected) {
                clearInterval(ID);
                return;
            }

            // Handle status polling
            const statusStr = await this.command.write("status");
            const status = parseStatus(statusStr);

            if (status) {
                this.emitter.emit("status", status);
            }

            /*
             * Handle other polling
             * ...
             * */
        }, this.opts.pollingInterval);
    };

    public on = <T extends keyof Event>(
        event: T,
        cb: (data: Event[T]) => unknown,
    ): void => {
        this.emitter.on(event, cb);
    };
}
