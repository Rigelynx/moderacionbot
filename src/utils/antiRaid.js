import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    EmbedBuilder,
    ModalBuilder,
    PermissionFlagsBits,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder
} from 'discord.js';
import { getAntiRaidConfig, updateAntiRaidConfig } from './config.js';
import { sendLog } from './embeds.js';

export const ANTI_RAID_LEVELS = {
    OFF: 0,
    MONITOR: 1,
    CLEAN: 2,
    CONTAIN: 3,
    PANIC: 4
};

export const ANTI_RAID_LEVEL_KEYS = {
    off: ANTI_RAID_LEVELS.OFF,
    monitor: ANTI_RAID_LEVELS.MONITOR,
    clean: ANTI_RAID_LEVELS.CLEAN,
    contain: ANTI_RAID_LEVELS.CONTAIN,
    panic: ANTI_RAID_LEVELS.PANIC
};

const ANTI_RAID_LEVEL_LABELS = {
    [ANTI_RAID_LEVELS.OFF]: 'Off',
    [ANTI_RAID_LEVELS.MONITOR]: 'Monitor',
    [ANTI_RAID_LEVELS.CLEAN]: 'Clean',
    [ANTI_RAID_LEVELS.CONTAIN]: 'Contain',
    [ANTI_RAID_LEVELS.PANIC]: 'Panic'
};

const ANTI_RAID_PANEL_IDS = {
    toggle: 'antiRaid:toggle',
    panic: 'antiRaid:panic',
    normalize: 'antiRaid:normalize',
    refresh: 'antiRaid:refresh',
    flood: 'antiRaid:flood',
    mentions: 'antiRaid:mentions',
    joins: 'antiRaid:joins',
    whitelist: 'antiRaid:whitelist',
    presets: 'antiRaid:presets',
    baseLevel: 'antiRaid:baseLevel',
    presetSelect: 'antiRaid:presetSelect',
    panicModal: 'antiRaid:panicModal',
    floodModal: 'antiRaid:floodModal',
    mentionsModal: 'antiRaid:mentionsModal',
    joinsModal: 'antiRaid:joinsModal',
    whitelistHome: 'antiRaid:wl:home',
    whitelistView: 'antiRaid:wl:view',
    whitelistAddUser: 'antiRaid:wl:addUser',
    whitelistRemoveUser: 'antiRaid:wl:removeUser',
    whitelistAddRole: 'antiRaid:wl:addRole',
    whitelistRemoveRole: 'antiRaid:wl:removeRole',
    whitelistAddChannel: 'antiRaid:wl:addChannel',
    whitelistRemoveChannel: 'antiRaid:wl:removeChannel',
    whitelistUserAddSelect: 'antiRaid:wl:user:addSelect',
    whitelistUserRemoveSelect: 'antiRaid:wl:user:removeSelect',
    whitelistRoleAddSelect: 'antiRaid:wl:role:addSelect',
    whitelistRoleRemoveSelect: 'antiRaid:wl:role:removeSelect',
    whitelistChannelAddSelect: 'antiRaid:wl:channel:addSelect',
    whitelistChannelRemoveSelect: 'antiRaid:wl:channel:removeSelect'
};

const ANTI_RAID_PRESETS = {
    small: {
        label: 'Servidor pequeño',
        description: 'Mas sensible para comunidades reducidas.',
        updates: {
            enabled: true,
            baseLevel: ANTI_RAID_LEVELS.MONITOR,
            currentLevel: ANTI_RAID_LEVELS.MONITOR,
            messageSpam: { enabled: true, maxMessages: 5, intervalSeconds: 8, timeoutMinutes: 8 },
            duplicateSpam: { enabled: true, maxDuplicates: 3, intervalSeconds: 15, timeoutMinutes: 12 },
            mentionSpam: { enabled: true, maxMentions: 4, blockEveryone: true, timeoutMinutes: 20 },
            joinRaid: { enabled: true, warningJoins: 4, dangerJoins: 7, intervalSeconds: 25, newAccountDays: 10, suspiciousTimeoutMinutes: 45 },
            panic: { autoActivateOnDanger: true, autoNormalizeMinutes: 15, messageMultiplierPercent: 65 }
        }
    },
    medium: {
        label: 'Servidor mediano',
        description: 'Equilibrado para actividad normal.',
        updates: {
            enabled: true,
            baseLevel: ANTI_RAID_LEVELS.MONITOR,
            currentLevel: ANTI_RAID_LEVELS.MONITOR,
            messageSpam: { enabled: true, maxMessages: 6, intervalSeconds: 8, timeoutMinutes: 10 },
            duplicateSpam: { enabled: true, maxDuplicates: 3, intervalSeconds: 15, timeoutMinutes: 15 },
            mentionSpam: { enabled: true, maxMentions: 5, blockEveryone: true, timeoutMinutes: 20 },
            joinRaid: { enabled: true, warningJoins: 6, dangerJoins: 10, intervalSeconds: 30, newAccountDays: 7, suspiciousTimeoutMinutes: 30 },
            panic: { autoActivateOnDanger: true, autoNormalizeMinutes: 15, messageMultiplierPercent: 70 }
        }
    },
    large: {
        label: 'Servidor grande',
        description: 'Menos sensible para volumen alto.',
        updates: {
            enabled: true,
            baseLevel: ANTI_RAID_LEVELS.CLEAN,
            currentLevel: ANTI_RAID_LEVELS.CLEAN,
            messageSpam: { enabled: true, maxMessages: 8, intervalSeconds: 8, timeoutMinutes: 10 },
            duplicateSpam: { enabled: true, maxDuplicates: 4, intervalSeconds: 18, timeoutMinutes: 15 },
            mentionSpam: { enabled: true, maxMentions: 6, blockEveryone: true, timeoutMinutes: 20 },
            joinRaid: { enabled: true, warningJoins: 10, dangerJoins: 16, intervalSeconds: 30, newAccountDays: 5, suspiciousTimeoutMinutes: 25 },
            panic: { autoActivateOnDanger: true, autoNormalizeMinutes: 12, messageMultiplierPercent: 75 }
        }
    },
    strict: {
        label: 'Modo estricto',
        description: 'Contencion mas agresiva.',
        updates: {
            enabled: true,
            baseLevel: ANTI_RAID_LEVELS.CONTAIN,
            currentLevel: ANTI_RAID_LEVELS.CONTAIN,
            messageSpam: { enabled: true, maxMessages: 5, intervalSeconds: 7, timeoutMinutes: 15 },
            duplicateSpam: { enabled: true, maxDuplicates: 3, intervalSeconds: 12, timeoutMinutes: 20 },
            mentionSpam: { enabled: true, maxMentions: 3, blockEveryone: true, timeoutMinutes: 30 },
            joinRaid: { enabled: true, warningJoins: 5, dangerJoins: 8, intervalSeconds: 25, newAccountDays: 14, suspiciousTimeoutMinutes: 60 },
            panic: { autoActivateOnDanger: true, autoNormalizeMinutes: 20, messageMultiplierPercent: 55 }
        }
    },
    relaxed: {
        label: 'Modo relajado',
        description: 'Mas tolerante, ideal para pruebas.',
        updates: {
            enabled: true,
            baseLevel: ANTI_RAID_LEVELS.MONITOR,
            currentLevel: ANTI_RAID_LEVELS.MONITOR,
            messageSpam: { enabled: true, maxMessages: 9, intervalSeconds: 10, timeoutMinutes: 8 },
            duplicateSpam: { enabled: true, maxDuplicates: 4, intervalSeconds: 20, timeoutMinutes: 10 },
            mentionSpam: { enabled: true, maxMentions: 7, blockEveryone: true, timeoutMinutes: 15 },
            joinRaid: { enabled: true, warningJoins: 8, dangerJoins: 14, intervalSeconds: 35, newAccountDays: 5, suspiciousTimeoutMinutes: 20 },
            panic: { autoActivateOnDanger: true, autoNormalizeMinutes: 10, messageMultiplierPercent: 80 }
        }
    }
};

