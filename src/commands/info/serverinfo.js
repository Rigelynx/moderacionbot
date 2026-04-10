import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'serverinfo',
    description: 'Ver información del servidor',
    async execute(interaction, client) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📊 Información de ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 1024 }))
            .addFields(
                { name: 'Servidor', value: guild.name, inline: true },
                { name: 'ID', value: guild.id, inline: true },
                { name: 'Dueño', value: owner.user.username, inline: true },
                { name: 'Miembros', value: `${guild.memberCount}`, inline: true },
                { name: 'Canales', value: `${guild.channels.cache.size}`, inline: true },
                { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
                { name: 'Emojis', value: `${guild.emojis.cache.size}`, inline: true },
                { name: 'Creado el', value: guild.createdAt.toLocaleDateString('es-ES'), inline: true },
                { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Verificación', value: guild.verificationLevel.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
