export interface MessagePayload {
    content: string;
    imageUrl?: string;
    author: {
        id: string;
        username: string;
        isMe: boolean;
    };
}