const runtimeState = {
    watcher: null,
    messageHistory: new Map(),
    joinHistory: new Map(),
    incidentCooldowns: new Map()
};

function getNow() {
    return Date.now();
}

function truncate(value, maxLength = 200) {
    const text = String(value || '').trim();
    if (!text) return 'Sin detalles';
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function cleanupList(items, maxAgeMs, now = getNow()) {
    return items.filter(item => now - item.timestamp <= maxAgeMs);
}

function getUserHistory(guildId, userId) {
    if (!runtimeState.messageHistory.has(guildId)) {
        runtimeState.messageHistory.set(guildId, new Map());
    }

    const guildHistory = runtimeState.messageHistory.get(guildId);
    if (!guildHistory.has(userId)) {
        guildHistory.set(userId, []);
    }

    return guildHistory.get(userId);
}

function setUserHistory(guildId, userId, entries) {
    const guildHistory = runtimeState.messageHistory.get(guildId);
    if (!guildHistory) return;

    if (!entries.length) {
        guildHistory.delete(userId);
        if (!guildHistory.size) {
            runtimeState.messageHistory.delete(guildId);
        }
        return;
    }

    guildHistory.set(userId, entries);
}

function getJoinHistory(guildId) {
    if (!runtimeState.joinHistory.has(guildId)) {
        runtimeState.joinHistory.set(guildId, []);
    }

    return runtimeState.joinHistory.get(guildId);
}

function setJoinHistory(guildId, entries) {
    if (!entries.length) {
        runtimeState.joinHistory.delete(guildId);
        return;
    }

    runtimeState.joinHistory.set(guildId, entries);
}

function shouldThrottleIncident(key, cooldownMs) {
    const now = getNow();
    const expiresAt = runtimeState.incidentCooldowns.get(key) || 0;

    if (expiresAt > now) {
        return true;
    }

    runtimeState.incidentCooldowns.set(key, now + cooldownMs);
    return false;
}

function createActionSummary(actions) {
    if (!actions.length) return 'Sin accion automatica';
    return actions.join(' | ');
}

function formatDuration(minutes) {
    if (!minutes) return 'No definido';

    if (minutes % (60 * 24) === 0) {
        return `${minutes / (60 * 24)} dia(s)`;
    }
    if (minutes % 60 === 0) {
        return `${minutes / 60} hora(s)`;
    }
    return `${minutes} minuto(s)`;
}

function formatRemainingTime(timestamp) {
    if (!timestamp || timestamp <= getNow()) return 'Expirado';
    return `<t:${Math.floor(timestamp / 1000)}:R>`;
}

function formatAbsoluteTime(timestamp) {
    if (!timestamp) return 'No activo';
    return `<t:${Math.floor(timestamp / 1000)}:F>`;
}

function getLevelLabel(level) {
    return ANTI_RAID_LEVEL_LABELS[level] || 'Desconocido';
}

export function getAntiRaidLevelLabel(level) {
    return getLevelLabel(level);
}

export function getAntiRaidComponentIds() {
    return ANTI_RAID_PANEL_IDS;
}

export function hasAntiRaidAccess(member) {
    return Boolean(
        member?.permissions?.has(PermissionFlagsBits.Administrator) ||
        member?.permissions?.has(PermissionFlagsBits.ManageGuild)
    );
}

function getLevelColor(level) {
    switch (level) {
        case ANTI_RAID_LEVELS.MONITOR:
            return 0x5865F2;
        case ANTI_RAID_LEVELS.CLEAN:
            return 0xFEE75C;
        case ANTI_RAID_LEVELS.CONTAIN:
            return 0xF4900C;
        case ANTI_RAID_LEVELS.PANIC:
            return 0xED4245;
        default:
            return 0x747F8D;
    }
}

function parseBooleanInput(value, fallback) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (['true', '1', 'si', 'sí', 'on', 'activo', 'activado'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'desactivado'].includes(normalized)) return false;
    return fallback;
}

