import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logWarning } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, '..', 'data', 'config.json');

let config = { guilds: {} };

function createDefaultTicketTypes() {
    return [
        {
            key: 'soporte',
            label: 'Soporte General',
            description: 'Ayuda tecnica, dudas y asistencia general.',
            emoji: '🛠️',
            priority: 'media',
            staffRoleId: null
        },
        {
            key: 'reporte',
            label: 'Reportar Usuario',
            description: 'Reportes, conflictos o infracciones importantes.',
            emoji: '🚨',
            priority: 'alta',
            staffRoleId: null
        },
        {
            key: 'compras',
            label: 'Compras y Rangos',
            description: 'Pagos, productos, suscripciones o rangos.',
            emoji: '💳',
            priority: 'media',
            staffRoleId: null
        }
    ];
}

function createDefaultTicketsConfig() {
    return {
        enabled: false,
        categoryId: null,
        roleId: null,
        logChannelId: null,
        panelChannelId: null,
        panelMessageId: null,
        maxOpenTickets: 1,
        namePrefix: 'ticket',
        panelTitle: 'Centro de Soporte',
        panelDescription: 'Pulsa el botón para abrir un ticket privado con el equipo de soporte.',
        panelButtonLabel: 'Abrir ticket',
        panelButtonEmoji: '🎫',
        welcomeMessage: 'Hola {user}, ya abrimos tu ticket {ticket}. Un miembro del staff te atenderá pronto.',
        mentionStaffOnOpen: true,
        closeReasonRequired: true,
        types: createDefaultTicketTypes()
    };
}

function createDefaultAppearanceConfig() {
    return {
        botDisplayName: '',
        botDescription: 'Panel personalizable para gestionar tu bot y tu servidor.',
        accentColor: '#5865F2',
        dashboardBackgroundUrl: null,
        profileBackgroundUrl: null
    };
}

function createDefaultVerificationConfig() {
    return {
        enabled: false,
        roleId: null,
        panelChannelId: null,
        panelMessageId: null,
        minAccountAgeDays: 0,
        panelTitle: 'Verificación del servidor',
        panelDescription: 'Pulsa el botón para abrir la verificación web y obtener acceso completo al servidor.',
        panelButtonLabel: 'Verificarme'
    };
}

function createDefaultAntiRaidConfig() {
    return {
        enabled: false,
        baseLevel: 1,
        currentLevel: 0,
        panicUntil: null,
        panicReason: null,
        panelChannelId: null,
        panelMessageId: null,
        whitelistUserIds: [],
        whitelistRoleIds: [],
        whitelistChannelIds: [],
        messageSpam: {
            enabled: true,
            maxMessages: 6,
            intervalSeconds: 8,
            timeoutMinutes: 10
        },
        duplicateSpam: {
            enabled: true,
            maxDuplicates: 3,
            intervalSeconds: 15,
            timeoutMinutes: 15
        },
        mentionSpam: {
            enabled: true,
            maxMentions: 5,
            blockEveryone: true,
            timeoutMinutes: 20
        },
        joinRaid: {
            enabled: true,
            warningJoins: 6,
            dangerJoins: 10,
            intervalSeconds: 30,
            newAccountDays: 7,
            suspiciousTimeoutMinutes: 30
        },
        panic: {
            autoActivateOnDanger: true,
            autoNormalizeMinutes: 15,
            messageMultiplierPercent: 70
        }
    };
}

function createDefaultAiConfig() {
    return {
        enabled: false,
        provider: 'openai',
        model: null,
        baseUrl: null,
        ticketMode: 'manual',
        moderationMode: 'assist',
        antiRaidMode: 'assist',
        maxRequestsPerHour: 100,
        logPrompts: false,
        apiKey: null,
        features: {
            ticketSummary: true,
            ticketReplyAssist: false,
            reportClassification: true,
            smartModeration: false,
            moderationExplanation: false,
            moderationIncidentSummary: false,
            smartAntiRaid: false,
            antiRaidIncidentSummary: true,
            fun8ball: true
        }
    };
}

