import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';
import { classifyReport } from '../../utils/aiModeration.js';

export const command = {
    name: 'report',
    description: 'Envía un reporte anónimo o directo sobre un usuario o situación',
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'El usuario que deseas reportar',
            required: true
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'Explica qué ocurrió o por qué estás reportando',
            required: true
        }
    ],
    async execute(interaction, client) {
        await interaction.deferReply({ flags: 64 });

        const usuario = interaction.options.getUser('usuario');
        const razon = interaction.options.getString('razon');
        const aiClassification = await classifyReport(interaction.guild.id, {
            reporterTag: interaction.user.tag,
            targetTag: usuario.tag,
            channelName: interaction.channel?.name || 'desconocido',
            reason: razon
        });

        const embed = new EmbedBuilder()
            .setTitle('🚨 Nuevo Reporte de Usuario')
            .setColor(0xff0000)
            .addFields(
                { name: 'Reportante', value: `${interaction.user.tag} (\`${interaction.user.id}\`)`, inline: true },
                { name: 'Reportado', value: `${usuario.tag} (\`${usuario.id}\`)`, inline: true },
                { name: 'Razón', value: razon, inline: false },
                { name: 'Canal', value: `<#${interaction.channel.id}>`, inline: false }
            )
            .setTimestamp();

        if (aiClassification.ok) {
            const data = aiClassification.json;
            embed.addFields(
                { name: 'Clasificacion IA', value: `${data.categoria || 'otro'} · Prioridad ${data.prioridad || 'media'}`, inline: true },
                { name: 'Resumen IA', value: String(data.resumen || 'Sin resumen').slice(0, 1024), inline: false },
                { name: 'Accion sugerida IA', value: String(data.accion_sugerida || 'Revisar manualmente').slice(0, 1024), inline: false }
            );
        }

        // Enviar a logs
        const logResult = await sendLog(interaction.guild, { embeds: [embed] }, client);
        
        if (logResult) {
            await interaction.editReply({ content: '✅ Tu reporte ha sido enviado confidencialmente al Staff.' });
        } else {
            await interaction.editReply({ content: '❌ Los logs del servidor están desactivados, contacta a un administrador para tu reporte.' });
        }
    }
};