function parseIntegerInput(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

async function logAntiRaidAdminAction(guild, client, {
    title,
    description,
    actorTag,
    fields = []
}) {
    const embed = createLogEmbed({
        title,
        color: 0x5865F2,
        description,
        fields: [
            { name: 'Responsable', value: actorTag, inline: true },
            ...fields
        ]
    });

    await sendLog(guild, { embeds: [embed] }, client);
}

export function getAntiRaidLevelValue(key, { allowOff = false, allowPanic = false } = {}) {
    const normalizedKey = String(key || '').toLowerCase();
    const level = ANTI_RAID_LEVEL_KEYS[normalizedKey];

    if (level === undefined) return null;
    if (!allowOff && level === ANTI_RAID_LEVELS.OFF) return null;
    if (!allowPanic && level === ANTI_RAID_LEVELS.PANIC) return null;

    return level;
}

function isPanicExpired(config) {
    return Boolean(config?.enabled && config?.currentLevel === ANTI_RAID_LEVELS.PANIC && config?.panicUntil && config.panicUntil <= getNow());
}

export function getSyncedAntiRaidConfig(guildId) {
    const config = getAntiRaidConfig(guildId);

    if (!isPanicExpired(config)) {
        return config;
    }

    return updateAntiRaidConfig(guildId, {
        currentLevel: config.baseLevel,
        panicUntil: null,
        panicReason: null
    });
}

export function getAntiRaidStatus(guildId) {
    const config = getSyncedAntiRaidConfig(guildId);

    return {
        ...config,
        effectiveLevel: config.enabled ? config.currentLevel : ANTI_RAID_LEVELS.OFF,
        effectiveLevelLabel: getLevelLabel(config.enabled ? config.currentLevel : ANTI_RAID_LEVELS.OFF),
        baseLevelLabel: getLevelLabel(config.baseLevel)
    };
}

function getNormalizedContent(message) {
    const parts = [];

    if (message.content) {
        parts.push(message.content);
    }

    if (message.attachments?.size) {
        for (const attachment of message.attachments.values()) {
            parts.push(attachment.name || attachment.url || '');
        }
    }

    return parts
        .join(' ')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function countMentions(message) {
    return (
        message.mentions.users.size +
        message.mentions.roles.size +
        (message.mentions.everyone ? 1 : 0)
    );
}

function isExemptMember(member, config, channelId = null) {
    if (!member || !config) return false;

    if (config.whitelistUserIds.includes(member.id)) return true;
    if (channelId && config.whitelistChannelIds.includes(channelId)) return true;

    if (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return true;
    }

    return member.roles.cache.some(role => config.whitelistRoleIds.includes(role.id));
}

function getStrictThreshold(baseValue, config) {
    if (config.currentLevel !== ANTI_RAID_LEVELS.PANIC) {
        return baseValue;
    }

    return Math.max(1, Math.floor((baseValue * config.panic.messageMultiplierPercent) / 100));
}

function createLogEmbed({ title, color, description, fields = [] }) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addFields(fields)
        .setTimestamp();
}

async function deleteRecentMessages(message, windowSeconds, maxMessages = 8) {
    if (!message.channel?.messages?.fetch) return 0;

    const cutoff = getNow() - (windowSeconds * 1000);
    const targets = new Map();

    if (message.deletable) {
        targets.set(message.id, message);
    }

    const fetched = await message.channel.messages.fetch({ limit: 25 }).catch(() => null);
    if (fetched) {
        for (const fetchedMessage of fetched.values()) {
            if (
                fetchedMessage.author.id === message.author.id &&
                fetchedMessage.createdTimestamp >= cutoff &&
                fetchedMessage.deletable
            ) {
                targets.set(fetchedMessage.id, fetchedMessage);
            }
        }
    }

    let deleted = 0;
    for (const target of [...targets.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp).slice(0, maxMessages)) {
        const wasDeleted = await target.delete().then(() => true).catch(() => false);
        if (wasDeleted) deleted++;
    }

    return deleted;
}

async function applyTimeout(member, minutes, reason) {
    if (!member?.moderatable || member.user.bot) {
        return false;
    }

    if (member.isCommunicationDisabled()) {
        return false;
    }

    return member.timeout(minutes * 60 * 1000, reason).then(() => true).catch(() => false);
}

async function maybeNormalizeAfterExpiry(guild, client) {
    const config = getAntiRaidConfig(guild.id);
    if (!isPanicExpired(config)) return false;

    updateAntiRaidConfig(guild.id, {
        currentLevel: config.baseLevel,
        panicUntil: null,
        panicReason: null
    });

    const embed = createLogEmbed({
        title: '🟢 Anti-Raid Normalizado',
        color: 0x57F287,
        description: 'El modo Panic expiro y el servidor volvio a su nivel base automaticamente.',
        fields: [
            { name: 'Nivel base', value: getLevelLabel(config.baseLevel), inline: true },
            { name: 'Motivo previo', value: truncate(config.panicReason || 'No especificado', 100), inline: true }
        ]
    });

    await sendLog(guild, { embeds: [embed] }, client);
    return true;
}

async function logMessageIncident(message, client, detection, actions) {
    const embed = createLogEmbed({
        title: '🛡️ Anti-Raid: mensaje sospechoso',
        color: detection.level >= ANTI_RAID_LEVELS.CONTAIN ? 0xED4245 : 0xFEE75C,
        description: `Se detecto **${detection.label}** y el sistema intervino en ${message.channel}.`,
        fields: [
            { name: 'Usuario', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Nivel actual', value: getLevelLabel(detection.level), inline: true },
            { name: 'Acciones', value: createActionSummary(actions), inline: false },
            { name: 'Detalle', value: detection.reason, inline: false },
            { name: 'Mensaje', value: truncate(message.content || '[sin texto]', 250), inline: false }
        ]
    });

    await sendLog(message.guild, { embeds: [embed] }, client);
}

async function logJoinIncident(member, client, details) {
    const embed = createLogEmbed({
        title: '🚨 Anti-Raid: actividad de entradas',
        color: details.severity === 'danger' ? 0xED4245 : 0xFEE75C,
        description: details.description,
        fields: [
            { name: 'Ultimo miembro', value: `${member.user.tag} (${member.id})`, inline: true },
            { name: 'Nivel actual', value: getLevelLabel(details.level), inline: true },
            { name: 'Cuenta nueva', value: details.isSuspicious ? 'Si' : 'No', inline: true },
            { name: 'Entradas detectadas', value: `${details.count} en ${details.windowSeconds}s`, inline: true },
            { name: 'Edad de cuenta', value: details.accountAgeText, inline: true },
            { name: 'Acciones', value: createActionSummary(details.actions), inline: false }
        ]
    });

    await sendLog(member.guild, { embeds: [embed] }, client);
}

function buildMessageDetection(message, config, history) {
    const level = config.currentLevel;
    const mentionCount = countMentions(message);
    const mentionThreshold = getStrictThreshold(config.mentionSpam.maxMentions, config);
    const latestTimestamp = history[history.length - 1]?.timestamp || getNow();

    if (config.mentionSpam.enabled) {
        if (config.mentionSpam.blockEveryone && message.mentions.everyone) {
            return {
                type: 'mention_everyone',
                label: 'mencion masiva',
                level,
                reason: 'Se detecto una mencion a @everyone/@here bloqueada por la configuracion del anti-raid.',
                timeoutMinutes: config.mentionSpam.timeoutMinutes,
                cleanupWindowSeconds: Math.max(10, config.messageSpam.intervalSeconds)
            };
        }

        if (mentionCount >= mentionThreshold) {
            return {
                type: 'mention_spam',
                label: 'spam de menciones',
                level,
                reason: `El mensaje contiene ${mentionCount} menciones y el limite actual es ${mentionThreshold}.`,
                timeoutMinutes: config.mentionSpam.timeoutMinutes,
                cleanupWindowSeconds: Math.max(10, config.messageSpam.intervalSeconds)
            };
        }
    }

    if (config.duplicateSpam.enabled) {
        const normalizedContent = getNormalizedContent(message);
        if (normalizedContent) {
            const duplicateWindowMs = config.duplicateSpam.intervalSeconds * 1000;
            const duplicates = history.filter(entry => entry.normalizedContent === normalizedContent && (history[history.length - 1].timestamp - entry.timestamp) <= duplicateWindowMs);
            const duplicateThreshold = getStrictThreshold(config.duplicateSpam.maxDuplicates, config);

            if (duplicates.length >= duplicateThreshold) {
                return {
                    type: 'duplicate_spam',
                    label: 'mensajes duplicados',
                    level,
                    reason: `Se repitio el mismo contenido ${duplicates.length} veces en ${config.duplicateSpam.intervalSeconds}s.`,
                    timeoutMinutes: config.duplicateSpam.timeoutMinutes,
                    cleanupWindowSeconds: config.duplicateSpam.intervalSeconds
                };
            }
        }
    }

    if (config.messageSpam.enabled) {
        const messageThreshold = getStrictThreshold(config.messageSpam.maxMessages, config);
        const recentMessages = history.filter(entry => (latestTimestamp - entry.timestamp) <= (config.messageSpam.intervalSeconds * 1000));

        if (recentMessages.length >= messageThreshold) {
            return {
                type: 'message_spam',
                label: 'flood de mensajes',
                level,
                reason: `Se enviaron ${recentMessages.length} mensajes en ${config.messageSpam.intervalSeconds}s y el limite es ${messageThreshold}.`,
                timeoutMinutes: config.messageSpam.timeoutMinutes,
                cleanupWindowSeconds: config.messageSpam.intervalSeconds
            };
        }
    }

    return null;
}

export async function handleMessageCreateAntiRaid(message, client) {
    const config = getSyncedAntiRaidConfig(message.guild.id);
    if (!config.enabled || config.currentLevel === ANTI_RAID_LEVELS.OFF) {
        return { blocked: false };
    }

    if (isExemptMember(message.member, config, message.channel.id)) {
        return { blocked: false };
    }

    const maxWindowSeconds = Math.max(
        config.messageSpam.intervalSeconds,
        config.duplicateSpam.intervalSeconds,
        config.mentionSpam.enabled ? config.messageSpam.intervalSeconds : 0
    );

    const now = getNow();
    const record = {
        timestamp: now,
        normalizedContent: getNormalizedContent(message)
    };

    const previousHistory = cleanupList(getUserHistory(message.guild.id, message.author.id), maxWindowSeconds * 1000, now);
    const nextHistory = [...previousHistory, record];
    setUserHistory(message.guild.id, message.author.id, nextHistory);

    const detection = buildMessageDetection(message, config, nextHistory);
    if (!detection) {
        return { blocked: false };
    }

    const incidentKey = `${message.guild.id}:${message.author.id}:${detection.type}`;
    const isRepeatedIncident = shouldThrottleIncident(incidentKey, 15 * 1000);
    const actions = [];

    if (config.currentLevel >= ANTI_RAID_LEVELS.CLEAN) {
        const deletedCount = await deleteRecentMessages(message, detection.cleanupWindowSeconds);
        actions.push(deletedCount > 0 ? `Borrados ${deletedCount} mensaje(s)` : 'No se pudieron borrar mensajes');
    }

    if (config.currentLevel >= ANTI_RAID_LEVELS.CONTAIN && !isRepeatedIncident) {
        const timeoutApplied = await applyTimeout(message.member, detection.timeoutMinutes, `[AntiRaid] ${detection.label}`);
        actions.push(timeoutApplied ? `Timeout de ${formatDuration(detection.timeoutMinutes)}` : 'No se pudo aplicar timeout');
    }

    if (!isRepeatedIncident) {
        await logMessageIncident(message, client, detection, actions);
    }

    return { blocked: config.currentLevel >= ANTI_RAID_LEVELS.CLEAN };
}

function getAccountAgeText(member) {
    const ageMs = getNow() - member.user.createdTimestamp;
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

    if (ageDays >= 1) {
        return `${ageDays} dia(s)`;
    }

    const ageHours = Math.max(1, Math.floor(ageMs / (60 * 60 * 1000)));
    return `${ageHours} hora(s)`;
}

function isSuspiciousAccount(member, config) {
    const ageMs = getNow() - member.user.createdTimestamp;
    return ageMs < (config.joinRaid.newAccountDays * 24 * 60 * 60 * 1000);
}

export async function activateAntiRaidPanic(guild, client, {
    reason = 'Actividad sospechosa detectada',
    durationMinutes,
    actorTag = 'Sistema',
    silent = false
} = {}) {
    const current = getSyncedAntiRaidConfig(guild.id);
    const minutes = durationMinutes || current.panic.autoNormalizeMinutes;
    const panicUntil = getNow() + (minutes * 60 * 1000);

    const updated = updateAntiRaidConfig(guild.id, {
        enabled: true,
        currentLevel: ANTI_RAID_LEVELS.PANIC,
        panicUntil,
        panicReason: reason
    });

    if (!silent) {
        const embed = createLogEmbed({
            title: '🔴 Anti-Raid: Panic activado',
            color: 0xED4245,
            description: 'El servidor entro temporalmente en nivel Panic.',
            fields: [
                { name: 'Activado por', value: actorTag, inline: true },
                { name: 'Duracion', value: formatDuration(minutes), inline: true },
                { name: 'Vence', value: formatAbsoluteTime(panicUntil), inline: false },
                { name: 'Motivo', value: truncate(reason, 200), inline: false }
            ]
        });

        await sendLog(guild, { embeds: [embed] }, client);
    }

    return updated;
}

export async function normalizeAntiRaidLevel(guild, client, {
    reason = 'Normalizacion manual',
    actorTag = 'Sistema',
    silent = false
} = {}) {
    const current = getAntiRaidConfig(guild.id);
    const targetLevel = current.enabled ? current.baseLevel : ANTI_RAID_LEVELS.OFF;

    const updated = updateAntiRaidConfig(guild.id, {
        currentLevel: targetLevel,
        panicUntil: null,
        panicReason: null
    });

    if (!silent) {
        const embed = createLogEmbed({
            title: '🟢 Anti-Raid: retorno al nivel base',
            color: 0x57F287,
            description: 'El servidor salio del estado Panic y regreso a su nivel base.',
            fields: [
                { name: 'Solicitado por', value: actorTag, inline: true },
                { name: 'Nuevo nivel', value: getLevelLabel(targetLevel), inline: true },
                { name: 'Motivo', value: truncate(reason, 200), inline: false }
            ]
        });

        await sendLog(guild, { embeds: [embed] }, client);
    }

    return updated;
}

export async function handleGuildMemberAddAntiRaid(member, client) {
    const initialConfig = getSyncedAntiRaidConfig(member.guild.id);
    if (!initialConfig.enabled || initialConfig.currentLevel === ANTI_RAID_LEVELS.OFF || !initialConfig.joinRaid.enabled) {
        return { suppressWelcome: false };
    }

    const now = getNow();
    const maxWindowSeconds = Math.max(initialConfig.joinRaid.intervalSeconds, 60);
    const joinHistory = cleanupList(getJoinHistory(member.guild.id), maxWindowSeconds * 1000, now);
    joinHistory.push({ timestamp: now, userId: member.id });
    setJoinHistory(member.guild.id, joinHistory);
    const raidWindowEntries = joinHistory.filter(entry => (now - entry.timestamp) <= (initialConfig.joinRaid.intervalSeconds * 1000));

    const warningThreshold = getStrictThreshold(initialConfig.joinRaid.warningJoins, initialConfig);
    const dangerThreshold = getStrictThreshold(initialConfig.joinRaid.dangerJoins, initialConfig);
    const joinCount = raidWindowEntries.length;
    const suspiciousAccount = isSuspiciousAccount(member, initialConfig);
    const accountAgeText = getAccountAgeText(member);
    const actions = [];
    let severity = null;

    if (joinCount >= dangerThreshold) {
        severity = 'danger';
    } else if (joinCount >= warningThreshold) {
        severity = 'warning';
    }

    let config = initialConfig;
    if (
        severity === 'danger' &&
        config.panic.autoActivateOnDanger &&
        config.currentLevel !== ANTI_RAID_LEVELS.PANIC
    ) {
        config = await activateAntiRaidPanic(member.guild, client, {
            reason: `Se detectaron ${joinCount} entradas en ${config.joinRaid.intervalSeconds}s`,
            durationMinutes: config.panic.autoNormalizeMinutes,
            actorTag: 'Sistema Anti-Raid',
            silent: true
        });

        actions.push(`Panic activado por ${config.panic.autoNormalizeMinutes} minuto(s)`);
    }

    if ((severity || config.currentLevel === ANTI_RAID_LEVELS.PANIC) && suspiciousAccount && config.currentLevel >= ANTI_RAID_LEVELS.CONTAIN) {
        const timeoutApplied = await applyTimeout(
            member,
            config.joinRaid.suspiciousTimeoutMinutes,
            '[AntiRaid] Cuenta nueva durante actividad sospechosa'
        );

        if (timeoutApplied) {
            actions.push(`Cuenta nueva contenida con timeout de ${formatDuration(config.joinRaid.suspiciousTimeoutMinutes)}`);
        }
    }

    const shouldLogRaid = severity && !shouldThrottleIncident(`${member.guild.id}:join:${severity}`, severity === 'danger' ? 15000 : 20000);
    const shouldLogSuspiciousAction = actions.length > 0;

    if (shouldLogRaid || shouldLogSuspiciousAction) {
        await logJoinIncident(member, client, {
            severity: severity || 'warning',
            description: severity === 'danger'
                ? 'Se detecto un pico fuerte de entradas y el servidor esta bajo observacion.'
                : 'Se detecto una oleada de entradas inusual.',
            level: config.currentLevel,
            isSuspicious: suspiciousAccount,
            count: joinCount,
            windowSeconds: config.joinRaid.intervalSeconds,
            accountAgeText,
            actions
        });
    }

    return {
        suppressWelcome: Boolean(severity || shouldLogSuspiciousAction)
    };
}

function createAntiRaidPanelEmbed(guildId) {
    const config = getAntiRaidStatusSummary(guildId);
    const level = config.enabled ? config.currentLevel : ANTI_RAID_LEVELS.OFF;

    return new EmbedBuilder()
        .setColor(getLevelColor(level))
        .setTitle('🛡️ Centro Anti-Raid')
        .setDescription('Control rapido del sistema anti-raid. Usa el dashboard para ajustes mas extensos y este panel para operar en vivo.')
        .addFields(
            { name: 'Estado', value: config.enabled ? '✅ Activado' : '⛔ Apagado', inline: true },
            { name: 'Nivel actual', value: config.effectiveLevelLabel, inline: true },
            { name: 'Nivel base', value: config.baseLevelLabel, inline: true },
            { name: 'Panic', value: level === ANTI_RAID_LEVELS.PANIC ? `🔴 Activo hasta ${config.panicUntilText}\nQueda ${config.panicRemainingText}` : '🟢 No activo', inline: false },
            { name: 'Mensajes', value: `Flood: ${config.messageSpam.enabled ? `${config.messageSpam.maxMessages}/${config.messageSpam.intervalSeconds}s` : 'off'} · Dup: ${config.duplicateSpam.enabled ? `${config.duplicateSpam.maxDuplicates}/${config.duplicateSpam.intervalSeconds}s` : 'off'} · Ment: ${config.mentionSpam.enabled ? `${config.mentionSpam.maxMentions}` : 'off'}`, inline: false },
            { name: 'Joins', value: `${config.joinRaid.enabled ? `${config.joinRaid.warningJoins}/${config.joinRaid.dangerJoins} en ${config.joinRaid.intervalSeconds}s` : 'off'} · Cuentas nuevas: ${config.joinRaid.newAccountDays}d · timeout ${config.joinRaid.suspiciousTimeoutMinutes}m`, inline: false },
            { name: 'Whitelist', value: `Usuarios: ${config.whitelistUserIds.length} · Roles: ${config.whitelistRoleIds.length} · Canales: ${config.whitelistChannelIds.length}`, inline: false }
        )
        .setFooter({ text: 'Toggle, Panic, presets y modales de ajuste rapido.' })
        .setTimestamp();
}

function createAntiRaidPanelComponents(guildId) {
    const config = getAntiRaidStatusSummary(guildId);
    const rows = [];

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(ANTI_RAID_PANEL_IDS.toggle)
                .setLabel(config.enabled ? 'Desactivar' : 'Activar')
                .setStyle(config.enabled ? ButtonStyle.Secondary : ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(ANTI_RAID_PANEL_IDS.panic)
                .setLabel('Panic')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(ANTI_RAID_PANEL_IDS.normalize)
                .setLabel('Normalizar')
                .setStyle(ButtonStyle.Success)
                .setDisabled(!config.enabled || config.currentLevel !== ANTI_RAID_LEVELS.PANIC),
            new ButtonBuilder()
                .setCustomId(ANTI_RAID_PANEL_IDS.refresh)
                .setLabel('Actualizar')
                .setStyle(ButtonStyle.Secondary)
        )
    );

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.flood).setLabel('Flood').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.mentions).setLabel('Menciones').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.joins).setLabel('Joins').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelist).setLabel('Whitelist').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.presets).setLabel('Presets').setStyle(ButtonStyle.Secondary)
        )
    );

    rows.push(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(ANTI_RAID_PANEL_IDS.baseLevel)
                .setPlaceholder(`Nivel base actual: ${config.baseLevelLabel}`)
                .addOptions([
                    { label: 'Monitor', value: 'monitor', description: 'Solo registra eventos' },
                    { label: 'Clean', value: 'clean', description: 'Limpia mensajes sospechosos' },
                    { label: 'Contain', value: 'contain', description: 'Limpia y aplica timeout' }
                ])
        )
    );

    const baseUrl = process.env.BASE_URL?.trim();
    if (baseUrl) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Abrir Dashboard')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${baseUrl.replace(/\/$/, '')}/dashboard`)
            )
        );
    }

    return rows;
}

