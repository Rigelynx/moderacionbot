import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { handleError, logInfo, logSuccess, logWarning } from './utils/logger.js';
import { setupGuild } from './utils/guildSetup.js';
import { loadConfig } from './utils/config.js';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.slashCommands = new Collection();

client.mutedRoleName = 'Silenciado';
client.warningCounts = new Map();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadCommands() {
    const commandFolders = readdirSync(join(__dirname, 'commands'));
    
    for (const folder of commandFolders) {
        const commandFiles = readdirSync(join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
        
        for (const file of commandFiles) {
            const { command } = await import(`./commands/${folder}/${file}`);
            client.slashCommands.set(command.name, command);
        }
    }
    
    logSuccess(`Slash commands cargados: ${client.slashCommands.size}`);
}

async function registerSlashCommands(client) {
    const commands = [];
    
    for (const [name, command] of client.slashCommands) {
        const cmdData = {
            name: command.name,
            description: command.description,
        };
        
        if (command.options) {
            cmdData.options = command.options;
        }
        
        commands.push(cmdData);
    }
    
    try {
        const guildId = process.env.GUILD_ID;
        if (guildId) {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await guild.commands.set(commands);
                logSuccess(`Slash commands registrados en el servidor: ${guild.name}`);
            } else {
                logWarning(`Servidor con ID ${guildId} no encontrado`);
            }
        } else {
            await client.application.commands.set(commands);
            logSuccess(`Slash commands registrados globalmente`);
        }
    } catch (error) {
        handleError('Error registrando slash commands', error);
    }
}

async function loadEvents() {
    const eventFiles = readdirSync(join(__dirname, 'events')).filter(f => f.endsWith('.js'));
    
    for (const file of eventFiles) {
        const event = (await import(`./events/${file}`)).default;
        const eventName = file.replace('.js', '');
        
        if (event.once) {
            client.once(eventName, (...args) => event.execute(...args, client));
        } else {
            client.on(eventName, (...args) => event.execute(...args, client));
        }
    }
    
    logSuccess(`Eventos cargados: ${eventFiles.length}`);
}

client.on('clientReady', async () => {
    logInfo(`Bot conectado como ${client.user.tag}`);
    logInfo(`Sirviendo en ${client.guilds.cache.size} servidores`);
    
    await registerSlashCommands(client);
    
    for (const guild of client.guilds.cache.values()) {
        await setupGuild(guild, client);
    }
});

client.on('guildCreate', async (guild) => {
    logInfo(`Nuevo servidor: ${guild.name}`);
    await setupGuild(guild, client);
});

(async () => {
    try {
        loadConfig();
        await loadCommands();
        await loadEvents();
        await client.login(process.env.TOKEN);
    } catch (err) {
        handleError('Error al iniciar sesión', err);
    }
})();
