const sanitizeUsername = (username: string): string => {
    return username.replace(/[^a-zA-Z0-9_-]/g, "");
};

export default sanitizeUsername;
