import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const usersFile = join(__dirname, '..', 'data', 'users.json');

let users = {};

export function loadUsers() {
    try {
        if (existsSync(usersFile)) {
            users = JSON.parse(readFileSync(usersFile, 'utf-8'));
        } else {
            saveUsers();
        }
    } catch {
        users = {};
        saveUsers();
    }
    return users;
}

function saveUsers() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error guardando users:', error);
    }
}

export function registerUser(userId, data) {
    users[userId] = {
        discordId: userId,
        discordUsername: data.username,
        discordAvatar: data.avatar || null,
        guildId: data.guildId,
        guildName: data.guildName || null,
        registeredAt: new Date().toISOString()
    };
    saveUsers();
    return users[userId];
}

export function unregisterUser(userId) {
    if (users[userId]) {
        delete users[userId];
        saveUsers();
        return true;
    }
    return false;
}

export function getUser(userId) {
    return users[userId] || null;
}

export function isRegistered(userId) {
    return !!users[userId];
}

export function getAllUsers() {
    return users;
}

export function getUsersByGuild(guildId) {
    const result = {};
    for (const [userId, data] of Object.entries(users)) {
        if (data.guildId === guildId) {
            result[userId] = data;
        }
    }
    return result;
}

export function getUserCount() {
    return Object.keys(users).length;
}

export function getGuildUserCount(guildId) {
    return Object.values(users).filter(u => u.guildId === guildId).length;
}