export function createAntiRaidPanelPayload(guild) {
    return {
        embeds: [createAntiRaidPanelEmbed(guild.id)],
        components: createAntiRaidPanelComponents(guild.id)
    };
}

export async function publishAntiRaidPanel(guild, channel) {
    const payload = createAntiRaidPanelPayload(guild);
    const config = getSyncedAntiRaidConfig(guild.id);
    let message = null;

    if (config.panelChannelId && config.panelMessageId && config.panelChannelId === channel.id) {
        message = await channel.messages.fetch(config.panelMessageId).catch(() => null);
        if (message) {
            await message.edit(payload);
        }
    }

    if (!message) {
        message = await channel.send(payload);
    }

    updateAntiRaidConfig(guild.id, {
        panelChannelId: channel.id,
        panelMessageId: message.id
    });

    return message;
}

export async function refreshAntiRaidPanelMessage(guild) {
    const config = getSyncedAntiRaidConfig(guild.id);
    if (!config.panelChannelId || !config.panelMessageId) {
        return false;
    }

    const channel = guild.channels.cache.get(config.panelChannelId) || await guild.channels.fetch(config.panelChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
        return false;
    }

    const message = await channel.messages.fetch(config.panelMessageId).catch(() => null);
    if (!message) {
        updateAntiRaidConfig(guild.id, {
            panelChannelId: null,
            panelMessageId: null
        });
        return false;
    }

    await message.edit(createAntiRaidPanelPayload(guild)).catch(() => null);
    return true;
}

