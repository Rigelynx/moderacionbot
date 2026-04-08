import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'unmute',
    description: 'Quitar el silencio a un usuario',
    requirePermissions: ['ModerateMembers'],
    usage: '!unmute @usuario'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    
    if (!user) {
        return message.reply('❌ Menciona un usuario o proporciona su ID.');
    }
    
    if (!user.isCommunicationDisabled()) {
        return message.reply('❌ Este usuario no está silenciado.');
    }
    
    await user.timeout(null);
    
    const embed = createModerationEmbed({
        color: 0x00ff00,
        title: '🔊 Usuario Desilenciado',
        user,
        moderator: message.author
    });
    
    await message.reply({ embeds: [embed] });
    await sendLog(message.guild, { embeds: [embed] }, client);
}
