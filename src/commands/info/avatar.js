import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'avatar',
    aliases: ['av'],
    description: 'Ver el avatar de un usuario',
    usage: '!avatar [@usuario]'
};

export async function execute(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🖼️ Avatar de ${user.username}`)
        .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
        .addFields(
            { name: 'Usuario', value: user.tag },
            { name: 'URL', value: `[Click aquí](${user.displayAvatarURL({ size: 1024 })})` }
        );
    
    await message.reply({ embeds: [embed] });
}
