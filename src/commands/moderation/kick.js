import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'kick',
    description: 'Expulsar a un usuario del servidor',
    requirePermissions: ['KickMembers'],
    usage: '!kick @usuario [razón]'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'No especificada';
    
    if (!user) {
        return message.reply('❌ Menciona un usuario o proporciona su ID.');
    }
    
    if (!user.kickable) {
        return message.reply('❌ No puedo expulsar a este usuario.');
    }
    
    const embed = createModerationEmbed({
        color: 0xffa500,
        title: '👢 Usuario Expulsado',
        user,
        moderator: message.author,
        fields: [{ name: 'Razón', value: reason }]
    });
    
    await user.kick(reason);
    await message.reply({ embeds: [embed] });
    await sendLog(message.guild, { embeds: [embed] }, client);
}
