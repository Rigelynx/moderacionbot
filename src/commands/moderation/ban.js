import { EmbedBuilder } from 'discord.js';
import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { parseDuration } from '../../utils/helpers.js';

export const command = {
    name: 'ban',
    description: 'Banear a un usuario del servidor',
    requirePermissions: ['BanMembers'],
    usage: '!ban @usuario [razón]'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'No especificada';
    
    if (!user) {
        return message.reply('❌ Menciona un usuario o proporciona su ID.');
    }
    
    if (!user.bannable) {
        return message.reply('❌ No puedo banear a este usuario.');
    }
    
    const embed = createModerationEmbed({
        color: 0xff0000,
        title: '🔨 Usuario Baneado',
        user,
        moderator: message.author,
        fields: [{ name: 'Razón', value: reason }]
    });
    
    await user.ban({ reason });
    await message.reply({ embeds: [embed] });
    await sendLog(message.guild, { embeds: [embed] }, client);
}
