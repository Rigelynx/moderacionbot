import { EmbedBuilder, PermissionsBitField } from 'discord.js';

export default {
    name: 'messageCreate',
    once: false,
    
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.content.startsWith(client.prefix)) return;
        
        const args = message.content.slice(client.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands.get(commandName);
        if (!command) return;
        
        if (command.requirePermissions?.length) {
            const hasPermission = command.requirePermissions.some(perm => 
                message.member.permissions.has(PermissionsBitField.Flags[perm])
            );
            
            if (!hasPermission && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ No tienes permisos para usar este comando.');
            }
        }
        
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error ejecutando comando ${commandName}:`, error);
            message.reply('❌ Hubo un error al ejecutar el comando.');
        }
    }
};
