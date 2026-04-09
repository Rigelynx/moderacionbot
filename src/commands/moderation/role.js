import { EmbedBuilder, Role } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'role',
    description: 'Gestionar roles del servidor',
    options: [
        {
            name: 'create',
            description: 'Crear un nuevo rol',
            type: 1,
            options: [
                {
                    name: 'nombre',
                    type: 3,
                    description: 'Nombre del rol',
                    required: true
                },
                {
                    name: 'color',
                    type: 3,
                    description: 'Color del rol (nombre o hex: red, #5865f2)',
                    required: false
                }
            ]
        },
        {
            name: 'delete',
            description: 'Eliminar un rol',
            type: 1,
            options: [
                {
                    name: 'rol',
                    type: 8,
                    description: 'Rol a eliminar',
                    required: true
                }
            ]
        },
        {
            name: 'add',
            description: 'Añadir un rol a un usuario',
            type: 1,
            options: [
                {
                    name: 'usuario',
                    type: 6,
                    description: 'Usuario',
                    required: true
                },
                {
                    name: 'rol',
                    type: 8,
                    description: 'Rol a añadir',
                    required: true
                }
            ]
        },
        {
            name: 'remove',
            description: 'Quitar un rol a un usuario',
            type: 1,
            options: [
                {
                    name: 'usuario',
                    type: 6,
                    description: 'Usuario',
                    required: true
                },
                {
                    name: 'rol',
                    type: 8,
                    description: 'Rol a quitar',
                    required: true
                }
            ]
        },
        {
            name: 'list',
            description: 'Listar todos los roles',
            type: 1
        }
    ],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'create':
                await this.createRole(interaction, client);
                break;
            case 'delete':
                await this.deleteRole(interaction, client);
                break;
            case 'add':
                await this.addRole(interaction, client);
                break;
            case 'remove':
                await this.removeRole(interaction, client);
                break;
            case 'list':
                await this.listRoles(interaction);
                break;
        }
    },
    
    async createRole(interaction, client) {
        const name = interaction.options.getString('nombre');
        const colorInput = interaction.options.getString('color');
        
        let color = 0x5865f2;
        if (colorInput) {
            if (colorInput.startsWith('#')) {
                color = parseInt(colorInput.slice(1), 16);
            } else {
                const colorMap = {
                    red: 0xff0000, blue: 0x0000ff, green: 0x00ff00,
                    yellow: 0xffff00, purple: 0x800080, orange: 0xffa500,
                    pink: 0xff69b4, white: 0xffffff, black: 0x000000
                };
                color = colorMap[colorInput.toLowerCase()] || 0x5865f2;
            }
        }
        
        try {
            const role = await interaction.guild.roles.create({
                name: name,
                color: color
            });
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle('✅ Rol Creado')
                .addFields(
                    { name: 'Nombre', value: role.name, inline: true },
                    { name: 'Color', value: colorInput || 'Por defecto', inline: true },
                    { name: 'Posición', value: `${role.position}`, inline: true },
                    { name: 'Moderador', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ Error al crear el rol: ${error.message}`, flags: 64 });
        }
    },
    
    async deleteRole(interaction, client) {
        const role = interaction.options.getRole('rol');
        
        if (role.comparePositionTo(interaction.guild.members.me.roles.highest) >= 0) {
            return interaction.reply({ content: '❌ No puedo eliminar este rol (está por encima del mío).', flags: 64 });
        }
        
        try {
            const roleName = role.name;
            await role.delete();
            
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🗑️ Rol Eliminado')
                .addFields(
                    { name: 'Nombre', value: roleName },
                    { name: 'Moderador', value: interaction.user.tag }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ Error al eliminar el rol: ${error.message}`, flags: 64 });
        }
    },
    
    async addRole(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const role = interaction.options.getRole('rol');
        
        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }
        
        if (user.roles.cache.has(role.id)) {
            return interaction.reply({ content: `❌ ${user.user.tag} ya tiene el rol ${role.name}.`, flags: 64 });
        }
        
        try {
            await user.roles.add(role);
            
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Rol Añadido')
                .addFields(
                    { name: 'Usuario', value: user.user.tag, inline: true },
                    { name: 'Rol', value: role.name, inline: true },
                    { name: 'Moderador', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ Error al añadir el rol: ${error.message}`, flags: 64 });
        }
    },
    
    async removeRole(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const role = interaction.options.getRole('rol');
        
        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }
        
        if (!user.roles.cache.has(role.id)) {
            return interaction.reply({ content: `❌ ${user.user.tag} no tiene el rol ${role.name}.`, flags: 64 });
        }
        
        try {
            await user.roles.remove(role);
            
            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('➖ Rol Quitado')
                .addFields(
                    { name: 'Usuario', value: user.user.tag, inline: true },
                    { name: 'Rol', value: role.name, inline: true },
                    { name: 'Moderador', value: interaction.user.tag, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ Error al quitar el rol: ${error.message}`, flags: 64 });
        }
    },
    
    async listRoles(interaction) {
        const roles = interaction.guild.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position);
        
        const roleList = roles.map(r => `${r} - ${r.members.size} miembros`).join('\n');
        
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📋 Roles del Servidor (${roles.size})`)
            .setDescription(roleList || 'No hay roles personalizados')
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