function createWhitelistSummaryEmbed(guildId) {
    const config = getAntiRaidStatusSummary(guildId);
    const users = config.whitelistUserIds.length ? config.whitelistUserIds.map(id => `<@${id}>`).join(', ') : 'Ninguno';
    const roles = config.whitelistRoleIds.length ? config.whitelistRoleIds.map(id => `<@&${id}>`).join(', ') : 'Ninguno';
    const channels = config.whitelistChannelIds.length ? config.whitelistChannelIds.map(id => `<#${id}>`).join(', ') : 'Ninguno';

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📋 Whitelist Anti-Raid')
        .setDescription('Gestiona exclusiones de usuarios, roles y canales sin salir de Discord.')
        .addFields(
            { name: `Usuarios (${config.whitelistUserIds.length})`, value: truncate(users, 1000), inline: false },
            { name: `Roles (${config.whitelistRoleIds.length})`, value: truncate(roles, 1000), inline: false },
            { name: `Canales (${config.whitelistChannelIds.length})`, value: truncate(channels, 1000), inline: false }
        )
        .setTimestamp();
}

function createWhitelistHomeComponents() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistAddUser).setLabel('Añadir usuario').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistRemoveUser).setLabel('Quitar usuario').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistAddRole).setLabel('Añadir rol').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistRemoveRole).setLabel('Quitar rol').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistView).setLabel('Ver').setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistAddChannel).setLabel('Añadir canal').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistRemoveChannel).setLabel('Quitar canal').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(ANTI_RAID_PANEL_IDS.whitelistHome).setLabel('Refrescar').setStyle(ButtonStyle.Secondary)
        )
    ];
}

