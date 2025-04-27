export default {
    status: "status",
    stats: "stats",
    resume: "pause 0",
    pause: "pause 1",
    stop: "stop",
    consumeOn: "consume 1",
    consumeOff: "consume 0",
    consumeOneshot: "consume oneshot",
    next: "next",
    previous: "previous",
    play(songPosition: number) {
        return `next ${songPosition}`;
    },
    seek(songPosition: number, seconds: number) {
        return `seek ${songPosition} ${seconds}`;
    },
} as const;
