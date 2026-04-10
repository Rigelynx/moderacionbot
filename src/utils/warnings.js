import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const warningsFile = join(__dirname, '..', 'data', 'warnings.json');

let warnings = {};

export function loadWarnings() {
    try {
        if (existsSync(warningsFile)) {
            warnings = JSON.parse(readFileSync(warningsFile, 'utf-8'));
        } else {
            saveWarnings();
        }
    } catch {
        warnings = {};
        saveWarnings();
    }
    return warnings;
}

function saveWarnings() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('Error guardando warnings:', error);
    }
}

export function addWarning(guildId, userId, reason, moderator) {
    if (!warnings[guildId]) warnings[guildId] = {};
    if (!warnings[guildId][userId]) warnings[guildId][userId] = [];

    warnings[guildId][userId].push({
        reason,
        moderator,
        date: new Date().toISOString()
    });

    saveWarnings();
    return warnings[guildId][userId].length;
}

export function removeWarning(guildId, userId, index) {
    if (!warnings[guildId]?.[userId]?.length) return false;

    if (index !== undefined) {
        if (index < 0 || index >= warnings[guildId][userId].length) return false;
        warnings[guildId][userId].splice(index, 1);
    } else {
        warnings[guildId][userId].pop();
    }

    if (warnings[guildId][userId].length === 0) {
        delete warnings[guildId][userId];
    }

    saveWarnings();
    return true;
}

export function getWarnings(guildId, userId) {
    return warnings[guildId]?.[userId] || [];
}

export function getWarningCount(guildId, userId) {
    return getWarnings(guildId, userId).length;
}

export function clearWarnings(guildId, userId) {
    if (warnings[guildId]?.[userId]) {
        delete warnings[guildId][userId];
        saveWarnings();
    }
}
