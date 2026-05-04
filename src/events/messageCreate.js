import { Events, EmbedBuilder } from 'discord.js';
import { getAfk, removeAfk } from '../utils/afk.js';
import { handleMessageCreateAntiRaid } from '../utils/antiRaid.js';

function truncate(text, maxLength = 120) {
    const normalized = String(text || '').trim();
    if (!normalized) return 'AFK';
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const antiRaidResult = await handleMessageCreateAntiRaid(message, client);
        if (antiRaidResult.blocked) return;

        // 1. Revisar si el autor estaba AFK y volver a ponerlo activo
        const userAfk = getAfk(message.guild.id, message.author.id);
        if (userAfk) {
            removeAfk(message.guild.id, message.author.id);
            
            try {
                if (message.member && message.member.manageable) {
                    const nick = message.member.displayName;
                    if (nick.startsWith('[AFK] ')) {
                        await message.member.setNickname(nick.replace('[AFK] ', '').substring(0, 32));
                    }
                }
            } catch(e) {}

            message.channel.send(`👋 Bienvenido de vuelta <@${message.author.id}>, he quitado tu estado AFK.`)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        }

        // 2. Revisar si alguien mencionado está AFK
        if (message.mentions.users.size > 0 && !message.mentions.everyone) {
            const afkMentions = [];
            const seenUserIds = new Set();

            for (const user of message.mentions.users.values()) {
                if (user.id === message.author.id || seenUserIds.has(user.id)) continue;
                seenUserIds.add(user.id);

                const targetAfk = getAfk(message.guild.id, user.id);
                if (!targetAfk) continue;

                afkMentions.push({
                    user,
                    reason: truncate(targetAfk.reason, 120),
                    timestamp: Math.floor(targetAfk.timestamp / 1000)
                });
            }

            if (afkMentions.length > 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setTitle(afkMentions.length === 1 ? '💤 Usuario AFK' : '💤 Usuarios AFK')
                    .setDescription(
                        afkMentions
                            .map(item => `**${item.user.username}** está AFK\nRazón: ${item.reason}\nDesde: <t:${item.timestamp}:R>`)
                            .join('\n\n')
                            .slice(0, 4096)
                    )
                    .setFooter({
                        text: afkMentions.length === 1
                            ? 'Se avisó del estado AFK del usuario mencionado.'
                            : `Se avisó de ${afkMentions.length} usuarios en AFK.`
                    });

                message.reply({ embeds: [embed] })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 12000))
                    .catch(() => {});
            }
        }
    }
};
