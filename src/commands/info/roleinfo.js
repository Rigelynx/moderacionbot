import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'roleinfo',
    description: 'Ver información detallada de un rol',
    options: [
        {
            name: 'rol',
            type: 8,
            description: 'Rol a consultar',
            required: true
        }
    ],
    async execute(interaction) {
        const role = interaction.options.getRole('rol');
        const members = role.members.size;

        const keyPerms = [];
        if (role.permissions.has('Administrator')) keyPerms.push('Administrador');
        if (role.permissions.has('ManageGuild')) keyPerms.push('Gestionar Servidor');
        if (role.permissions.has('ManageChannels')) keyPerms.push('Gestionar Canales');
        if (role.permissions.has('ManageRoles')) keyPerms.push('Gestionar Roles');
        if (role.permissions.has('BanMembers')) keyPerms.push('Banear');
        if (role.permissions.has('KickMembers')) keyPerms.push('Expulsar');
        if (role.permissions.has('ModerateMembers')) keyPerms.push('Moderar');
        if (role.permissions.has('ManageMessages')) keyPerms.push('Gestionar Mensajes');
        if (role.permissions.has('MentionEveryone')) keyPerms.push('Mencionar @everyone');

        const embed = new EmbedBuilder()
            .setColor(role.color || 0x5865f2)
            .setTitle(`🎭 Información del Rol: ${role.name}`)
            .addFields(
                { name: 'ID', value: role.id, inline: true },
                { name: 'Color', value: role.hexColor, inline: true },
                { name: 'Miembros', value: members.toString(), inline: true },
                { name: 'Posición', value: role.position.toString(), inline: true },
                { name: 'Mencionable', value: role.mentionable ? 'Sí' : 'No', inline: true },
                { name: 'Mostrar separado', value: role.hoist ? 'Sí' : 'No', inline: true },
                { name: 'Creado', value: role.createdAt.toLocaleDateString('es-ES'), inline: true },
                { name: 'Permisos clave', value: keyPerms.length > 0 ? keyPerms.join(', ') : 'Ninguno destacable' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
