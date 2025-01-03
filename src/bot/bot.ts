import {
    ChannelType,
    Client,
    Events,
    GatewayIntentBits,
    Message,
    OmitPartialGroupDMChannel,
    TextChannel,
} from "discord.js";
import sanitizeUsername from "../utils/sanitize";
import { MessagePayload } from "../types/messagePayload";

export default class Bot {
    private client: Client;
    private messageCallback?: () => void;

    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

        this.client.once(Events.ClientReady, async (readyClient: Client<true>) => {
            console.log(`Ready! Logged in as ${readyClient.user.displayName}`);

            if (process.env.CHANNEL_ID) {
                const channel = await this.getChannel();
                console.log(`Listening to channel ${channel.name} (${channel.id})`);
            } else {
                console.warn("No CHANNEL_ID provided, listening to all channels");
            }
        });

        this.client.on(Events.MessageCreate, (message: OmitPartialGroupDMChannel<Message<boolean>>) =>
            this.onMessage(message),
        );

        const token = process.env.DISCORD_TOKEN;
        if (!token) {
            throw new Error("Could not find DISCORD_TOKEN in your environment");
        }

        console.debug(`Logging in using token ${token.slice(0, 5)}...${token.slice(-5)}`);
        this.client.login(token);
    }

    private async getChannel(): Promise<TextChannel> {
        if (!process.env.CHANNEL_ID) {
            throw new Error("CHANNEL_ID is not set");
        }

        const channel = await this.client.channels.fetch(process.env.CHANNEL_ID);
        if (!channel) {
            throw new Error(`Could not find channel with id ${process.env.CHANNEL_ID}`);
        }

        if (channel.type !== ChannelType.GuildText) {
            throw new Error(`Channel with id ${process.env.CHANNEL_ID} is not a text channel`);
        }

        return channel;
    }

    private async onMessage(message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> {
        if (process.env.CHANNEL_ID && message.channel.id !== process.env.CHANNEL_ID) {
            return;
        }

        if (message.author.id === this.client.user?.id) {
            return;
        }

        this.messageCallback!();
    }

    public onMessageReceived(callback: () => void): void {
        this.messageCallback = callback;
    }

    public onReady(callback: () => void): void {
        this.client.once(Events.ClientReady, callback);
    }

    public async getLastMessages(): Promise<MessagePayload[]> {
        const channel = await this.getChannel();

        const lastMessagesQuery = await channel.messages.fetch({ limit: 10 });
        const lastMessages = lastMessagesQuery
            .mapValues((m) => ({
                content: m.content,
                author: {
                    id: m.author.id,
                    isMe: m.author.id === this.client.user?.id,
                    username: sanitizeUsername(m.author.username),
                },
            }))
            .values();

        return Array.from(lastMessages)
            .reverse()
            .filter((message) => !message.content.startsWith("@ignore"));
    }

    public async sendMessage(content: string): Promise<void> {
        const channel = await this.getChannel();
        await channel.send(content);
    }

    public async sendTyping(): Promise<void> {
        const channel = await this.getChannel();
        await channel.sendTyping();
    }
}
