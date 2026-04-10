import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

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
        const usuario = interaction.options.getUser('usuario');
        const razon = interaction.options.getString('razon');

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

        // Enviar a logs
        const logResult = await sendLog(interaction.guild, { embeds: [embed] }, client);
        
        if (logResult) {
            await interaction.reply({ content: '✅ Tu reporte ha sido enviado confidencialmente al Staff.', flags: 64 });
        } else {
            await interaction.reply({ content: '❌ Los logs del servidor están desactivados, contacta a un administrador para tu reporte.', flags: 64 });
        }
    }
};
