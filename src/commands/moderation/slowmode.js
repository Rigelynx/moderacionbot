import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'slowmode',
    description: 'Configurar modo lento en el canal',
    default_member_permissions: '16',
    options: [
        {
            name: 'segundos',
            type: 4,
            description: 'Segundos entre mensajes (0-21600, 0 para desactivar)',
            required: true,
            min_value: 0,
            max_value: 21600
        }
    ],
    async execute(interaction, client) {
        const seconds = interaction.options.getInteger('segundos');

        await interaction.channel.setRateLimitPerUser(seconds);

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🐌 Modo Lento')
            .addFields(
                { name: 'Canal', value: interaction.channel.name, inline: true },
                { name: 'Intervalo', value: seconds === 0 ? 'Desactivado' : `${seconds}s`, inline: true },
                { name: 'Moderador', value: interaction.user.username }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
