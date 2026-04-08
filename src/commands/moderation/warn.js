import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'warn',
    description: 'Advertir a un usuario',
    usage: '!warn @usuario [razón]'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'No especificada';
    
    if (!user) {
        return message.reply('❌ Menciona un usuario o proporciona su ID.');
    }
    
    const warns = client.warningCounts.get(user.id) || 0;
    const newCount = warns + 1;
    client.warningCounts.set(user.id, newCount);
    
    const embed = createModerationEmbed({
        color: 0xffff00,
        title: '⚠️ Advertencia',
        user,
        moderator: message.author,
        fields: [
            { name: 'Razón', value: reason },
            { name: 'Total', value: `${newCount}/5` }
        ]
    });
    
    await message.reply({ embeds: [embed] });
    await sendLog(message.guild, { embeds: [embed] }, client);
    
    if (newCount >= 5) {
        await user.ban({ reason: '5 advertencias acumuladas' });
        client.warningCounts.delete(user.id);
        await message.channel.send(`🔨 ${user.user.tag} ha sido baneado por acumular 5 advertencias.`);
    }
}
