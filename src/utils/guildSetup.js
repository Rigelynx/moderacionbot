import { logSuccess, logError } from './logger.js';
import { getLogChannelName } from './config.js';

export async function setupGuild(guild, client) {
    await createMutedRole(guild, client);
    await createLogChannel(guild, client);
}

async function createMutedRole(guild, client) {
    const existingRole = guild.roles.cache.find(role => role.name === client.mutedRoleName);
    
    if (existingRole) return existingRole;
    
    try {
        const role = await guild.roles.create({
            name: client.mutedRoleName,
            color: 0x808080,
            reason: 'Rol para usuarios silenciados'
        });
        logSuccess(`Rol "Silenciado" creado en ${guild.name}`);
        return role;
    } catch (error) {
        logError(`Error creando rol en ${guild.name}: ${error.message}`);
        return null;
    }
}

async function createLogChannel(guild, client) {
    const channelName = getLogChannelName(guild.id);
    const existingChannel = guild.channels.cache.find(ch => ch.name === channelName);
    
    if (existingChannel) return existingChannel;
    
    try {
        const category = guild.channels.cache.find(c => c.name === 'Moderación' && c.type === 4);
        
        const channel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: category?.id,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: ['ViewChannel'] }
            ]
        });
        
        logSuccess(`Canal de logs creado en ${guild.name}`);
        return channel;
    } catch (error) {
        logError(`Error creando canal en ${guild.name}: ${error.message}`);
        return null;
    }
}
