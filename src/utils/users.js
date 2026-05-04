import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const usersFile = join(__dirname, '..', 'data', 'users.json');

let users = { guilds: {} };

function createEmptyUsersStore() {
    return { guilds: {} };
}

function isLegacyUsersShape(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (value.guilds && typeof value.guilds === 'object' && !Array.isArray(value.guilds)) return false;

    return Object.values(value).some(entry =>
        entry &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        typeof entry.guildId === 'string'
    );
}

function normalizeUserEntry(userId, data = {}) {
    return {
        discordId: userId,
        discordUsername: data.discordUsername || data.username || 'Usuario desconocido',
        discordAvatar: data.discordAvatar || data.avatar || null,
        guildId: data.guildId || null,
        guildName: data.guildName || null,
        registeredAt: data.registeredAt || new Date().toISOString()
    };
}

function normalizeUsersStore(rawUsers) {
    if (isLegacyUsersShape(rawUsers)) {
        const migrated = createEmptyUsersStore();

        for (const [userId, data] of Object.entries(rawUsers)) {
            if (!data?.guildId) continue;

            if (!migrated.guilds[data.guildId]) {
                migrated.guilds[data.guildId] = {};
            }

            migrated.guilds[data.guildId][userId] = normalizeUserEntry(userId, data);
        }

        return migrated;
    }

    const next = createEmptyUsersStore();
    const guildEntries = rawUsers?.guilds && typeof rawUsers.guilds === 'object' ? rawUsers.guilds : {};

    for (const [guildId, guildUsers] of Object.entries(guildEntries)) {
        if (!guildUsers || typeof guildUsers !== 'object' || Array.isArray(guildUsers)) continue;

        next.guilds[guildId] = {};
        for (const [userId, data] of Object.entries(guildUsers)) {
            next.guilds[guildId][userId] = normalizeUserEntry(userId, {
                ...data,
                guildId
            });
        }
    }

    return next;
}

function getGuildUsersBucket(guildId) {
    if (!users.guilds[guildId]) {
        users.guilds[guildId] = {};
    }

    return users.guilds[guildId];
}

export function loadUsers() {
    try {
        if (existsSync(usersFile)) {
            const parsedUsers = JSON.parse(readFileSync(usersFile, 'utf-8'));
            const shouldRewrite = isLegacyUsersShape(parsedUsers) || !parsedUsers?.guilds;
            users = normalizeUsersStore(parsedUsers);
            if (shouldRewrite) {
                saveUsers();
            }
        } else {
            saveUsers();
        }
    } catch {
        users = createEmptyUsersStore();
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

export function registerUser(guildId, userId, data) {
    const guildUsers = getGuildUsersBucket(guildId);

    guildUsers[userId] = {
        discordId: userId,
        discordUsername: data.username,
        discordAvatar: data.avatar || null,
        guildId,
        guildName: data.guildName || null,
        registeredAt: new Date().toISOString()
    };
    saveUsers();
    return guildUsers[userId];
}

export function unregisterUser(guildId, userId) {
    const guildUsers = users.guilds[guildId];

    if (guildUsers?.[userId]) {
        delete guildUsers[userId];
        if (!Object.keys(guildUsers).length) {
            delete users.guilds[guildId];
        }
        saveUsers();
        return true;
    }
    return false;
}

export function getUser(guildId, userId) {
    return users.guilds[guildId]?.[userId] || null;
}

export function isRegistered(guildId, userId) {
    return !!users.guilds[guildId]?.[userId];
}

export function getAllUsers() {
    return users;
}

export function getUsersByGuild(guildId) {
    return { ...(users.guilds[guildId] || {}) };
}

export function getUserCount() {
    return Object.values(users.guilds).reduce((total, guildUsers) => total + Object.keys(guildUsers).length, 0);
}

export function getGuildUserCount(guildId) {
    return Object.keys(users.guilds[guildId] || {}).length;
}
