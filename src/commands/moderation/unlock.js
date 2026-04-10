import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'unlock',
    description: 'Desbloquear el canal actual',
    default_member_permissions: '16',
    async execute(interaction, client) {
        const channel = interaction.channel;

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: null
        });

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🔓 Canal Desbloqueado')
            .setDescription(`El canal ${channel.name} ha sido desbloqueado.`)
            .addFields({ name: 'Moderador', value: interaction.user.username })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
