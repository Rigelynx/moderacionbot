import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const afkFile = join(__dirname, '..', 'data', 'afk.json');

// afk structure: { "guildId": { "userId": { reason: string, timestamp: number } } }
let afkData = {};

export function loadAfkData() {
    try {
        if (existsSync(afkFile)) {
            const data = readFileSync(afkFile, 'utf-8');
            afkData = JSON.parse(data);
        } else {
            saveAfkData();
        }
    } catch (error) {
        saveAfkData();
    }
}

export function saveAfkData() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(afkFile, JSON.stringify(afkData, null, 2));
    } catch (error) {
        console.error('Error guardando AFK data', error);
    }
}

export function setAfk(guildId, userId, reason) {
    if (!afkData[guildId]) afkData[guildId] = {};
    afkData[guildId][userId] = {
        reason: reason || 'AFK',
        timestamp: Date.now()
    };
    saveAfkData();
}

export function removeAfk(guildId, userId) {
    if (!afkData[guildId] || !afkData[guildId][userId]) return false;
    delete afkData[guildId][userId];
    saveAfkData();
    return true;
}

export function getAfk(guildId, userId) {
    if (!afkData[guildId]) return null;
    return afkData[guildId][userId] || null;
}

loadAfkData();
