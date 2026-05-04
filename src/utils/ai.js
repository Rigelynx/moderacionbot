import { getAiConfig } from './config.js';
import { logWarning } from './logger.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.4-mini';
const DEFAULT_MAX_INPUT_CHARS = 12000;
const DEFAULT_MAX_OUTPUT_TOKENS = 500;
const HOURLY_WINDOW_MS = 60 * 60 * 1000;

const usageByGuild = new Map();

function envFlag(name, fallback = false) {
    const value = process.env[name];
    if (typeof value !== 'string') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function envInteger(name, fallback, min, max) {
    const parsed = Number(process.env[name]);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function getWindowUsage(guildId) {
    const now = Date.now();
    const current = usageByGuild.get(guildId);

    if (!current || now - current.startedAt >= HOURLY_WINDOW_MS) {
        const fresh = { startedAt: now, count: 0 };
        usageByGuild.set(guildId, fresh);
        return fresh;
    }

    return current;
}

function incrementUsage(guildId) {
    getWindowUsage(guildId).count += 1;
}

export function truncateForAi(value, maxChars = getMaxInputChars()) {
    const text = String(value || '').trim();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, Math.max(0, maxChars - 80))}\n\n[Contenido recortado por limite de IA]`;
}

export function getMaxInputChars() {
    return envInteger('AI_MAX_INPUT_CHARS', DEFAULT_MAX_INPUT_CHARS, 1000, 50000);
}

export function getMaxOutputTokens(fallback = DEFAULT_MAX_OUTPUT_TOKENS) {
    return envInteger('AI_MAX_OUTPUT_TOKENS', fallback, 64, 4000);
}

export function getAiRuntimeStatus(guildId, feature = null) {
    const config = getAiConfig(guildId);
    const usage = getWindowUsage(guildId);
    const globalEnabled = envFlag('AI_ENABLED', false);
    const apiKeyPresent = Boolean(process.env.OPENAI_API_KEY);
    const provider = process.env.AI_PROVIDER || config.provider || 'openai';
    const featureEnabled = feature ? config.features?.[feature] !== false : true;
    const remaining = Math.max(0, (config.maxRequestsPerHour || 1) - usage.count);

    let ready = true;
    let reason = 'IA lista.';

    if (!globalEnabled) {
        ready = false;
        reason = 'IA apagada globalmente. Configura AI_ENABLED=true.';
    } else if (!apiKeyPresent) {
        ready = false;
        reason = 'Falta OPENAI_API_KEY en el entorno.';
    } else if (!config.enabled) {
        ready = false;
        reason = 'IA apagada para este servidor. Usa /ia config.';
    } else if (provider !== 'openai') {
        ready = false;
        reason = `Proveedor IA no soportado: ${provider}.`;
    } else if (!featureEnabled) {
        ready = false;
        reason = 'Esta funcion de IA esta desactivada para el servidor.';
    } else if (remaining <= 0) {
        ready = false;
        reason = 'Limite horario de IA alcanzado para este servidor.';
    }

    return {
        ready,
        reason,
        config,
        provider,
        model: process.env.AI_MODEL || config.model || DEFAULT_MODEL,
        usage: usage.count,
        maxRequestsPerHour: config.maxRequestsPerHour,
        remaining
    };
}

export function formatAiUnavailable(status) {
    return `IA no disponible: ${status.reason}`;
}

function extractOutputText(data) {
    if (typeof data?.output_text === 'string') return data.output_text.trim();

    const parts = [];
    for (const item of data?.output || []) {
        for (const content of item?.content || []) {
            if (typeof content?.text === 'string') {
                parts.push(content.text);
            }
        }
    }

    return parts.join('\n').trim();
}

function extractJson(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed);
    } catch {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

export async function runAiText(guildId, {
    feature,
    instructions,
    input,
    maxOutputTokens,
    temperature
}) {
    const status = getAiRuntimeStatus(guildId, feature);
    if (!status.ready) {
        return { ok: false, reason: status.reason, status };
    }

    const body = {
        model: status.model,
        instructions,
        input: truncateForAi(input),
        max_output_tokens: maxOutputTokens || getMaxOutputTokens(),
        store: false,
        metadata: {
            guild_id: String(guildId),
            feature: String(feature || 'generic')
        }
    };

    if (Number.isFinite(temperature)) {
        body.temperature = temperature;
    }

    if (status.config.logPrompts) {
        logWarning(`[AI prompt] guild=${guildId} feature=${feature} chars=${body.input.length}`);
    }

    try {
        const response = await fetch(OPENAI_RESPONSES_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data?.error?.message || `HTTP ${response.status}`;
            return { ok: false, reason: message, status, raw: data };
        }

        incrementUsage(guildId);

        const text = extractOutputText(data);
        if (!text) {
            return { ok: false, reason: 'La IA no devolvio texto util.', status, raw: data };
        }

        return {
            ok: true,
            text,
            status,
            usage: data?.usage || null,
            raw: data
        };
    } catch (error) {
        return {
            ok: false,
            reason: error.message || 'Error llamando al proveedor IA.',
            status,
            error
        };
    }
}

export async function runAiJson(guildId, options) {
    const result = await runAiText(guildId, options);
    if (!result.ok) return result;

    const json = extractJson(result.text);
    if (!json) {
        return {
            ...result,
            ok: false,
            reason: 'La IA no devolvio JSON valido.'
        };
    }

    return {
        ...result,
        json
    };
}
