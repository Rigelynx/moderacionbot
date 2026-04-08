import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'lock',
    description: 'Bloquear el canal actual',
    requirePermissions: ['ManageChannels'],
    usage: '!lock'
};

export async function execute(message, args, client) {
    const channel = message.channel;
    
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false
    });
    
    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🔒 Canal Bloqueado')
        .setDescription(`El canal ${channel.name} ha sido bloqueado.`)
        .addFields({ name: 'Moderador', value: message.author.tag })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