function createPresetSelectorPayload() {
    return {
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🎛️ Presets Anti-Raid')
                .setDescription('Aplica una configuracion base y luego retocala si hace falta.')
        ],
        components: [
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(ANTI_RAID_PANEL_IDS.presetSelect)
                    .setPlaceholder('Selecciona un preset')
                    .addOptions(
                        Object.entries(ANTI_RAID_PRESETS).map(([value, preset]) => ({
                            label: preset.label,
                            value,
                            description: preset.description
                        }))
                    )
            )
        ]
    };
}

function createWhitelistSelectPayload(kind, action) {
    if (kind === 'user') {
        return {
            embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(action === 'add' ? 'Añadir usuarios a la whitelist' : 'Quitar usuarios de la whitelist')],
            components: [
                new ActionRowBuilder().addComponents(
                    new UserSelectMenuBuilder()
                        .setCustomId(action === 'add' ? ANTI_RAID_PANEL_IDS.whitelistUserAddSelect : ANTI_RAID_PANEL_IDS.whitelistUserRemoveSelect)
                        .setPlaceholder(action === 'add' ? 'Selecciona usuarios' : 'Selecciona usuarios a quitar')
                        .setMinValues(1)
                        .setMaxValues(10)
                )
            ]
        };
    }

    if (kind === 'role') {
        return {
            embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(action === 'add' ? 'Añadir roles a la whitelist' : 'Quitar roles de la whitelist')],
            components: [
                new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId(action === 'add' ? ANTI_RAID_PANEL_IDS.whitelistRoleAddSelect : ANTI_RAID_PANEL_IDS.whitelistRoleRemoveSelect)
                        .setPlaceholder(action === 'add' ? 'Selecciona roles' : 'Selecciona roles a quitar')
                        .setMinValues(1)
                        .setMaxValues(10)
                )
            ]
        };
    }

    return {
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(action === 'add' ? 'Añadir canales a la whitelist' : 'Quitar canales de la whitelist')],
        components: [
            new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId(action === 'add' ? ANTI_RAID_PANEL_IDS.whitelistChannelAddSelect : ANTI_RAID_PANEL_IDS.whitelistChannelRemoveSelect)
                    .setPlaceholder(action === 'add' ? 'Selecciona canales' : 'Selecciona canales a quitar')
                    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread, ChannelType.PrivateThread)
                    .setMinValues(1)
                    .setMaxValues(10)
            )
        ]
    };
}

function createPanelActionModal(customId, title, fields) {
    const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
    const rows = fields.map(field =>
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId(field.id)
                .setLabel(field.label)
                .setPlaceholder(field.placeholder || '')
                .setRequired(field.required !== false)
                .setStyle(field.style || TextInputStyle.Short)
                .setValue(field.value || '')
        )
    );

    modal.addComponents(...rows);
    return modal;
}

async function respondNoAccess(interaction) {
    const payload = { content: '❌ No tienes permisos para usar este panel.', flags: 64 };
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload).catch(() => {});
    }
    return interaction.reply(payload).catch(() => {});
}

function applyWhitelistIds(guildId, key, ids, action) {
    const config = getSyncedAntiRaidConfig(guildId);
    const current = [...config[key]];
    let next;

    if (action === 'add') {
        next = [...new Set([...current, ...ids])];
    } else {
        next = current.filter(id => !ids.includes(id));
    }

    return updateAntiRaidConfig(guildId, {
        [key]: next
    });
}

async function updateWhitelistInteraction(interaction, client, {
    key,
    ids,
    action,
    label
}) {
    const updated = applyWhitelistIds(interaction.guild.id, key, ids, action);
    await refreshAntiRaidPanelMessage(interaction.guild);
    await logAntiRaidAdminAction(interaction.guild, client, {
        title: '🧩 Whitelist Anti-Raid actualizada',
        description: `${action === 'add' ? 'Se añadieron' : 'Se quitaron'} ${label} desde el panel interactivo.`,
        actorTag: interaction.user.tag
    });

    return interaction.update({
        embeds: [createWhitelistSummaryEmbed(interaction.guild.id)],
        components: createWhitelistHomeComponents()
    }).catch(async () => {
        await interaction.reply({
            content: `✅ Whitelist actualizada. Ahora hay ${updated[key].length} elemento(s) en ${label}.`,
            flags: 64
        }).catch(() => {});
    });
}

