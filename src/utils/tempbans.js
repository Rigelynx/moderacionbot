import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logWarning } from './logger.js';
import { sendLog, createModerationEmbed } from './embeds.js';
import { clearWarnings } from './warnings.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempbansFile = join(__dirname, '..', 'data', 'tempbans.json');

let tempbans = {};

export function loadTempBans() {
    try {
        if (existsSync(tempbansFile)) {
            tempbans = JSON.parse(readFileSync(tempbansFile, 'utf-8'));
        } else {
            saveTempBans();
        }
    } catch {
        tempbans = {};
        saveTempBans();
    }
    return tempbans;
}

function saveTempBans() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(tempbansFile, JSON.stringify(tempbans, null, 2));
    } catch (error) {
        logWarning('Error guardando tempbans: ' + error.message);
    }
}

export function addTempBan(guildId, userId, reason, moderator, expiresAt) {
    if (!tempbans[guildId]) tempbans[guildId] = {};
    tempbans[guildId][userId] = {
        reason,
        moderator,
        expiresAt,
        bannedAt: new Date().toISOString()
    };
    saveTempBans();
}

export function removeTempBan(guildId, userId) {
    if (tempbans[guildId]?.[userId]) {
        delete tempbans[guildId][userId];
        if (Object.keys(tempbans[guildId]).length === 0) {
            delete tempbans[guildId];
        }
        saveTempBans();
        return true;
    }
    return false;
}

export function getTempBan(guildId, userId) {
    return tempbans[guildId]?.[userId] || null;
}

export function getAllTempBans() {
    return tempbans;
}

export function startTempBanChecker(client) {
    setInterval(async () => {
        const now = Date.now();

        for (const [guildId, users] of Object.entries(tempbans)) {
            for (const [userId, data] of Object.entries(users)) {
                if (now >= new Date(data.expiresAt).getTime()) {
                    try {
                        const guild = client.guilds.cache.get(guildId);
                        if (!guild) continue;

                        await guild.members.unban(userId, 'Ban temporal expirado');
                        clearWarnings(guildId, userId);

                        const embed = createModerationEmbed({
                            color: 0x00ff00,
                            title: '⏰ Ban Temporal Expirado',
                            user: { id: userId, username: `Usuario ${userId}`, user: { username: `Usuario ${userId}` } },
                            moderator: { username: 'Sistema (Auto)' },
                            fields: [{ name: 'Razón original', value: data.reason || 'No especificada' }]
                        });

                        await sendLog(guild, { embeds: [embed] }, client);
                        logInfo(`Tempban expirado: ${userId} en ${guild.name}`);
                    } catch (err) {
                        // User might already be unbanned
                    }

                    removeTempBan(guildId, userId);
                }
            }
        }
    }, 60000); // Check every 60 seconds
}
