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
