import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logWarning } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, '..', 'data', 'config.json');

let config = { guilds: {} };

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
            tickets: {
                enabled: false,
                categoryId: null,
                roleId: null,
                logChannelId: null
            },
            suggestions: {
                channelId: null
            }
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
    if (!config.guilds[guildId].tickets) {
        config.guilds[guildId].tickets = {
            enabled: false,
            categoryId: null,
            roleId: null,
            logChannelId: null
        };
    }
    if (!config.guilds[guildId].suggestions) {
        config.guilds[guildId].suggestions = {
            channelId: null
        };
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

// ── Suggestions ──
export function getSuggestionsConfig(guildId) {
    return getGuildConfig(guildId).suggestions;
}

export function setSuggestionsChannel(guildId, channelId) {
    const gc = getGuildConfig(guildId);
    gc.suggestions.channelId = channelId;
    saveConfig();
}

export function getConfig() {
    return config;
}
