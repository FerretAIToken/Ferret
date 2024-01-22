import client from ".";
import RateLimiter from "../helpers/rateLimiter";
import config from "../helpers/getConfig";
import axios from "axios";

const limiter = new RateLimiter("ratelimit.sql");

client.on("message", async (msg) => {
    try {
        const chatID = msg.chat.id;

        if (!msg.photo) {
            const message: string[] | undefined = msg.text?.split(" ");
            if (message && message[0] === "/start") {
                return client.sendMessage(chatID, "welcome! use /ferret <prompt> with image attachment to try me! <3")
            }
            if (message && message[0] === "/ferret") {
                if (!message[1]) {
                    return client.sendMessage(chatID, "Please provide a prompt. e.g., /ferret <your prompt>");
                }
            }
            // fallback, user is wrong anyways
            //return client.sendMessage(chatID, "Please attach an image to query!");
        } else {
            const message: string[] | undefined = msg.caption?.split(" ");
            if (message && message[0] === "/ferret") {
                if (!message[1]) {
                    return client.sendMessage(chatID, "Please provide a prompt. e.g., /ferret <your prompt>");
                }

                const image: string = await client.getFileLink(msg.photo[msg.photo?.length - 1].file_id);

                // Check rate limit before processing
                const allowed = await limiter.acquire(chatID.toString(), config.rateLimit.x, config.rateLimit.per);
                //console.log(allowed)

                if (allowed) {
                    continueProcess(chatID, image, message);
                } else {
                    declineProcess(chatID);
                }
            }
        }
    } catch (e) {
        try {
            client.sendMessage(msg.chat.id, "sorry an unexpected error occured executing command, please try again.");
        } catch { };
        console.log(e);
    };
});

async function continueProcess(chatID: number, image: string, message: string[]) {
    try {
        console.log(message.slice(1).join(" "))
        const resp = (await axios.get(`<place your server url here>/?link=${encodeURIComponent(image)}&text=${message.slice(1).join(" ")}`)).data.response;
        console.log(resp);
        await client.sendMessage(chatID, resp);
    } catch (e) {
        await client.sendMessage(chatID, 'Error, please try again. Perhaps your prompt is too big / not related. maybe check terminal for error?');
       throw new Error("you have to run the ferret api in a different gpu instance and use the fastapi to create a the api where you accept text and image url variables, please follow docs in ../ferret for the same")
    }
}

async function declineProcess(chatID: number) {
    const waitTime = await limiter.getWaitTime(chatID.toString());

    const message = `⏰ You have been rate-limited. Please wait ${waitTime} seconds before trying again.\nSorry for the inconvenience; this is to prevent spam.`;

    await client.sendMessage(chatID, message);
}

client.on("polling_error", (err) => console.log(err));