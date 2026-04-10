import { EmbedBuilder } from 'discord.js';
import { getUser, isRegistered } from '../../utils/users.js';

export const command = {
    name: 'profile',
    description: 'Ver el perfil registrado de un usuario',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a consultar (tú mismo si se omite)',
            required: false
        }
    ],
    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;

        if (!isRegistered(target.id)) {
            const msg = target.id === interaction.user.id
                ? '❌ No estás registrado. Usa `/register` para registrarte.'
                : '❌ Este usuario no está registrado.';
            return interaction.reply({ content: msg, flags: 64 });
        }

        const data = getUser(target.id);

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📋 Perfil de ${target.username}`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '👤 Usuario', value: data.discordUsername, inline: true },
                { name: '🆔 ID', value: data.discordId, inline: true },
                { name: '🏠 Servidor', value: data.guildName || 'Desconocido', inline: true },
                { name: '📅 Registrado', value: new Date(data.registeredAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
