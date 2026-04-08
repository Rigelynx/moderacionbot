import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { parseDuration } from '../../utils/helpers.js';

export const command = {
    name: 'mute',
    description: 'Silenciar a un usuario',
    requirePermissions: ['ModerateMembers'],
    usage: '!mute @usuario [duración]'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const duration = args[1];
    
    if (!user) {
        return message.reply('❌ Menciona un usuario o proporciona su ID.');
    }
    
    if (user.isCommunicationDisabled()) {
        return message.reply('❌ Este usuario ya está silenciado.');
    }
    
    let durationText = 'indefinido';
    if (duration) {
        const durationMs = parseDuration(duration);
        if (durationMs) {
            await user.timeout(durationMs);
            durationText = duration;
        }
    }
    
    const embed = createModerationEmbed({
        color: 0x808080,
        title: '🔇 Usuario Silenciado',
        user,
        moderator: message.author,
        fields: [{ name: 'Duración', value: durationText }]
    });
    
    await message.reply({ embeds: [embed] });
    await sendLog(message.guild, { embeds: [embed] }, client);
}
