import { getAiConfig } from './config.js';
import { logWarning } from './logger.js';

// ── Provider presets ──
// Each preset defines the base URL and default model for known providers.
// Providers marked as 'openaiCompat' use the OpenAI Chat Completions format.
const PROVIDER_PRESETS = {
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        format: 'openaiCompat'
    },
    deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        defaultModel: 'deepseek-chat',
        format: 'openaiCompat'
    },
    gemini: {
        name: 'Google Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-2.0-flash',
        format: 'gemini'
    },
    claude: {
        name: 'Anthropic Claude',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-4-20250514',
        format: 'claude'
    },
    groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama-3.3-70b-versatile',
        format: 'openaiCompat'
    },
    mistral: {
        name: 'Mistral AI',
        baseUrl: 'https://api.mistral.ai/v1',
        defaultModel: 'mistral-small-latest',
        format: 'openaiCompat'
    },
    openrouter: {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4o-mini',
        format: 'openaiCompat'
    },
    grok: {
        name: 'Grok (xAI)',
        baseUrl: 'https://api.x.ai/v1',
        defaultModel: 'grok-3-mini-fast',
        format: 'openaiCompat'
    },
    custom: {
        name: 'Custom (OpenAI Compatible)',
        baseUrl: null,
        defaultModel: 'gpt-4o-mini',
        format: 'openaiCompat'
    }
};

const SUPPORTED_PROVIDERS = Object.keys(PROVIDER_PRESETS);
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

export function getSupportedProviders() {
    return SUPPORTED_PROVIDERS;
}

export function getProviderPreset(provider) {
    return PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.openai;
}

export function getAiRuntimeStatus(guildId, feature = null) {
    const config = getAiConfig(guildId);
    const usage = getWindowUsage(guildId);
    const globalEnabled = envFlag('AI_ENABLED', false);
    const envApiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const guildApiKey = config.apiKey;
    const apiKeyPresent = Boolean(envApiKey || guildApiKey);
    const provider = config.provider || process.env.AI_PROVIDER || 'openai';
    const preset = getProviderPreset(provider);
    const featureEnabled = feature ? config.features?.[feature] !== false : true;
    const remaining = Math.max(0, (config.maxRequestsPerHour || 1) - usage.count);

    // Resolve the base URL: guild config > env variable > preset default
    const baseUrl = config.baseUrl || process.env.AI_BASE_URL || preset.baseUrl;

    let ready = true;
    let reason = 'IA lista.';

    if (!globalEnabled) {
        ready = false;
        reason = 'IA apagada globalmente. Configura AI_ENABLED=true.';
    } else if (!apiKeyPresent) {
        ready = false;
        reason = 'No hay API Key configurada. Usa /ia config api_key:TU_KEY o configura AI_API_KEY en el entorno.';
    } else if (!config.enabled) {
        ready = false;
        reason = 'IA apagada para este servidor. Usa /ia config habilitado:true.';
    } else if (!SUPPORTED_PROVIDERS.includes(provider)) {
        ready = false;
        reason = `Proveedor IA no soportado: ${provider}. Usa: ${SUPPORTED_PROVIDERS.join(', ')}.`;
    } else if (provider === 'custom' && !baseUrl) {
        ready = false;
        reason = 'Proveedor "custom" requiere una base_url. Usa /ia config base_url:https://tu-api.com/v1.';
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
        providerName: preset.name,
        format: preset.format,
        baseUrl,
        model: process.env.AI_MODEL || config.model || preset.defaultModel,
        usage: usage.count,
        maxRequestsPerHour: config.maxRequestsPerHour,
        remaining,
        effectiveApiKey: guildApiKey || envApiKey
    };
}

export function formatAiUnavailable(status) {
    return `IA no disponible: ${status.reason}`;
}

// ── Request builders per format ──

