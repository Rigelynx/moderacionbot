import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
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
