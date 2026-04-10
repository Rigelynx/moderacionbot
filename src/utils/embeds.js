import { EmbedBuilder } from 'discord.js';
import { isLogsEnabled, getLogChannelName } from './config.js';

export function createModerationEmbed({ color, title, user, moderator, fields = [] }) {
    // Maneja tanto GuildMember (.user.username) como User (.username)
    const targetUser = user.user || user;

    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields([
            { name: 'Usuario', value: `${targetUser.username} (${user.id})`, inline: true },
            { name: 'Moderador', value: moderator.username, inline: true },
            ...fields
        ])
        .setTimestamp();
}

export async function sendLog(guild, content, client) {
    if (!isLogsEnabled(guild.id)) return;

    const channelName = getLogChannelName(guild.id);
    const logChannel = guild.channels.cache.find(ch => ch.name === channelName);
    if (logChannel) {
        await logChannel.send(content).catch(() => {});
    }
}
