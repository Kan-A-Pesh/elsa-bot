export const parseMessage = (
    message: string,
): {
    parsed: string;
    actions: { name: string; value: string }[];
} => {
    const actions: { name: string; value: string }[] = [];

    const parsed = message.replace(/\[\[(.+?)\]\]/g, (match, action: string) => {
        const [key, value] = action.split(": ", 2);
        actions.push({ name: key, value });
        return "";
    });

    return { parsed, actions };
};
