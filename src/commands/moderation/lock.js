import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'lock',
    description: 'Bloquear el canal actual',
    default_member_permissions: '16',
    async execute(interaction, client) {
        const channel = interaction.channel;

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        });

        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🔒 Canal Bloqueado')
            .setDescription(`El canal ${channel.name} ha sido bloqueado.`)
            .addFields({ name: 'Moderador', value: interaction.user.username })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
