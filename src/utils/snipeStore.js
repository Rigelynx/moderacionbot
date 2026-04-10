// In-memory store for last deleted message per channel
const snipes = new Map();

export function setSnipe(channelId, data) {
    snipes.set(channelId, {
        content: data.content,
        author: data.author,
        avatar: data.avatar,
        timestamp: data.timestamp || Date.now()
    });

    // Auto-delete after 5 minutes
    setTimeout(() => {
        if (snipes.get(channelId)?.timestamp === data.timestamp) {
            snipes.delete(channelId);
        }
    }, 300000);
}

export function getSnipe(channelId) {
    return snipes.get(channelId) || null;
}

export function deleteSnipe(channelId) {
    snipes.delete(channelId);
}
