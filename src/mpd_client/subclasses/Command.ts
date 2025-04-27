import { Job } from "../types.js";
import JobsQueue from "./JobsQueue.js";
import Protocol from "../protocol/Protocol.js";
import EventEmitter from "node:events";
import { parseStatus } from "../parsers/parseStatus.js";

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
        return this.write(Protocol.resume);
    };

    public pause = (): Promise<string> => {
        return this.write(Protocol.pause);
    };

    public play = (songPosition: number): Promise<string> => {
        return this.write(Protocol.play(songPosition));
    };
}
