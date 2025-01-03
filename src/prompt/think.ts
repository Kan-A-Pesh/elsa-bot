import OpenAI from "openai";
import { MessagePayload } from "../types/messagePayload";
import generateSystemPrompt from "./system";
import emotions from "./emotions";
import { ChatCompletionMessageParam } from "openai/resources";
import { parseMessage } from "./parseMessage";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateImage = async (prompt: string) => {
    const response = await openai.images.generate({
        model: "dall-e-2",
        quality: "standard",
        response_format: "url",
        prompt: prompt,
        n: 1,
        size: "512x512",
    });

    return response.data[0].url;
};

export const generateMessage = async (messages: MessagePayload[]) => {
    if (!process.env.OPENAI_API_KEY) throw new Error("Could not find OPENAI_API_KEY in your environment");
    if (!process.env.PERSONALITY) throw new Error("Could not find PERSONALITY in your environment");
    if (!process.env.NAME) throw new Error("Could not find NAME in your environment");

    const systemPrompt = generateSystemPrompt(process.env.NAME, process.env.PERSONALITY, emotions);

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

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...parsedMessages],
    });

    const message = completion.choices[0].message.content;
    if (!message) {
        throw new Error("Could not generate message");
    }

    const parsedMessage = parseMessage(message);
    return parsedMessage;
};
