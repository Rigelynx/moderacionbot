import { runAiJson, runAiText, truncateForAi } from './ai.js';

const JSON_INSTRUCTIONS = 'Responde solo JSON valido, sin markdown ni texto extra.';

export async function classifyReport(guildId, {
    reporterTag,
    targetTag,
    channelName,
    reason
}) {
    return runAiJson(guildId, {
        feature: 'reportClassification',
        maxOutputTokens: 250,
        temperature: 0.1,
        instructions: [
            'Clasifica reportes de Discord para ayudar al staff.',
            'Categorias permitidas: spam, acoso, contenido_inapropiado, apelacion, bug, compra, conflicto_entre_usuarios, estafa, raid, otro.',
            'No recomiendes castigos automaticos.',
            'Devuelve: {"categoria":"...","prioridad":"baja|media|alta|urgente","resumen":"...","accion_sugerida":"..."}',
            JSON_INSTRUCTIONS
        ].join('\n'),
        input: truncateForAi([
            `Reportante: ${reporterTag}`,
            `Reportado: ${targetTag}`,
            `Canal: ${channelName}`,
            `Razon: ${reason}`
        ].join('\n'))
    });
}

export async function analyzeModerationText(guildId, {
    text,
    context
}) {
    return runAiJson(guildId, {
        feature: 'smartModeration',
        maxOutputTokens: 350,
        temperature: 0.1,
        instructions: [
            'Analiza mensajes sospechosos de Discord solo como asistente para staff.',
            'Detecta toxicidad, amenazas, acoso, spam, estafas, links enganosos o comportamiento raro.',
            'No ordenes castigos fuertes. Sugiere pasos prudentes.',
            'Devuelve: {"riesgo":"bajo|medio|alto|critico","categoria":"...","score":0-100,"explicacion":"...","accion_sugerida":"..."}',
            JSON_INSTRUCTIONS
        ].join('\n'),
        input: truncateForAi([
            `Contexto: ${context || 'Sin contexto adicional'}`,
            `Mensaje o notas: ${text}`
        ].join('\n\n'))
    });
}

export async function explainModerationAction(guildId, {
    action,
    reason,
    audience = 'usuario'
}) {
    return runAiText(guildId, {
        feature: 'moderationExplanation',
        maxOutputTokens: 300,
        temperature: 0.25,
        instructions: [
            'Redacta una explicacion breve y clara para una accion de moderacion en Discord.',
            'Debe ser respetuosa, directa y no agresiva.',
            'No inventes reglas ni evidencia. No menciones que eres IA.',
            'Devuelve un texto listo para usar.'
        ].join('\n'),
        input: truncateForAi([
            `Audiencia: ${audience}`,
            `Accion: ${action}`,
            `Razon: ${reason || 'No especificada'}`
        ].join('\n'))
    });
}

export async function summarizeModerationIncident(guildId, {
    notes
}) {
    return runAiText(guildId, {
        feature: 'moderationIncidentSummary',
        maxOutputTokens: 450,
        temperature: 0.2,
        instructions: [
            'Resume un incidente de moderacion para staff de Discord.',
            'Incluye que paso, patron observado, riesgo y siguientes pasos sugeridos.',
            'No recomiendes ban/kick automatico solo por IA.',
            'Formato breve con bullets.'
        ].join('\n'),
        input: truncateForAi(notes)
    });
}
