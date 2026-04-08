import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'warnings',
    description: 'Ver las advertencias de un usuario',
    usage: '!warnings [@usuario]'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    const warns = client.warningCounts.get(user.id) || 0;
    
    const embed = new EmbedBuilder()
        .setColor(0xffff00)
        .setTitle('📋 Registro de Advertencias')
        .addFields(
            { name: 'Usuario', value: user.user.tag, inline: true },
            { name: 'Advertencias', value: `${warns}/5`, inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
