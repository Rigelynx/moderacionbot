import { getWelcomeConfig } from '../utils/config.js';
import { generateCard } from '../utils/welcomeCard.js';
import { sendLog } from '../utils/embeds.js';
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'guildMemberAdd',
    once: false,

    async execute(member, client) {
        const config = getWelcomeConfig(member.guild.id);
        if (!config?.enabled || !config?.channelId) return;

        try {
            const channel = member.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            // Generate welcome card
            const attachment = await generateCard(member, 'welcome', config);

            // Build message with variables
            let message = config.message || '¡Bienvenido/a {user} a **{server}**! 🎉';
            message = message
                .replace(/{user}/gi, `<@${member.id}>`)
                .replace(/{server}/gi, member.guild.name)
                .replace(/{count}/gi, member.guild.memberCount.toString());

            await channel.send({
                content: message,
                files: [attachment]
            });

            // Log
            const logEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('👋 Nuevo Miembro')
                .addFields(
                    { name: 'Usuario', value: `${member.user.username} (${member.id})`, inline: true },
                    { name: 'Miembros ahora', value: member.guild.memberCount.toString(), inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
                .setTimestamp();

            await sendLog(member.guild, { embeds: [logEmbed] }, client);
        } catch (error) {
            console.error('Error en welcome:', error);
        }
    }
};
