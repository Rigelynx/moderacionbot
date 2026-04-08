import { EmbedBuilder } from 'discord.js';
import { getStatusEmoji } from '../../utils/helpers.js';

export const command = {
    name: 'userinfo',
    aliases: ['ui'],
    description: 'Ver información de un usuario',
    usage: '!userinfo [@usuario]'
};

export async function execute(message, args, client) {
    const user = message.mentions.members.first() || message.member;
    const member = await message.guild.members.fetch(user.id);
    
    const embed = new EmbedBuilder()
        .setColor(user.displayHexColor || 0x5865f2)
        .setTitle(`${getStatusEmoji(user.user.presence?.status)} Información de ${user.user.username}`)
        .setThumbnail(user.user.displayAvatarURL({ size: 1024, dynamic: true }))
        .addFields(
            { name: 'Nombre', value: user.user.tag, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Apodo', value: user.nickname || 'Ninguno', inline: true },
            { name: 'Rol más alto', value: user.roles.highest.name, inline: true },
            { name: 'Cuenta creada', value: user.user.createdAt.toLocaleDateString('es-ES'), inline: true },
            { name: 'Entró al servidor', value: member.joinedAt.toLocaleDateString('es-ES'), inline: true },
            { name: 'Roles', value: user.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Ninguno' }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
