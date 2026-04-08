import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'unlock',
    description: 'Desbloquear el canal actual',
    requirePermissions: ['ManageChannels'],
    usage: '!unlock'
};

export async function execute(message, args, client) {
    const channel = message.channel;
    
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null
    });
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🔓 Canal Desbloqueado')
        .setDescription(`El canal ${channel.name} ha sido desbloqueado.`)
        .addFields({ name: 'Moderador', value: message.author.tag })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
