import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';
import { registerUser, isRegistered } from '../../utils/users.js';

export const command = {
    name: 'register',
    description: 'Registrarte en el sistema del bot',
    async execute(interaction, client) {
        const userId = interaction.user.id;

        if (isRegistered(userId)) {
            return interaction.reply({ content: '❌ Ya estás registrado. Usa `/profile` para ver tu perfil o `/unregister` para eliminar tu registro.', flags: 64 });
        }

        const data = registerUser(userId, {
            username: interaction.user.username,
            avatar: interaction.user.displayAvatarURL({ size: 128 }),
            guildId: interaction.guild.id,
            guildName: interaction.guild.name
        });

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Registro Exitoso')
            .setDescription(`¡Te has registrado en el sistema de **${interaction.guild.name}**!`)
            .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
            .addFields(
                { name: 'Usuario', value: interaction.user.username, inline: true },
                { name: 'ID', value: userId, inline: true },
                { name: 'Servidor', value: interaction.guild.name, inline: true },
                { name: 'Fecha', value: new Date().toLocaleDateString('es-ES'), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Log
        const logEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('📝 Nuevo Registro')
            .addFields(
                { name: 'Usuario', value: `${interaction.user.username} (${userId})`, inline: true },
                { name: 'Servidor', value: interaction.guild.name, inline: true }
            )
            .setTimestamp();
        await sendLog(interaction.guild, { embeds: [logEmbed] }, client);
    }
};
