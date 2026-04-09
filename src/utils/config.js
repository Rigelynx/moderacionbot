import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logWarning } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, '..', 'data', 'config.json');

let config = {
    logs: {
        enabled: true,
        channelName: 'logs-moderacion'
    }
};

export function loadConfig() {
    try {
        if (existsSync(configFile)) {
            const data = readFileSync(configFile, 'utf-8');
            config = JSON.parse(data);
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
    return config.logs?.channelName || 'logs-moderacion';
}

export function isLogsEnabled(guildId) {
    return config.logs?.enabled !== false;
}

export function setLogChannel(guildId, channelName) {
    if (!config.logs) config.logs = {};
    config.logs.channelName = channelName;
    saveConfig();
}

export function setLogsEnabled(guildId, enabled) {
    if (!config.logs) config.logs = {};
    config.logs.enabled = enabled;
    saveConfig();
}

export function getConfig() {
    return config;
}
