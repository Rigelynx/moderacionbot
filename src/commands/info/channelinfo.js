import { EmbedBuilder, ChannelType } from 'discord.js';

export const command = {
    name: 'channelinfo',
    description: 'Ver información detallada de un canal',
    options: [
        {
            name: 'canal',
            type: 7,
            description: 'Canal a consultar (actual si se omite)',
            required: false
        }
    ],
    async execute(interaction) {
        const channel = interaction.options.getChannel('canal') || interaction.channel;

        const typeNames = {
            [ChannelType.GuildText]: '💬 Texto',
            [ChannelType.GuildVoice]: '🔊 Voz',
            [ChannelType.GuildCategory]: '📁 Categoría',
            [ChannelType.GuildAnnouncement]: '📢 Anuncio',
            [ChannelType.GuildForum]: '🗂️ Foro',
            [ChannelType.GuildStageVoice]: '🎤 Stage',
        };

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📋 Información del Canal: #${channel.name}`)
            .addFields(
                { name: 'ID', value: channel.id, inline: true },
                { name: 'Tipo', value: typeNames[channel.type] || 'Otro', inline: true },
                { name: 'Categoría', value: channel.parent?.name || 'Sin categoría', inline: true },
                { name: 'Creado', value: channel.createdAt.toLocaleDateString('es-ES'), inline: true }
            );

        if (channel.topic) {
            embed.addFields({ name: 'Topic', value: channel.topic });
        }

        if (typeof channel.rateLimitPerUser === 'number') {
            embed.addFields({ name: 'Slowmode', value: channel.rateLimitPerUser > 0 ? `${channel.rateLimitPerUser}s` : 'Desactivado', inline: true });
        }

        if (typeof channel.nsfw === 'boolean') {
            embed.addFields({ name: 'NSFW', value: channel.nsfw ? 'Sí' : 'No', inline: true });
        }

        if (channel.members) {
            embed.addFields({ name: 'Miembros con acceso', value: channel.members.size.toString(), inline: true });
        }

        embed.setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }
};
