import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';
import { unregisterUser, isRegistered } from '../../utils/users.js';

export const command = {
    name: 'unregister',
    description: 'Eliminar tu registro del sistema del bot',
    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        if (!isRegistered(guildId, userId)) {
            return interaction.reply({ content: '❌ No estás registrado. Usa `/register` para registrarte.', flags: 64 });
        }

        unregisterUser(guildId, userId);

        const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('🗑️ Registro Eliminado')
            .setDescription('Tu registro ha sido eliminado del sistema.')
            .addFields(
                { name: 'Usuario', value: interaction.user.username, inline: true },
                { name: 'ID', value: userId, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Log
        const logEmbed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('🗑️ Registro Eliminado')
            .addFields(
                { name: 'Usuario', value: `${interaction.user.username} (${userId})`, inline: true }
            )
            .setTimestamp();
        await sendLog(interaction.guild, { embeds: [logEmbed] }, client);
    }
};
