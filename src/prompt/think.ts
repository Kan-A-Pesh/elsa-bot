import OpenAI from "openai";
import { MessagePayload } from "../types/messagePayload";
import generateSystemPrompt from "./system";
import emotions from "./emotions";
import { ChatCompletionMessageParam } from "openai/resources";
import { parseMessage } from "./parseMessage";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateMessage = async (messages: MessagePayload[]) => {
    if (!process.env.OPENAI_API_KEY) throw new Error("Could not find OPENAI_API_KEY in your environment");
    if (!process.env.PERSONALITY) throw new Error("Could not find PERSONALITY in your environment");

    const systemPrompt = generateSystemPrompt(process.env.PERSONALITY, emotions);

    const parsedMessages = messages.map((message) => {
        const param = {
            role: message.author.isMe ? "assistant" : "user",
            name: message.author.username,
            content: message.imageUrl
                ? [
                      { type: "text", text: message.content },
                      { type: "image_url", image_url: { url: message.imageUrl, detail: "low" } },
                  ]
                : [{ type: "text", text: message.content }],
        } as ChatCompletionMessageParam;

        return param;
    });

    console.debug("QUERY", JSON.stringify([{ role: "system", content: systemPrompt }, ...parsedMessages]));

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...parsedMessages],
    });

    const message = completion.choices[0].message.content;
    if (!message) {
        throw new Error("Could not generate message");
    }

    const parsedMessage = parseMessage(message);

    parsedMessage.actions.forEach((action) => {
        switch (action.name) {
            case "PICTURE":
                console.debug("PICTURE", action.value);
                break;
            case "EMOTION":
                console.debug("EMOTION", action.value);
                break;
        }
    });

    return parsedMessage.parsed;
};
