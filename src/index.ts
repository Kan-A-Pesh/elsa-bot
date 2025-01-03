import "dotenv/config";
import Bot from "./bot/bot";
import { checkTimer, incrementWaitMessageCounter, resetCounters, setOnSuccess, startInterval } from "./bot/timer";
import { generateMessage } from "./prompt/think";

const bot = new Bot();

const onMessage = () => {
    incrementWaitMessageCounter();
    checkTimer(false);
};

const sendMessage = async () => {
    resetCounters();

    await bot.sendTyping();

    const lastMessages = await bot.getLastMessages();
    let generatedMessage = await generateMessage(lastMessages);

    if (generatedMessage.toUpperCase().trim() === "NOT INTERESTED") return console.debug("NOT INTERESTED");

    lastMessages.forEach(
        (message) =>
            (generatedMessage = generatedMessage.replace(`@${message.author.username}`, `<@${message.author.id}>`)),
    );

    await bot.sendMessage(generatedMessage);
};

setOnSuccess(sendMessage);
bot.onMessageReceived(onMessage);
bot.onReady(startInterval);
