import { runAiText, truncateForAi } from './ai.js';

function formatTicketContext(ticketRecord = {}, recentMessages = []) {
    const base = [
        `Ticket: #${ticketRecord.ticketNumber || 'desconocido'}`,
        `Tipo: ${ticketRecord.typeLabel || ticketRecord.typeKey || 'General'}`,
        `Prioridad: ${ticketRecord.priority || 'media'}`,
        `Creador: ${ticketRecord.ownerTag || ticketRecord.ownerId || 'desconocido'}`,
        `Asunto: ${ticketRecord.subject || 'Sin asunto'}`,
        `Descripcion inicial: ${ticketRecord.description || 'Sin descripcion'}`
    ];

    if (recentMessages.length) {
        base.push(
            'Mensajes recientes:',
            ...recentMessages.map(message => `- ${message.author}: ${message.content}`)
        );
    }

    return truncateForAi(base.join('\n'));
}

export async function summarizeTicketClose(guildId, {
    ticketRecord,
    recentMessages = [],
    reason,
    resolution
}) {
    const input = [
        formatTicketContext(ticketRecord, recentMessages),
        `Razon de cierre: ${reason || 'No especificada'}`,
        `Resumen humano existente: ${resolution || 'No especificado'}`
    ].join('\n\n');

    return runAiText(guildId, {
        feature: 'ticketSummary',
        maxOutputTokens: 350,
        temperature: 0.2,
        instructions: [
            'Eres un asistente de soporte para un bot de Discord.',
            'Genera un resumen profesional del ticket en espanol.',
            'No inventes hechos, no acuses, no tomes decisiones de moderacion.',
            'Formato: 3 a 5 lineas claras con problema, contexto, acciones y resultado.'
        ].join('\n'),
        input
    });
}

export async function suggestTicketReply(guildId, {
    ticketRecord,
    recentMessages = [],
    extraContext
}) {
    const input = [
        formatTicketContext(ticketRecord, recentMessages),
        `Contexto extra del staff: ${extraContext || 'Sin contexto extra'}`
    ].join('\n\n');

    return runAiText(guildId, {
        feature: 'ticketReplyAssist',
        maxOutputTokens: 450,
        temperature: 0.4,
        instructions: [
            'Eres un asistente para staff de soporte en Discord.',
            'Propone 1 a 3 respuestas editables para enviar dentro del ticket.',
            'Tono claro, profesional y humano.',
            'No prometas acciones que el staff no haya confirmado.',
            'No envies nada automaticamente: solo sugiere texto.'
        ].join('\n'),
        input
    });
}
