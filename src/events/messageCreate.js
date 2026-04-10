import { Events, EmbedBuilder } from 'discord.js';
import { getAfk, removeAfk } from '../utils/afk.js';

export default {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

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
            message.mentions.users.forEach(user => {
                const targetAfk = getAfk(message.guild.id, user.id);
                if (targetAfk) {
                    const timeAgo = Math.floor(targetAfk.timestamp / 1000);
                    const embed = new EmbedBuilder()
                        .setColor(0xffa500)
                        .setDescription(`💤 **${user.username}** está actualmente AFK.\n**Razón:** ${targetAfk.reason}\n**Desde:** <t:${timeAgo}:R>`);
                    
                    message.reply({ embeds: [embed] })
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000));
                }
            });
        }
    }
};
