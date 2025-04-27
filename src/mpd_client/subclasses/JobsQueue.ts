import { Client, Job } from "../types.js";

export default class JobsQueue {
    private q: Job[];
    private client: Client;
    private pendingJob: Job | undefined;

    constructor(client: Client) {
        this.q = [];
        this.client = client;
        this.pendingJob = undefined;
    }

    public push(job: Job): void {
        this.q.push(job);

        if (!this.pendingJob) {
            this.performNext();
        }
    }

    public performNext(response?: string): void {
        const nextJob = this.q.shift();

        if (nextJob) {
            // + newline ??? or will something else handle that
            this.client.write(nextJob.msg + "\n");
        }

        this.pendingJob?.resolve(response ?? "");
        this.pendingJob = nextJob;
    }
}
