import { getGoodbyeConfig } from '../utils/config.js';
import { generateCard } from '../utils/welcomeCard.js';
import { sendLog } from '../utils/embeds.js';
import { EmbedBuilder } from 'discord.js';

export default {
    name: 'guildMemberRemove',
    once: false,

    async execute(member, client) {
        const config = getGoodbyeConfig(member.guild.id);
        if (!config?.enabled || !config?.channelId) return;

        try {
            const channel = member.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            // Generate goodbye card
            const attachment = await generateCard(member, 'goodbye', config);

            // Build message with variables
            let message = config.message || '**{user}** ha abandonado **{server}** 😢';
            message = message
                .replace(/{user}/gi, member.user.username)
                .replace(/{server}/gi, member.guild.name)
                .replace(/{count}/gi, member.guild.memberCount.toString());

            await channel.send({
                content: message,
                files: [attachment]
            });

            // Log
            const logEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🚪 Miembro Salió')
                .addFields(
                    { name: 'Usuario', value: `${member.user.username} (${member.id})`, inline: true },
                    { name: 'Miembros ahora', value: member.guild.memberCount.toString(), inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL({ size: 64 }))
                .setTimestamp();

            await sendLog(member.guild, { embeds: [logEmbed] }, client);
        } catch (error) {
            console.error('Error en goodbye:', error);
        }
    }
};
