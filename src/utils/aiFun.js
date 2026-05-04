import { runAiText, truncateForAi } from './ai.js';

export async function askMagic8Ball(guildId, {
    question,
    personality = 'sabia'
}) {
    return runAiText(guildId, {
        feature: 'fun8ball',
        maxOutputTokens: 120,
        temperature: 0.8,
        instructions: [
            'Eres una bola magica 8 para Discord.',
            'Responde en espanol con una frase corta, divertida y no ofensiva.',
            'No des consejos medicos, legales, financieros ni decisiones peligrosas.',
            'Si la pregunta es delicada, responde de forma juguetona pero prudente.'
        ].join('\n'),
        input: truncateForAi(`Personalidad: ${personality}\nPregunta: ${question}`, 1200)
    });
}
