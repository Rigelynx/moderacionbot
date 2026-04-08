import { EmbedBuilder } from 'discord.js';

export function createModerationEmbed({ color, title, user, moderator, fields = [] }) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields([
            { name: 'Usuario', value: `${user.user.tag} (${user.id})`, inline: true },
            { name: 'Moderador', value: moderator.tag, inline: true },
            ...fields
        ])
        .setTimestamp();
}

export async function sendLog(guild, content, client) {
    const logChannel = guild.channels.cache.find(ch => ch.name === client.logChannelName);
    if (logChannel) {
        await logChannel.send(content);
    }
}
