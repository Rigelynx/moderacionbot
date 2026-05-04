import { runAiText, truncateForAi } from './ai.js';

export async function summarizeAntiRaidStatus(guildId, statusSummary) {
    return runAiText(guildId, {
        feature: 'antiRaidIncidentSummary',
        maxOutputTokens: 450,
        temperature: 0.2,
        instructions: [
            'Eres un asistente de seguridad para servidores de Discord.',
            'Resume el estado anti-raid y sugiere ajustes prudentes.',
            'La IA no debe ordenar bans, kicks ni lockdown completo.',
            'Si falta evidencia de raid real, dilo claramente.',
            'Formato: resumen corto, riesgo estimado y accion recomendada.'
        ].join('\n'),
        input: truncateForAi(JSON.stringify(statusSummary, null, 2))
    });
}
