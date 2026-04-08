import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'clear',
    aliases: ['purge'],
    description: 'Eliminar mensajes del canal',
    requirePermissions: ['ManageMessages'],
    usage: '!clear [cantidad]'
};

export async function execute(message, args, client) {
    const amount = parseInt(args[0]);
    
    if (!amount || amount < 1 || amount > 100) {
        return message.reply('❌ Proporciona un número entre 1 y 100.');
    }
    
    const messages = await message.channel.messages.fetch({ limit: amount });
    await message.channel.bulkDelete(messages);
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🗑️ Mensajes Eliminados')
        .addFields(
            { name: 'Cantidad', value: `${messages.size}`, inline: true },
            { name: 'Canal', value: message.channel.name, inline: true },
            { name: 'Moderador', value: message.author.tag }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] }).then(msg => {
        setTimeout(() => msg.delete(), 3000);
    });
}
