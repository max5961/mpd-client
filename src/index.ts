import net from "node:net";
import Control from "./Control.js";

// MPD runs a TCP server on 6600
// see - https://mpd.readthedocs.io/en/latest/client.html
const client = net.createConnection({
    port: 6600,
});

const control = new Control({ client });

client.on("data", (buffer) => {
    const data = control.getData(buffer);

    // Track connection
    control.connection.checkConnection(data);

    // Get status from 'changed' responses
    if (data.startsWith("changed")) {
        control.write.status();
        return;
    }

    // OK responses
    if (data.includes("OK")) {
        if (data.includes("state: play")) {
            return control.polling.start();
        }

        if (data.includes("state: pause") || data.includes("state: stop")) {
            return control.polling.stop();
        }

        control.write.idle();
        console.log("Idling...");

        return;
    }
});
