import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const verificationFile = join(__dirname, '..', 'data', 'verificationTokens.json');

let verificationData = { tokens: {} };

function saveVerificationStore() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        writeFileSync(verificationFile, JSON.stringify(verificationData, null, 2));
    } catch (error) {
        console.error('Error guardando tokens de verificación:', error);
    }
}

export function loadVerificationStore() {
    try {
        if (existsSync(verificationFile)) {
            const parsed = JSON.parse(readFileSync(verificationFile, 'utf-8'));
            verificationData = parsed && typeof parsed === 'object' && parsed.tokens
                ? parsed
                : { tokens: {} };
        } else {
            saveVerificationStore();
        }
    } catch {
        verificationData = { tokens: {} };
        saveVerificationStore();
    }

    cleanupExpiredVerificationTokens();
    return verificationData;
}

export function cleanupExpiredVerificationTokens() {
    const now = Date.now();
    let changed = false;

    for (const [token, entry] of Object.entries(verificationData.tokens)) {
        if (!entry?.expiresAt || entry.expiresAt <= now) {
            delete verificationData.tokens[token];
            changed = true;
        }
    }

    if (changed) {
        saveVerificationStore();
    }
}

export function revokeVerificationTokensForUser(guildId, userId) {
    let changed = false;

    for (const [token, entry] of Object.entries(verificationData.tokens)) {
        if (entry.guildId === guildId && entry.userId === userId) {
            delete verificationData.tokens[token];
            changed = true;
        }
    }

    if (changed) {
        saveVerificationStore();
    }
}

export function createVerificationToken(guildId, userId, ttlMs = 15 * 60 * 1000) {
    cleanupExpiredVerificationTokens();
    revokeVerificationTokensForUser(guildId, userId);

    const token = randomBytes(24).toString('hex');
    const entry = {
        guildId,
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttlMs
    };
    verificationData.tokens[token] = entry;

    saveVerificationStore();
    return { token, ...entry };
}

export function getVerificationToken(token) {
    cleanupExpiredVerificationTokens();
    return verificationData.tokens[token] || null;
}

export function consumeVerificationToken(token) {
    const entry = verificationData.tokens[token];
    if (!entry) return null;

    delete verificationData.tokens[token];
    saveVerificationStore();
    return entry;
}

export function deleteVerificationToken(token) {
    if (!verificationData.tokens[token]) return false;

    delete verificationData.tokens[token];
    saveVerificationStore();
    return true;
}

loadVerificationStore();