function buildOpenAiCompatRequest(status, instructions, input, maxOutputTokens, temperature) {
    const url = `${status.baseUrl}/chat/completions`;

    const messages = [];
    if (instructions) {
        messages.push({ role: 'system', content: instructions });
    }
    messages.push({ role: 'user', content: input });

    const body = {
        model: status.model,
        messages,
        max_tokens: maxOutputTokens
    };

    if (Number.isFinite(temperature)) {
        body.temperature = temperature;
    }

    const headers = {
        Authorization: `Bearer ${status.effectiveApiKey}`,
        'Content-Type': 'application/json'
    };

    // OpenRouter requires extra headers
    if (status.provider === 'openrouter') {
        headers['HTTP-Referer'] = process.env.BASE_URL || 'http://localhost:3000';
        headers['X-Title'] = 'Discord Moderation Bot';
    }

    return { url, headers, body };
}

function buildGeminiRequest(status, instructions, input, maxOutputTokens, temperature) {
    const url = `${status.baseUrl}/models/${status.model}:generateContent?key=${status.effectiveApiKey}`;

    const contents = [];
    if (instructions) {
        contents.push({ role: 'user', parts: [{ text: `[System Instructions]: ${instructions}` }] });
        contents.push({ role: 'model', parts: [{ text: 'Entendido, seguiré esas instrucciones.' }] });
    }
    contents.push({ role: 'user', parts: [{ text: input }] });

    const body = {
        contents,
        generationConfig: {
            maxOutputTokens
        }
    };

    if (Number.isFinite(temperature)) {
        body.generationConfig.temperature = temperature;
    }

    const headers = { 'Content-Type': 'application/json' };

    return { url, headers, body };
}

function buildClaudeRequest(status, instructions, input, maxOutputTokens, temperature) {
    const url = `${status.baseUrl}/messages`;

    const body = {
        model: status.model,
        max_tokens: maxOutputTokens,
        messages: [{ role: 'user', content: input }]
    };

    if (instructions) {
        body.system = instructions;
    }

    if (Number.isFinite(temperature)) {
        body.temperature = temperature;
    }

    const headers = {
        'x-api-key': status.effectiveApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
    };

    return { url, headers, body };
}

// ── Response extractors per format ──

function extractOpenAiCompatText(data) {
    // Chat Completions format
    const choice = data?.choices?.[0];
    if (choice?.message?.content) return choice.message.content.trim();

    // OpenAI Responses API fallback
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

function extractGeminiText(data) {
    const candidates = data?.candidates;
    if (!Array.isArray(candidates) || !candidates.length) return '';

    const parts = candidates[0]?.content?.parts;
    if (!Array.isArray(parts)) return '';

    return parts
        .filter(p => typeof p.text === 'string')
        .map(p => p.text)
        .join('\n')
        .trim();
}

function extractClaudeText(data) {
    const content = data?.content;
    if (!Array.isArray(content)) return '';

    return content
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('\n')
        .trim();
}

function extractErrorMessage(data, format) {
    if (format === 'gemini') {
        return data?.error?.message || JSON.stringify(data?.error || data);
    }
    if (format === 'claude') {
        return data?.error?.message || JSON.stringify(data?.error || data);
    }
    return data?.error?.message || JSON.stringify(data?.error || data);
}

// ── Unified dispatcher ──

function buildRequest(status, instructions, input, maxOutputTokens, temperature) {
    switch (status.format) {
        case 'gemini':
            return buildGeminiRequest(status, instructions, input, maxOutputTokens, temperature);
        case 'claude':
            return buildClaudeRequest(status, instructions, input, maxOutputTokens, temperature);
        case 'openaiCompat':
        default:
            return buildOpenAiCompatRequest(status, instructions, input, maxOutputTokens, temperature);
    }
}

function extractText(data, format) {
    switch (format) {
        case 'gemini':
            return extractGeminiText(data);
        case 'claude':
            return extractClaudeText(data);
        case 'openaiCompat':
        default:
            return extractOpenAiCompatText(data);
    }
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

// ── Public API ──

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

    const truncatedInput = truncateForAi(input);
    const tokens = maxOutputTokens || getMaxOutputTokens();
    const { url, headers, body } = buildRequest(status, instructions, truncatedInput, tokens, temperature);

    if (status.config.logPrompts) {
        logWarning(`[AI prompt] guild=${guildId} provider=${status.provider} model=${status.model} feature=${feature} chars=${truncatedInput.length}`);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = extractErrorMessage(data, status.format) || `HTTP ${response.status}`;
            return { ok: false, reason: message, status, raw: data };
        }

        incrementUsage(guildId);

        const text = extractText(data, status.format);
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
