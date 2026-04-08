import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'slowmode',
    description: 'Configurar modo lento en el canal',
    requirePermissions: ['ManageChannels'],
    usage: '!slowmode [segundos]'
};

export async function execute(message, args, client) {
    const seconds = parseInt(args[0]);
    
    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        return message.reply('❌ Proporciona un tiempo en segundos (0-21600).');
    }
    
    await message.channel.setRateLimitPerUser(seconds);
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🐌 Modo Lento')
        .addFields(
            { name: 'Canal', value: message.channel.name, inline: true },
            { name: 'Intervalo', value: seconds === 0 ? 'Desactivado' : `${seconds}s`, inline: true },
            { name: 'Moderador', value: message.author.tag }
        );
    
    await message.reply({ embeds: [embed] });
}
