import { Status } from "../types.js";
import { initialStatus } from "../initializers.js";

export function parseStatus(response: string): Status | undefined {
    const pairs = response
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
}