export function createDefaultCommandPermissionRule() {
    return {
        enabled: true,
        allowedRoleIds: [],
        blockedRoleIds: [],
        allowedChannelIds: [],
        blockedChannelIds: []
    };
}

function normalizeIdList(value) {
    if (!Array.isArray(value)) return [];

    return [...new Set(
        value
            .map(item => String(item || '').trim())
            .filter(Boolean)
    )];
}

function normalizeCommandPermissionRule(rule = {}) {
    return {
        enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
        allowedRoleIds: normalizeIdList(rule.allowedRoleIds),
        blockedRoleIds: normalizeIdList(rule.blockedRoleIds),
        allowedChannelIds: normalizeIdList(rule.allowedChannelIds),
        blockedChannelIds: normalizeIdList(rule.blockedChannelIds)
    };
}

function clampInteger(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function normalizeAntiRaidConfig(section = {}) {
    const defaults = createDefaultAntiRaidConfig();
    const normalized = {
        enabled: typeof section.enabled === 'boolean' ? section.enabled : defaults.enabled,
        baseLevel: clampInteger(section.baseLevel, 1, 3, defaults.baseLevel),
        currentLevel: clampInteger(section.currentLevel, 0, 4, defaults.currentLevel),
        panicUntil: Number.isFinite(Number(section.panicUntil)) ? Number(section.panicUntil) : null,
        panicReason: typeof section.panicReason === 'string' && section.panicReason.trim()
            ? section.panicReason.trim().slice(0, 200)
            : null,
        panelChannelId: typeof section.panelChannelId === 'string' && section.panelChannelId.trim() ? section.panelChannelId.trim() : null,
        panelMessageId: typeof section.panelMessageId === 'string' && section.panelMessageId.trim() ? section.panelMessageId.trim() : null,
        whitelistUserIds: normalizeIdList(section.whitelistUserIds),
        whitelistRoleIds: normalizeIdList(section.whitelistRoleIds),
        whitelistChannelIds: normalizeIdList(section.whitelistChannelIds),
        messageSpam: {
            enabled: typeof section.messageSpam?.enabled === 'boolean' ? section.messageSpam.enabled : defaults.messageSpam.enabled,
            maxMessages: clampInteger(section.messageSpam?.maxMessages, 3, 20, defaults.messageSpam.maxMessages),
            intervalSeconds: clampInteger(section.messageSpam?.intervalSeconds, 3, 60, defaults.messageSpam.intervalSeconds),
            timeoutMinutes: clampInteger(section.messageSpam?.timeoutMinutes, 1, 1440, defaults.messageSpam.timeoutMinutes)
        },
        duplicateSpam: {
            enabled: typeof section.duplicateSpam?.enabled === 'boolean' ? section.duplicateSpam.enabled : defaults.duplicateSpam.enabled,
            maxDuplicates: clampInteger(section.duplicateSpam?.maxDuplicates, 2, 10, defaults.duplicateSpam.maxDuplicates),
            intervalSeconds: clampInteger(section.duplicateSpam?.intervalSeconds, 5, 120, defaults.duplicateSpam.intervalSeconds),
            timeoutMinutes: clampInteger(section.duplicateSpam?.timeoutMinutes, 1, 1440, defaults.duplicateSpam.timeoutMinutes)
        },
        mentionSpam: {
            enabled: typeof section.mentionSpam?.enabled === 'boolean' ? section.mentionSpam.enabled : defaults.mentionSpam.enabled,
            maxMentions: clampInteger(section.mentionSpam?.maxMentions, 2, 20, defaults.mentionSpam.maxMentions),
            blockEveryone: typeof section.mentionSpam?.blockEveryone === 'boolean' ? section.mentionSpam.blockEveryone : defaults.mentionSpam.blockEveryone,
            timeoutMinutes: clampInteger(section.mentionSpam?.timeoutMinutes, 1, 1440, defaults.mentionSpam.timeoutMinutes)
        },
        joinRaid: {
            enabled: typeof section.joinRaid?.enabled === 'boolean' ? section.joinRaid.enabled : defaults.joinRaid.enabled,
            warningJoins: clampInteger(section.joinRaid?.warningJoins, 3, 50, defaults.joinRaid.warningJoins),
            dangerJoins: clampInteger(section.joinRaid?.dangerJoins, 4, 100, defaults.joinRaid.dangerJoins),
            intervalSeconds: clampInteger(section.joinRaid?.intervalSeconds, 10, 300, defaults.joinRaid.intervalSeconds),
            newAccountDays: clampInteger(section.joinRaid?.newAccountDays, 1, 90, defaults.joinRaid.newAccountDays),
            suspiciousTimeoutMinutes: clampInteger(section.joinRaid?.suspiciousTimeoutMinutes, 1, 1440, defaults.joinRaid.suspiciousTimeoutMinutes)
        },
        panic: {
            autoActivateOnDanger: typeof section.panic?.autoActivateOnDanger === 'boolean' ? section.panic.autoActivateOnDanger : defaults.panic.autoActivateOnDanger,
            autoNormalizeMinutes: clampInteger(section.panic?.autoNormalizeMinutes, 1, 1440, defaults.panic.autoNormalizeMinutes),
            messageMultiplierPercent: clampInteger(section.panic?.messageMultiplierPercent, 30, 100, defaults.panic.messageMultiplierPercent)
        }
    };

    if (normalized.joinRaid.dangerJoins <= normalized.joinRaid.warningJoins) {
        normalized.joinRaid.dangerJoins = Math.min(100, normalized.joinRaid.warningJoins + 1);
    }

    if (!normalized.enabled) {
        normalized.currentLevel = 0;
        normalized.panicUntil = null;
        normalized.panicReason = null;
    } else if (normalized.panicUntil && normalized.currentLevel !== 4) {
        normalized.currentLevel = 4;
    } else if (!normalized.panicUntil && normalized.currentLevel === 4) {
        normalized.currentLevel = normalized.baseLevel;
    } else if (normalized.currentLevel === 0) {
        normalized.currentLevel = normalized.baseLevel;
    }

    return normalized;
}

function normalizeChoice(value, allowedValues, fallback) {
    return allowedValues.includes(value) ? value : fallback;
}

function normalizeAiConfig(section = {}) {
    const defaults = createDefaultAiConfig();
    const rawFeatures = section.features && typeof section.features === 'object' && !Array.isArray(section.features)
        ? section.features
        : {};
    const features = {};

    for (const [feature, defaultValue] of Object.entries(defaults.features)) {
        features[feature] = typeof rawFeatures[feature] === 'boolean' ? rawFeatures[feature] : defaultValue;
    }

    return {
        enabled: typeof section.enabled === 'boolean' ? section.enabled : defaults.enabled,
        provider: normalizeChoice(section.provider, ['openai', 'deepseek', 'gemini', 'claude', 'groq', 'mistral', 'openrouter', 'grok', 'custom'], defaults.provider),
        model: typeof section.model === 'string' && section.model.trim()
            ? section.model.trim().slice(0, 80)
            : defaults.model,
        baseUrl: typeof section.baseUrl === 'string' && section.baseUrl.trim()
            ? section.baseUrl.trim().replace(/\/+$/, '')
            : defaults.baseUrl,
        ticketMode: normalizeChoice(section.ticketMode, ['off', 'manual', 'auto'], defaults.ticketMode),
        moderationMode: normalizeChoice(section.moderationMode, ['off', 'monitor', 'assist', 'soft-action'], defaults.moderationMode),
        antiRaidMode: normalizeChoice(section.antiRaidMode, ['off', 'monitor', 'assist', 'adaptive'], defaults.antiRaidMode),
        maxRequestsPerHour: clampInteger(section.maxRequestsPerHour, 1, 1000, defaults.maxRequestsPerHour),
        logPrompts: typeof section.logPrompts === 'boolean' ? section.logPrompts : defaults.logPrompts,
        apiKey: typeof section.apiKey === 'string' && section.apiKey.trim() ? section.apiKey.trim() : defaults.apiKey,
        features
    };
}

function hasCustomCommandPermissionRule(rule) {
    if (!rule) return false;

    return (
        rule.enabled === false ||
        rule.allowedRoleIds.length > 0 ||
        rule.blockedRoleIds.length > 0 ||
        rule.allowedChannelIds.length > 0 ||
        rule.blockedChannelIds.length > 0
    );
}

function getGuildConfig(guildId) {
    if (!config.guilds[guildId]) {
        config.guilds[guildId] = {
            logs: {
                enabled: true,
                channelName: 'logs-moderacion'
            },
            welcome: {
                enabled: false,
                channelId: null,
                message: '¡Bienvenido/a {user} a **{server}**! Eres el miembro #{count} 🎉',
                backgroundUrl: null
            },
            goodbye: {
                enabled: false,
                channelId: null,
                message: '**{user}** ha abandonado **{server}**. Ahora somos {count} 😢',
                backgroundUrl: null
            },
            tickets: createDefaultTicketsConfig(),
            suggestions: {
                channelId: null
            },
            appearance: createDefaultAppearanceConfig(),
            verification: createDefaultVerificationConfig(),
            antiRaid: createDefaultAntiRaidConfig(),
            ai: createDefaultAiConfig(),
            commandPermissions: {}
        };
    }
    // Ensure welcome/goodbye exist on older configs
    if (!config.guilds[guildId].welcome) {
        config.guilds[guildId].welcome = {
            enabled: false,
            channelId: null,
            message: '¡Bienvenido/a {user} a **{server}**! Eres el miembro #{count} 🎉',
            backgroundUrl: null
        };
    }
    if (!config.guilds[guildId].goodbye) {
        config.guilds[guildId].goodbye = {
            enabled: false,
            channelId: null,
            message: '**{user}** ha abandonado **{server}**. Ahora somos {count} 😢',
            backgroundUrl: null
        };
    }
    config.guilds[guildId].tickets = {
        ...createDefaultTicketsConfig(),
        ...config.guilds[guildId].tickets
    };
    if (!config.guilds[guildId].suggestions) {
        config.guilds[guildId].suggestions = {
            channelId: null
        };
    }
    config.guilds[guildId].appearance = {
        ...createDefaultAppearanceConfig(),
        ...config.guilds[guildId].appearance
    };
    config.guilds[guildId].verification = {
        ...createDefaultVerificationConfig(),
        ...config.guilds[guildId].verification
    };
    config.guilds[guildId].antiRaid = normalizeAntiRaidConfig({
        ...createDefaultAntiRaidConfig(),
        ...config.guilds[guildId].antiRaid
    });
    config.guilds[guildId].ai = normalizeAiConfig({
        ...createDefaultAiConfig(),
        ...config.guilds[guildId].ai
    });
    if (!config.guilds[guildId].commandPermissions || typeof config.guilds[guildId].commandPermissions !== 'object' || Array.isArray(config.guilds[guildId].commandPermissions)) {
        config.guilds[guildId].commandPermissions = {};
    } else {
        const normalizedRules = {};
        for (const [commandName, rule] of Object.entries(config.guilds[guildId].commandPermissions)) {
            const normalizedRule = normalizeCommandPermissionRule(rule);
            if (hasCustomCommandPermissionRule(normalizedRule)) {
                normalizedRules[commandName] = normalizedRule;
            }
        }
        config.guilds[guildId].commandPermissions = normalizedRules;
    }
    return config.guilds[guildId];
}

export function loadConfig() {
    try {
        if (existsSync(configFile)) {
            const data = readFileSync(configFile, 'utf-8');
            const parsed = JSON.parse(data);
            // Migrar formato antiguo (sin guilds) al nuevo
            if (parsed.guilds) {
                config = parsed;
            } else {
                config = { guilds: {} };
                logInfo('Configuración migrada al formato por servidor');
            }
            logSuccess('Configuración cargada');
        } else {
            saveConfig();
            logInfo('Archivo de configuración creado');
        }
    } catch (error) {
        logWarning('Error cargando configuración, usando defaults');
        saveConfig();
    }
    return config;
}

export function saveConfig() {
    try {
        const dir = join(__dirname, '..', 'data');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
        logWarning('Error guardando configuración');
    }
}

// ── Logs ──
export function getLogChannelName(guildId) {
    return getGuildConfig(guildId).logs?.channelName || 'logs-moderacion';
}

export function isLogsEnabled(guildId) {
    return getGuildConfig(guildId).logs?.enabled !== false;
}

export function setLogChannel(guildId, channelName) {
    const gc = getGuildConfig(guildId);
    if (!gc.logs) gc.logs = {};
    gc.logs.channelName = channelName;
    saveConfig();
}

export function setLogsEnabled(guildId, enabled) {
    const gc = getGuildConfig(guildId);
    if (!gc.logs) gc.logs = {};
    gc.logs.enabled = enabled;
    saveConfig();
}

// ── Welcome ──
export function getWelcomeConfig(guildId) {
    return getGuildConfig(guildId).welcome;
}

export function setWelcomeEnabled(guildId, enabled) {
    const gc = getGuildConfig(guildId);
    gc.welcome.enabled = enabled;
    saveConfig();
}

export function setWelcomeChannel(guildId, channelId) {
    const gc = getGuildConfig(guildId);
    gc.welcome.channelId = channelId;
    saveConfig();
}

export function setWelcomeMessage(guildId, message) {
    const gc = getGuildConfig(guildId);
    gc.welcome.message = message;
    saveConfig();
}

export function setWelcomeBackground(guildId, url) {
    const gc = getGuildConfig(guildId);
    gc.welcome.backgroundUrl = url;
    saveConfig();
}

// ── Goodbye ──
export function getGoodbyeConfig(guildId) {
    return getGuildConfig(guildId).goodbye;
}

export function setGoodbyeEnabled(guildId, enabled) {
    const gc = getGuildConfig(guildId);
    gc.goodbye.enabled = enabled;
    saveConfig();
}

export function setGoodbyeChannel(guildId, channelId) {
    const gc = getGuildConfig(guildId);
    gc.goodbye.channelId = channelId;
    saveConfig();
}

export function setGoodbyeMessage(guildId, message) {
    const gc = getGuildConfig(guildId);
    gc.goodbye.message = message;
    saveConfig();
}

export function setGoodbyeBackground(guildId, url) {
    const gc = getGuildConfig(guildId);
    gc.goodbye.backgroundUrl = url;
    saveConfig();
}

// ── Tickets ──
export function getTicketsConfig(guildId) {
    return getGuildConfig(guildId).tickets;
}

export function setTicketsEnabled(guildId, enabled) {
    const gc = getGuildConfig(guildId);
    gc.tickets.enabled = enabled;
    saveConfig();
}

export function setTicketsCategory(guildId, categoryId) {
    const gc = getGuildConfig(guildId);
    gc.tickets.categoryId = categoryId;
    saveConfig();
}

export function setTicketsRole(guildId, roleId) {
    const gc = getGuildConfig(guildId);
    gc.tickets.roleId = roleId;
    saveConfig();
}

export function setTicketsLogChannel(guildId, logChannelId) {
    const gc = getGuildConfig(guildId);
    gc.tickets.logChannelId = logChannelId;
    saveConfig();
}

export function setTicketsPanelChannel(guildId, panelChannelId) {
    const gc = getGuildConfig(guildId);
    gc.tickets.panelChannelId = panelChannelId;
    saveConfig();
}

export function setTicketsPanelMessage(guildId, panelMessageId) {
    const gc = getGuildConfig(guildId);
    gc.tickets.panelMessageId = panelMessageId;
    saveConfig();
}

export function updateTicketsConfig(guildId, updates) {
    const gc = getGuildConfig(guildId);
    gc.tickets = {
        ...gc.tickets,
        ...updates
    };
    saveConfig();
    return gc.tickets;
}

// ── Suggestions ──
export function getSuggestionsConfig(guildId) {
    return getGuildConfig(guildId).suggestions;
}

export function setSuggestionsChannel(guildId, channelId) {
    const gc = getGuildConfig(guildId);
    gc.suggestions.channelId = channelId;
    saveConfig();
}

// ── Appearance ──
export function getAppearanceConfig(guildId) {
    return getGuildConfig(guildId).appearance;
}

export function updateAppearanceConfig(guildId, updates) {
    const gc = getGuildConfig(guildId);
    gc.appearance = {
        ...gc.appearance,
        ...updates
    };
    saveConfig();
    return gc.appearance;
}

// ── Verification ──
export function getVerificationConfig(guildId) {
    return getGuildConfig(guildId).verification;
}

export function updateVerificationConfig(guildId, updates) {
    const gc = getGuildConfig(guildId);
    gc.verification = {
        ...gc.verification,
        ...updates
    };
    saveConfig();
    return gc.verification;
}

// ── Anti-Raid ──
export function getAntiRaidConfig(guildId) {
    return getGuildConfig(guildId).antiRaid;
}

export function updateAntiRaidConfig(guildId, updates) {
    const gc = getGuildConfig(guildId);
    const current = gc.antiRaid || createDefaultAntiRaidConfig();
    const nextUpdates = updates || {};

    gc.antiRaid = normalizeAntiRaidConfig({
        ...current,
        ...nextUpdates,
        messageSpam: {
            ...current.messageSpam,
            ...(nextUpdates.messageSpam || {})
        },
        duplicateSpam: {
            ...current.duplicateSpam,
            ...(nextUpdates.duplicateSpam || {})
        },
        mentionSpam: {
            ...current.mentionSpam,
            ...(nextUpdates.mentionSpam || {})
        },
        joinRaid: {
            ...current.joinRaid,
            ...(nextUpdates.joinRaid || {})
        },
        panic: {
            ...current.panic,
            ...(nextUpdates.panic || {})
        }
    });

    saveConfig();
    return gc.antiRaid;
}

// ── AI ──
export function getAiConfig(guildId) {
    return getGuildConfig(guildId).ai;
}

export function updateAiConfig(guildId, updates) {
    const gc = getGuildConfig(guildId);
    const current = gc.ai || createDefaultAiConfig();
    const nextUpdates = updates || {};

    gc.ai = normalizeAiConfig({
        ...current,
        ...nextUpdates,
        features: {
            ...current.features,
            ...(nextUpdates.features || {})
        }
    });

    saveConfig();
    return gc.ai;
}

// ── Command permissions ──
export function getAllCommandPermissions(guildId) {
    return getGuildConfig(guildId).commandPermissions;
}

export function getCommandPermission(guildId, commandName) {
    return getGuildConfig(guildId).commandPermissions[commandName] || null;
}

export function updateCommandPermission(guildId, commandName, updates) {
    const gc = getGuildConfig(guildId);
    const normalizedRule = normalizeCommandPermissionRule(updates);

    if (hasCustomCommandPermissionRule(normalizedRule)) {
        gc.commandPermissions[commandName] = normalizedRule;
    } else {
        delete gc.commandPermissions[commandName];
    }

    saveConfig();
    return gc.commandPermissions[commandName] || null;
}

export function clearCommandPermission(guildId, commandName) {
    const gc = getGuildConfig(guildId);

    if (!gc.commandPermissions[commandName]) {
        return false;
    }

    delete gc.commandPermissions[commandName];
    saveConfig();
    return true;
}

export function getConfig() {
    return config;
}
