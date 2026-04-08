export function parseDuration(duration) {
    const regex = /^(\d+)(s|m|h|d)$/;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    };
    
    return multipliers[unit] ? value * multipliers[unit] : null;
}

export function formatDate(date) {
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function getStatusEmoji(status) {
    const statusMap = {
        online: '🟢',
        idle: '🌙',
        dnd: '⛔',
        offline: '⚫'
    };
    return statusMap[status] || statusMap.offline;
}
