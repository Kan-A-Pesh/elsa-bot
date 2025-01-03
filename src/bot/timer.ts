let lastSentMessage = 0;
let waitMessageCounter = 0;
let nextWaitIntervalId: NodeJS.Timeout | null = null;
let onSuccessCallback: (() => void) | null = null;

export const setOnSuccess = (callback: () => void) => (onSuccessCallback = callback);

export const incrementWaitMessageCounter = () => {
    waitMessageCounter++;
};

export const resetCounters = () => {
    waitMessageCounter = 0;
    lastSentMessage = Date.now();
};

export const tryParseNumber = (n?: string): number | null => {
    if (!n) return null;

    try {
        return parseFloat(n);
    } catch {
        return null;
    }
};

export const checkTimer = (checkFromInterval: boolean) => {
    if (waitMessageCounter === 0) {
        console.debug("CHECK(INVALID): Last message is from the bot");
        return;
    }

    // Check if the user responded within the MAX_CONVERSATION_TIME
    if (!checkFromInterval) {
        const now = Date.now();
        const maxConversationTime = tryParseNumber(process.env.MAX_CONVERSATION_TIME);
        if (!maxConversationTime) throw Error("Invalid MAX_CONVERSATION_TIME");

        if (lastSentMessage + maxConversationTime * 1000 > now) {
            console.debug("CHECK(VALID): User responded within the MAX_CONVERSATION_TIME");
            return onSuccessCallback?.();
        }
    }

    // Check if MAX_WAIT_MESSAGES has been reached
    const maxWaitMessages = tryParseNumber(process.env.MAX_WAIT_MESSAGES);
    if (!maxWaitMessages) throw Error("Invalid MAX_WAIT_MESSAGES");

    if (waitMessageCounter >= maxWaitMessages) {
        console.debug("CHECK(VALID): MAX_WAIT_MESSAGES reached");
        return onSuccessCallback?.();
    }

    // Check if the timer has been triggered
    if (checkFromInterval) {
        console.debug("CHECK(VALID): Timer triggered");
        return onSuccessCallback?.();
    }

    // Timer not triggered
    console.debug("CHECK(INVALID): Timer not triggered");
    return;
};

export const startInterval = () => {
    stopInterval();

    const minWaitTime = tryParseNumber(process.env.MIN_WAIT_TIME);
    const maxWaitTime = tryParseNumber(process.env.MAX_WAIT_TIME);

    if (!minWaitTime) throw Error("Invalid MIN_WAIT_TIME");
    if (!maxWaitTime) throw Error("Invalid MAX_WAIT_TIME");

    const delta = maxWaitTime - minWaitTime;
    const next = minWaitTime + Math.random() * delta;

    setTimeout(() => {
        checkTimer(true);
        nextWaitIntervalId = setTimeout(startInterval, next * 1000);
    }, next);
};

export const stopInterval = () => {
    if (!nextWaitIntervalId) return;
    clearTimeout(nextWaitIntervalId);
};
