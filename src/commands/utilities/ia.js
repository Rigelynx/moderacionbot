import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { getAiConfig, updateAiConfig } from '../../utils/config.js';
import { getAiRuntimeStatus } from '../../utils/ai.js';

const featureChoices = [
    { name: 'Resumen de tickets', value: 'ticketSummary' },
    { name: 'Respuestas de tickets', value: 'ticketReplyAssist' },
    { name: 'Clasificacion de reportes', value: 'reportClassification' },
    { name: 'Moderacion inteligente', value: 'smartModeration' },
    { name: 'Explicaciones de moderacion', value: 'moderationExplanation' },
    { name: 'Resumenes de moderacion', value: 'moderationIncidentSummary' },
    { name: 'Anti-raid inteligente', value: 'smartAntiRaid' },
    { name: 'Resumenes anti-raid', value: 'antiRaidIncidentSummary' },
    { name: '8ball IA', value: 'fun8ball' }
];

function yesNo(value) {
    return value ? 'Si' : 'No';
}

function createStatusEmbed(guildId) {
    const config = getAiConfig(guildId);
    const runtime = getAiRuntimeStatus(guildId);
    const features = Object.entries(config.features || {})
        .map(([name, enabled]) => `${enabled ? '✅' : '❌'} ${name}`)
        .join('\n');

    return new EmbedBuilder()
        .setColor(runtime.ready ? 0x57F287 : 0xFEE75C)
        .setTitle('🤖 Estado de IA')
        .setDescription(runtime.ready ? 'La IA esta lista para este servidor.' : runtime.reason)
        .addFields(
            { name: 'Servidor', value: yesNo(config.enabled), inline: true },
            { name: 'Proveedor', value: runtime.provider, inline: true },
            { name: 'Modelo', value: runtime.model, inline: true },
            { name: 'Tickets', value: config.ticketMode, inline: true },
            { name: 'Moderacion', value: config.moderationMode, inline: true },
            { name: 'Anti-Raid', value: config.antiRaidMode, inline: true },
            { name: 'Uso horario', value: `${runtime.usage}/${runtime.maxRequestsPerHour}`, inline: true },
            { name: 'Log prompts', value: yesNo(config.logPrompts), inline: true },
            { name: 'Funciones', value: features.slice(0, 1024) || 'Sin funciones configuradas.', inline: false }
        )
        .setFooter({ text: 'Tambien necesitas AI_ENABLED=true y OPENAI_API_KEY en el entorno.' })
        .setTimestamp();
}

export const command = {
    name: 'ia',
    description: 'Configura la IA del servidor',
    default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
    options: [
        {
            name: 'status',
            description: 'Ver estado, limites y funciones de IA',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'config',
            description: 'Ajustar la IA del servidor',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'habilitado', description: 'Activa o apaga IA para este servidor', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'funcion', description: 'Funcion especifica a configurar', type: ApplicationCommandOptionType.String, choices: featureChoices, required: false },
                { name: 'funcion_habilitada', description: 'Activa o apaga la funcion elegida', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'modo_tickets', description: 'Modo IA para tickets', type: ApplicationCommandOptionType.String, choices: [
                    { name: 'Off', value: 'off' },
                    { name: 'Manual', value: 'manual' },
                    { name: 'Auto', value: 'auto' }
                ], required: false },
                { name: 'modo_moderacion', description: 'Modo IA para moderacion', type: ApplicationCommandOptionType.String, choices: [
                    { name: 'Off', value: 'off' },
                    { name: 'Monitor', value: 'monitor' },
                    { name: 'Assist', value: 'assist' },
                    { name: 'Soft action', value: 'soft-action' }
                ], required: false },
                { name: 'modo_antiraid', description: 'Modo IA para anti-raid', type: ApplicationCommandOptionType.String, choices: [
                    { name: 'Off', value: 'off' },
                    { name: 'Monitor', value: 'monitor' },
                    { name: 'Assist', value: 'assist' },
                    { name: 'Adaptive', value: 'adaptive' }
                ], required: false },
                { name: 'max_hora', description: 'Maximo de llamadas IA por hora', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1000, required: false },
                { name: 'modelo', description: 'Modelo OpenAI a usar', type: ApplicationCommandOptionType.String, required: false },
                { name: 'log_prompts', description: 'Loguear longitud de prompts para depuracion', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        }
    ],

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'status') {
            return interaction.reply({ embeds: [createStatusEmbed(guildId)], flags: 64 });
        }

        if (subcommand === 'config') {
            const updates = {};
            const featureUpdates = {};

            const enabled = interaction.options.getBoolean('habilitado');
            const feature = interaction.options.getString('funcion');
            const featureEnabled = interaction.options.getBoolean('funcion_habilitada');
            const ticketMode = interaction.options.getString('modo_tickets');
            const moderationMode = interaction.options.getString('modo_moderacion');
            const antiRaidMode = interaction.options.getString('modo_antiraid');
            const maxRequestsPerHour = interaction.options.getInteger('max_hora');
            const model = interaction.options.getString('modelo');
            const logPrompts = interaction.options.getBoolean('log_prompts');

            if (typeof enabled === 'boolean') updates.enabled = enabled;
            if (feature && typeof featureEnabled === 'boolean') featureUpdates[feature] = featureEnabled;
            if (ticketMode) updates.ticketMode = ticketMode;
            if (moderationMode) updates.moderationMode = moderationMode;
            if (antiRaidMode) updates.antiRaidMode = antiRaidMode;
            if (typeof maxRequestsPerHour === 'number') updates.maxRequestsPerHour = maxRequestsPerHour;
            if (model) updates.model = model.trim();
            if (typeof logPrompts === 'boolean') updates.logPrompts = logPrompts;
            if (Object.keys(featureUpdates).length) updates.features = featureUpdates;

            if (!Object.keys(updates).length) {
                return interaction.reply({
                    content: '❌ Debes indicar al menos un ajuste. Ej: `/ia config habilitado:true`.',
                    flags: 64
                });
            }

            updateAiConfig(guildId, updates);
            return interaction.reply({
                content: '✅ Configuracion de IA actualizada.',
                embeds: [createStatusEmbed(guildId)],
                flags: 64
            });
        }
    }
};
