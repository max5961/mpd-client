import { Job } from "../types.js";
import JobsQueue from "./JobsQueue.js";

export default class Command {
    // Need a dummy Command class until the real Command class is initialized
    // after connection
    private jobsQueue: JobsQueue | Job[];

    constructor(jobsQueue: JobsQueue | Job[] = []) {
        this.jobsQueue = jobsQueue;
    }

    public write = (msg: string): Promise<string> => {
        return new Promise<string>((resolve) => {
            this.jobsQueue.push({ msg, resolve });
        });
    };

    public resume = (): Promise<string> => {
        return this.write("pause 0");
    };

    public pause = (): Promise<string> => {
        return this.write("pause 1");
    };
}
