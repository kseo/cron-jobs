import CodeChain from "./src/codeChain";
import { runWaitUntilTimelock } from "./src/scenario";
import { SlackNotification } from "./src/slackNotification";
import { delay } from "./src/util";

async function main() {
    const codeChain = new CodeChain();
    while (true) {
        try {
            await runWaitUntilTimelock(codeChain);
        } catch (err) {
            console.error(err);
            SlackNotification.instance.sendError(err);
        }

        await delay(3 * 1000);
    }
}

main()
    .then(() => console.log("finish"))
    .catch(err => console.error(err));
