import { getVerificationConfig, getWelcomeConfig } from '../utils/config.js';
import { generateCard, replaceMemberPlaceholders } from '../utils/welcomeCard.js';
import { sendLog } from '../utils/embeds.js';
import { EmbedBuilder } from 'discord.js';
import { handleGuildMemberAddAntiRaid } from '../utils/antiRaid.js';

export default {
    name: 'guildMemberAdd',
    once: false,

    async execute(member, client) {
        const antiRaidResult = await handleGuildMemberAddAntiRaid(member, client);
        if (antiRaidResult.suppressWelcome) return;

        const verificationConfig = getVerificationConfig(member.guild.id);
        const joinRoleId = verificationConfig?.joinRoleId || null;
        if (joinRoleId) {
            const joinRole = member.guild.roles.cache.get(joinRoleId);
            const botMember = member.guild.members.me;

            if (
                joinRole &&
                botMember?.permissions?.has('ManageRoles') &&
                botMember.roles.highest.comparePositionTo(joinRole) > 0 &&
                !member.roles.cache.has(joinRole.id)
            ) {
                await member.roles.add(joinRole.id, 'Rol automático asignado al unirse al servidor').catch(() => null);
            }
        }

        const config = getWelcomeConfig(member.guild.id);
        if (!config?.enabled || !config?.channelId) return;

        try {
            const channel = member.guild.channels.cache.get(config.channelId);
            if (!channel) return;

            // Generate welcome card
            const attachment = await generateCard(member, 'welcome', config);

            // Build message with variables
            let message = config.message || '¡Bienvenido/a {user} a **{server}**! 🎉';
            message = replaceMemberPlaceholders(message, member, { useMentionForUser: true });

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
