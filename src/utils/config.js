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
            }
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

export function getConfig() {
    return config;
}
