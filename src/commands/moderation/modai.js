import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { getAiConfig } from '../../utils/config.js';
import {
    analyzeModerationText,
    explainModerationAction,
    summarizeModerationIncident
} from '../../utils/aiModeration.js';

function riskColor(risk) {
    if (risk === 'critico') return 0xE74C3C;
    if (risk === 'alto') return 0xF97316;
    if (risk === 'medio') return 0xFEE75C;
    return 0x57F287;
}

function truncate(text, max = 1024) {
    const value = String(text || 'No disponible');
    return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function aiDisabledMessage(config) {
    return config.moderationMode === 'off'
        ? '❌ La IA de moderacion esta en modo `off`. Usa `/ia config modo_moderacion:assist`.'
        : null;
}

export const command = {
    name: 'modai',
    description: 'Asistente IA para moderacion',
    default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
    options: [
        {
            name: 'analizar',
            description: 'Analiza un mensaje o situacion sospechosa',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'texto', description: 'Mensaje o notas a analizar', type: ApplicationCommandOptionType.String, required: true },
                { name: 'contexto', description: 'Contexto adicional opcional', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'explicar',
            description: 'Genera una explicacion clara para una accion de moderacion',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'accion', description: 'Accion tomada o sugerida', type: ApplicationCommandOptionType.String, required: true },
                { name: 'razon', description: 'Motivo de la accion', type: ApplicationCommandOptionType.String, required: true },
                { name: 'audiencia', description: 'Para quien va el texto', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'incidente',
            description: 'Resume un incidente de moderacion para staff',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'notas', description: 'Notas, warns, reportes o contexto del incidente', type: ApplicationCommandOptionType.String, required: true }
            ]
        }
    ],

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const config = getAiConfig(guildId);
        const disabled = aiDisabledMessage(config);

        if (disabled) {
            return interaction.reply({ content: disabled, flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });

        if (subcommand === 'analizar') {
            const result = await analyzeModerationText(guildId, {
                text: interaction.options.getString('texto'),
                context: interaction.options.getString('contexto') || ''
            });

            if (!result.ok) {
                return interaction.editReply({ content: `❌ ${result.reason}` });
            }

            const data = result.json;
            const embed = new EmbedBuilder()
                .setColor(riskColor(data.riesgo))
                .setTitle('🧠 Analisis IA de Moderacion')
                .addFields(
                    { name: 'Riesgo', value: truncate(data.riesgo), inline: true },
                    { name: 'Score', value: String(data.score ?? 'N/A'), inline: true },
                    { name: 'Categoria', value: truncate(data.categoria), inline: true },
                    { name: 'Explicacion', value: truncate(data.explicacion), inline: false },
                    { name: 'Accion sugerida', value: truncate(data.accion_sugerida), inline: false }
                )
                .setFooter({ text: 'Asistente IA: no ejecuta castigos automaticamente.' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'explicar') {
            const result = await explainModerationAction(guildId, {
                action: interaction.options.getString('accion'),
                reason: interaction.options.getString('razon'),
                audience: interaction.options.getString('audiencia') || 'usuario'
            });

            if (!result.ok) {
                return interaction.editReply({ content: `❌ ${result.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📝 Explicacion IA')
                .setDescription(truncate(result.text, 4000))
                .setFooter({ text: 'Revisa y edita antes de enviar.' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'incidente') {
            const result = await summarizeModerationIncident(guildId, {
                notes: interaction.options.getString('notas')
            });

            if (!result.ok) {
                return interaction.editReply({ content: `❌ ${result.reason}` });
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('📌 Resumen IA de Incidente')
                .setDescription(truncate(result.text, 4000))
                .setFooter({ text: 'Asistente IA: contexto para staff, no decision final.' })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
