import net from "node:net";
import { Client, Status } from "./types.js";
import EventEmitter from "node:events";
import initialStatus from "./initialStatus.js";

type State = {
    connected: boolean;
    status: Status;
    pendingResponse: boolean;
};

type Opts = {
    pollingInterval?: number;
    reconnectInterval?: number;
    port?: number;
};

type Event = {
    connected: boolean;
    disconnected: boolean;
    status: Status;
    error: Error;
};

type Job = {
    msg: string;
    resolve: (data: string) => void;
};

export class MPDClient {
    private state: State;
    private client!: Client;
    private opts: Required<Opts>;
    private jobs: Job[];
    private emitter: EventEmitter;
    private currentJob: undefined | Job;

    constructor(opts: Opts = {}) {
        this.state = { connected: false, status: initialStatus, pendingResponse: false };
        this.jobs = [];
        this.emitter = new EventEmitter();
        this.currentJob = undefined;

        opts.pollingInterval = opts.pollingInterval ?? 500;
        opts.reconnectInterval = opts.reconnectInterval ?? 500;
        opts.port = opts.port ?? 6600;
        this.opts = opts as Required<Opts>;

        this.connect();
    }

    private connect = (): void => {
        this.client = net.createConnection({ port: this.opts.port });

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

        this.client.on("connectionAttemptFailed", handleConnectionError);
    };

    // TODO: Need to be more aware of getting a response before
    // sending idle\n and noidle\n
    // idle\n should be sent at the end of a stack
    // noidle\n should be sent at the beginning of a stack
    private handleData = (): void => {
        if (!this.state.connected) return;

        this.client.on("ready", () => {
            console.log("MPD is ready");
        });

        this.client.on("data", (data: Buffer) => {
            // console.log("data: ", data.toString("utf-8"));

            const nextJob = this.jobs.shift();
            this.state.pendingResponse = !!nextJob;

            if (nextJob) {
                this.client.write(nextJob.msg);
            }

            if (this.currentJob) {
                const response = data.toString("utf-8");
                this.currentJob.resolve(response);
            }

            this.currentJob = nextJob;
        });
    };

    public command = (msg: string): Promise<string> => {
        return new Promise<string>((resolve) => {
            this.jobs.push({ msg, resolve });

            if (!this.state.pendingResponse) {
                this.currentJob = this.jobs.shift();
                this.client.write(this.currentJob!.msg + "\n");
                this.state.pendingResponse = false;
            }
        });
    };

    private poll = async (): Promise<void> => {
        const ID = setInterval(async () => {
            if (!this.state.connected) {
                clearInterval(ID);
                return;
            }

            // Handle status polling
            const statusStr = await this.command("status");
            const status = this.parseStatus(statusStr);

            if (status) {
                this.emitter.emit("status", status);
            }

            /*
             * Handle other polling
             * ...
             * */
        }, this.opts.pollingInterval);
    };

    private parseStatus = (msg: string): Status | undefined => {
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

        const isStatusInterface = () => {
            const possibleKeys = new Set(Object.keys(initialStatus));

            for (const key in status) {
                if (!possibleKeys.has(key)) return false;
            }

            return true;
        };

        return (isStatusInterface() ? status : undefined) as Status | undefined;
    };

    /*
     * Closes the connection, but moreover does cleanup work like removing the
     * public event logic and internal polling event logic
     * */
    public closeConnection = (): void => {
        //
    };

    /*
     * Publically set event handlers
     * */
    public on = <T extends keyof Event>(
        event: T,
        cb: (data: Event[T]) => unknown,
    ): void => {
        this.emitter.on(event, cb);
    };
}
