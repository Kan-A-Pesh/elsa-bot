import "dotenv/config";
import Bot from "./bot/bot";
import {
    checkTimer,
    incrementWaitMessageCounter,
    resetCounters,
    setOnSuccess,
    startInterval,
    tryParseNumber,
} from "./bot/timer";
import { generateImage, generateMessage } from "./prompt/think";
import emotions from "./prompt/emotions";
import { wait } from "./utils/wait";

const bot = new Bot();

const onMessage = () => {
    incrementWaitMessageCounter();
    checkTimer(false);
};

let thinkQueue: NodeJS.Timeout | null = null;

const sendMessage = async () => {
    if (thinkQueue) {
        clearTimeout(thinkQueue);
    }

    const queueWaitTime = tryParseNumber(process.env.QUEUE_WAIT_TIME);
    if (!queueWaitTime) throw Error("Invalid QUEUE_WAIT_TIME");

    thinkQueue = setTimeout(thinkMessage, queueWaitTime * 1000);
};

const thinkMessage = async () => {
    resetCounters();

    const lastMessages = await bot.getLastMessages();
    let parsedMessage = await generateMessage(lastMessages);

    if (parsedMessage.parsed.toUpperCase().trim().startsWith("DO_NOT_RESPOND"))
        return console.debug("FOUND DO_NOT_RESPOND");

    await bot.sendTyping();

    for (const action of parsedMessage.actions) {
        switch (action.name) {
            case "PICTURE":
                console.debug("FEATURE", "Generating picture", action.value);
                parsedMessage.parsed += " " + generateImage(action.value);
                break;

            case "EMOTION":
                const [emotion, value] = action.value.split(", ");
                emotions[emotion] = value;
                console.debug("FEATURE", "Changed emotion", emotion, "to", value);
                break;
        }
    }

    const typingWaitTime = tryParseNumber(process.env.TYPING_WAIT_TIME);
    if (!typingWaitTime) throw Error("Invalid TYPING_WAIT_TIME");

    await wait(typingWaitTime * 1000);

    if (parsedMessage.parsed.trim().length === 0) {
        return console.error("NO RESPONSE");
    }

    lastMessages.forEach(
        (message) =>
            (parsedMessage.parsed = parsedMessage.parsed.replace(
                `@${message.author.username}`,
                `<@${message.author.id}>`,
            )),
    );

    await bot.sendMessage(parsedMessage.parsed);
};

setOnSuccess(sendMessage);
bot.onMessageReceived(onMessage);
bot.onReady(startInterval);