export async function handleAntiRaidButton(interaction, client) {
    if (!interaction.customId.startsWith('antiRaid:')) return false;
    if (!hasAntiRaidAccess(interaction.member)) {
        await respondNoAccess(interaction);
        return true;
    }

    const config = getAntiRaidStatusSummary(interaction.guild.id);

    if (interaction.customId === ANTI_RAID_PANEL_IDS.toggle) {
        const updated = updateAntiRaidConfig(interaction.guild.id, {
            enabled: !config.enabled,
            currentLevel: !config.enabled ? config.baseLevel : ANTI_RAID_LEVELS.OFF,
            panicUntil: !config.enabled ? config.panicUntil : null,
            panicReason: !config.enabled ? config.panicReason : null
        });

        await refreshAntiRaidPanelMessage(interaction.guild);
        await logAntiRaidAdminAction(interaction.guild, client, {
            title: updated.enabled ? '✅ Anti-Raid activado' : '⛔ Anti-Raid desactivado',
            description: 'El estado del sistema se cambio desde el panel interactivo.',
            actorTag: interaction.user.tag
        });
        await interaction.reply({ content: `✅ Anti-Raid ${updated.enabled ? 'activado' : 'desactivado'}.`, flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.panic) {
        const current = getAntiRaidStatusSummary(interaction.guild.id);
        const modal = createPanelActionModal(ANTI_RAID_PANEL_IDS.panicModal, 'Activar Panic', [
            { id: 'reason', label: 'Motivo', placeholder: 'Raid activo, ola de joins, spam coordinado...', value: current.panicReason || '' },
            { id: 'minutes', label: 'Duracion en minutos', placeholder: String(current.panic.autoNormalizeMinutes), value: String(current.panic.autoNormalizeMinutes) }
        ]);
        await interaction.showModal(modal);
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.normalize) {
        await normalizeAntiRaidLevel(interaction.guild, client, {
            reason: `Normalizado desde panel por ${interaction.user.tag}`,
            actorTag: interaction.user.tag
        });
        await refreshAntiRaidPanelMessage(interaction.guild);
        await interaction.reply({ content: '🟢 El sistema volvio al nivel base.', flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.refresh) {
        await refreshAntiRaidPanelMessage(interaction.guild);
        await interaction.reply({ content: '🔄 Panel anti-raid actualizado.', flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.flood) {
        const modal = createPanelActionModal(ANTI_RAID_PANEL_IDS.floodModal, 'Configurar Flood', [
            { id: 'enabled', label: 'Flood activo (true/false)', value: String(config.messageSpam.enabled) },
            { id: 'maxMessages', label: 'Max mensajes', value: String(config.messageSpam.maxMessages) },
            { id: 'intervalSeconds', label: 'Ventana en segundos', value: String(config.messageSpam.intervalSeconds) },
            { id: 'timeoutMinutes', label: 'Timeout flood en minutos', value: String(config.messageSpam.timeoutMinutes) },
            { id: 'duplicatePack', label: 'Duplicados max|ventana|timeout', placeholder: '3|15|15', value: `${config.duplicateSpam.maxDuplicates}|${config.duplicateSpam.intervalSeconds}|${config.duplicateSpam.timeoutMinutes}` }
        ]);
        await interaction.showModal(modal);
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.mentions) {
        const modal = createPanelActionModal(ANTI_RAID_PANEL_IDS.mentionsModal, 'Configurar Menciones', [
            { id: 'enabled', label: 'Menciones activas (true/false)', value: String(config.mentionSpam.enabled) },
            { id: 'maxMentions', label: 'Max menciones', value: String(config.mentionSpam.maxMentions) },
            { id: 'timeoutMinutes', label: 'Timeout menciones', value: String(config.mentionSpam.timeoutMinutes) },
            { id: 'blockEveryone', label: 'Bloquear everyone/here (true/false)', value: String(config.mentionSpam.blockEveryone) }
        ]);
        await interaction.showModal(modal);
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.joins) {
        const modal = createPanelActionModal(ANTI_RAID_PANEL_IDS.joinsModal, 'Configurar Joins', [
            { id: 'enabled', label: 'Join raid activo (true/false)', value: String(config.joinRaid.enabled) },
            { id: 'warningJoins', label: 'Joins de alerta', value: String(config.joinRaid.warningJoins) },
            { id: 'dangerJoins', label: 'Joins para Panic', value: String(config.joinRaid.dangerJoins) },
            { id: 'intervalSeconds', label: 'Ventana joins en segundos', value: String(config.joinRaid.intervalSeconds) },
            { id: 'advanced', label: 'Dias|timeout|panicMin|strict|autoPanic', placeholder: '7|30|15|70|true', value: `${config.joinRaid.newAccountDays}|${config.joinRaid.suspiciousTimeoutMinutes}|${config.panic.autoNormalizeMinutes}|${config.panic.messageMultiplierPercent}|${config.panic.autoActivateOnDanger}` }
        ]);
        await interaction.showModal(modal);
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelist || interaction.customId === ANTI_RAID_PANEL_IDS.whitelistHome || interaction.customId === ANTI_RAID_PANEL_IDS.whitelistView) {
        const payload = {
            embeds: [createWhitelistSummaryEmbed(interaction.guild.id)],
            components: createWhitelistHomeComponents(),
            flags: 64
        };

        if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelist) {
            await interaction.reply(payload).catch(() => {});
        } else {
            await interaction.update(payload).catch(() => {});
        }
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.presets) {
        await interaction.reply({
            ...createPresetSelectorPayload(),
            flags: 64
        }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistAddUser) {
        await interaction.update(createWhitelistSelectPayload('user', 'add')).catch(() => {});
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistRemoveUser) {
        await interaction.update(createWhitelistSelectPayload('user', 'remove')).catch(() => {});
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistAddRole) {
        await interaction.update(createWhitelistSelectPayload('role', 'add')).catch(() => {});
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistRemoveRole) {
        await interaction.update(createWhitelistSelectPayload('role', 'remove')).catch(() => {});
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistAddChannel) {
        await interaction.update(createWhitelistSelectPayload('channel', 'add')).catch(() => {});
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistRemoveChannel) {
        await interaction.update(createWhitelistSelectPayload('channel', 'remove')).catch(() => {});
        return true;
    }

    return true;
}

export async function handleAntiRaidSelect(interaction, client) {
    if (!interaction.customId.startsWith('antiRaid:')) return false;
    if (!hasAntiRaidAccess(interaction.member)) {
        await respondNoAccess(interaction);
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.baseLevel) {
        const levelValue = getAntiRaidLevelValue(interaction.values[0], { allowOff: false, allowPanic: false });
        if (!levelValue) {
            await interaction.reply({ content: '❌ Nivel no valido.', flags: 64 }).catch(() => {});
            return true;
        }

        const current = getSyncedAntiRaidConfig(interaction.guild.id);
        updateAntiRaidConfig(interaction.guild.id, {
            baseLevel: levelValue,
            currentLevel: current.currentLevel === ANTI_RAID_LEVELS.PANIC ? ANTI_RAID_LEVELS.PANIC : levelValue
        });

        await refreshAntiRaidPanelMessage(interaction.guild);
        await logAntiRaidAdminAction(interaction.guild, client, {
            title: '🎚️ Nivel base actualizado',
            description: `El nivel base se cambio a ${getLevelLabel(levelValue)} desde el panel.`,
            actorTag: interaction.user.tag
        });
        await interaction.reply({ content: `✅ Nivel base: ${getLevelLabel(levelValue)}.`, flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.presetSelect) {
        const preset = ANTI_RAID_PRESETS[interaction.values[0]];
        if (!preset) {
            await interaction.reply({ content: '❌ Preset no valido.', flags: 64 }).catch(() => {});
            return true;
        }

        updateAntiRaidConfig(interaction.guild.id, preset.updates);
        await refreshAntiRaidPanelMessage(interaction.guild);
        await logAntiRaidAdminAction(interaction.guild, client, {
            title: '🎛️ Preset Anti-Raid aplicado',
            description: `Se aplico el preset **${preset.label}** desde el panel.`,
            actorTag: interaction.user.tag
        });
        await interaction.update({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('✅ Preset aplicado')
                    .setDescription(`Se aplico **${preset.label}**. El panel principal ya fue refrescado.`)
            ],
            components: []
        }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistUserAddSelect) {
        await updateWhitelistInteraction(interaction, client, {
            key: 'whitelistUserIds',
            ids: interaction.values,
            action: 'add',
            label: 'usuarios'
        });
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistUserRemoveSelect) {
        await updateWhitelistInteraction(interaction, client, {
            key: 'whitelistUserIds',
            ids: interaction.values,
            action: 'remove',
            label: 'usuarios'
        });
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistRoleAddSelect) {
        await updateWhitelistInteraction(interaction, client, {
            key: 'whitelistRoleIds',
            ids: interaction.values,
            action: 'add',
            label: 'roles'
        });
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistRoleRemoveSelect) {
        await updateWhitelistInteraction(interaction, client, {
            key: 'whitelistRoleIds',
            ids: interaction.values,
            action: 'remove',
            label: 'roles'
        });
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistChannelAddSelect) {
        await updateWhitelistInteraction(interaction, client, {
            key: 'whitelistChannelIds',
            ids: interaction.values,
            action: 'add',
            label: 'canales'
        });
        return true;
    }
    if (interaction.customId === ANTI_RAID_PANEL_IDS.whitelistChannelRemoveSelect) {
        await updateWhitelistInteraction(interaction, client, {
            key: 'whitelistChannelIds',
            ids: interaction.values,
            action: 'remove',
            label: 'canales'
        });
        return true;
    }

    return true;
}

export async function handleAntiRaidModal(interaction, client) {
    if (!interaction.customId.startsWith('antiRaid:')) return false;
    if (!hasAntiRaidAccess(interaction.member)) {
        await respondNoAccess(interaction);
        return true;
    }

    const fields = interaction.fields;

    if (interaction.customId === ANTI_RAID_PANEL_IDS.panicModal) {
        const current = getAntiRaidStatusSummary(interaction.guild.id);
        const reason = truncate(fields.getTextInputValue('reason') || `Panic activado por ${interaction.user.tag}`, 200);
        const minutes = parseIntegerInput(fields.getTextInputValue('minutes'), 1, 1440, current.panic.autoNormalizeMinutes);

        await activateAntiRaidPanic(interaction.guild, client, {
            reason,
            durationMinutes: minutes,
            actorTag: interaction.user.tag
        });
        await refreshAntiRaidPanelMessage(interaction.guild);
        await interaction.reply({ content: `🚨 Panic activado por ${minutes} minuto(s).`, flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.floodModal) {
        const current = getAntiRaidStatusSummary(interaction.guild.id);
        const [dupMaxRaw, dupWindowRaw, dupTimeoutRaw] = String(fields.getTextInputValue('duplicatePack') || '').split('|');

        updateAntiRaidConfig(interaction.guild.id, {
            messageSpam: {
                enabled: parseBooleanInput(fields.getTextInputValue('enabled'), current.messageSpam.enabled),
                maxMessages: parseIntegerInput(fields.getTextInputValue('maxMessages'), 3, 20, current.messageSpam.maxMessages),
                intervalSeconds: parseIntegerInput(fields.getTextInputValue('intervalSeconds'), 3, 60, current.messageSpam.intervalSeconds),
                timeoutMinutes: parseIntegerInput(fields.getTextInputValue('timeoutMinutes'), 1, 1440, current.messageSpam.timeoutMinutes)
            },
            duplicateSpam: {
                maxDuplicates: parseIntegerInput(dupMaxRaw, 2, 10, current.duplicateSpam.maxDuplicates),
                intervalSeconds: parseIntegerInput(dupWindowRaw, 5, 120, current.duplicateSpam.intervalSeconds),
                timeoutMinutes: parseIntegerInput(dupTimeoutRaw, 1, 1440, current.duplicateSpam.timeoutMinutes)
            }
        });

        await refreshAntiRaidPanelMessage(interaction.guild);
        await logAntiRaidAdminAction(interaction.guild, client, {
            title: '💬 Flood anti-raid actualizado',
            description: 'Se editaron umbrales de flood/duplicados desde el panel.',
            actorTag: interaction.user.tag
        });
        await interaction.reply({ content: '✅ Ajustes de flood actualizados.', flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.mentionsModal) {
        const current = getAntiRaidStatusSummary(interaction.guild.id);

        updateAntiRaidConfig(interaction.guild.id, {
            mentionSpam: {
                enabled: parseBooleanInput(fields.getTextInputValue('enabled'), current.mentionSpam.enabled),
                maxMentions: parseIntegerInput(fields.getTextInputValue('maxMentions'), 2, 20, current.mentionSpam.maxMentions),
                timeoutMinutes: parseIntegerInput(fields.getTextInputValue('timeoutMinutes'), 1, 1440, current.mentionSpam.timeoutMinutes),
                blockEveryone: parseBooleanInput(fields.getTextInputValue('blockEveryone'), current.mentionSpam.blockEveryone)
            }
        });

        await refreshAntiRaidPanelMessage(interaction.guild);
        await logAntiRaidAdminAction(interaction.guild, client, {
            title: '📣 Menciones anti-raid actualizadas',
            description: 'Se editaron umbrales de menciones desde el panel.',
            actorTag: interaction.user.tag
        });
        await interaction.reply({ content: '✅ Ajustes de menciones actualizados.', flags: 64 }).catch(() => {});
        return true;
    }

    if (interaction.customId === ANTI_RAID_PANEL_IDS.joinsModal) {
        const current = getAntiRaidStatusSummary(interaction.guild.id);
        const [daysRaw, timeoutRaw, panicMinutesRaw, strictRaw, autoPanicRaw] = String(fields.getTextInputValue('advanced') || '').split('|');

        updateAntiRaidConfig(interaction.guild.id, {
            joinRaid: {
                enabled: parseBooleanInput(fields.getTextInputValue('enabled'), current.joinRaid.enabled),
                warningJoins: parseIntegerInput(fields.getTextInputValue('warningJoins'), 3, 50, current.joinRaid.warningJoins),
                dangerJoins: parseIntegerInput(fields.getTextInputValue('dangerJoins'), 4, 100, current.joinRaid.dangerJoins),
                intervalSeconds: parseIntegerInput(fields.getTextInputValue('intervalSeconds'), 10, 300, current.joinRaid.intervalSeconds),
                newAccountDays: parseIntegerInput(daysRaw, 1, 90, current.joinRaid.newAccountDays),
                suspiciousTimeoutMinutes: parseIntegerInput(timeoutRaw, 1, 1440, current.joinRaid.suspiciousTimeoutMinutes)
            },
            panic: {
                autoNormalizeMinutes: parseIntegerInput(panicMinutesRaw, 1, 1440, current.panic.autoNormalizeMinutes),
                messageMultiplierPercent: parseIntegerInput(strictRaw, 30, 100, current.panic.messageMultiplierPercent),
                autoActivateOnDanger: parseBooleanInput(autoPanicRaw, current.panic.autoActivateOnDanger)
            }
        });

        await refreshAntiRaidPanelMessage(interaction.guild);
        await logAntiRaidAdminAction(interaction.guild, client, {
            title: '🚪 Join raid actualizado',
            description: 'Se editaron umbrales de joins y Panic desde el panel.',
            actorTag: interaction.user.tag
        });
        await interaction.reply({ content: '✅ Ajustes de joins actualizados.', flags: 64 }).catch(() => {});
        return true;
    }

    return true;
}

export function getAntiRaidStatusSummary(guildId) {
    const config = getAntiRaidStatus(guildId);

    return {
        ...config,
        panicRemainingText: config.panicUntil ? formatRemainingTime(config.panicUntil) : 'No activo',
        panicUntilText: config.panicUntil ? formatAbsoluteTime(config.panicUntil) : 'No activo'
    };
}

export function startAntiRaidWatcher(client) {
    if (runtimeState.watcher) return;

    runtimeState.watcher = setInterval(async () => {
        for (const guild of client.guilds.cache.values()) {
            await maybeNormalizeAfterExpiry(guild, client);
        }
    }, 30 * 1000);

    if (typeof runtimeState.watcher.unref === 'function') {
        runtimeState.watcher.unref();
    }
}
