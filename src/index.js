import { Client, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { handleError, logInfo, logSuccess, logWarning } from './utils/logger.js';
import { setupGuild } from './utils/guildSetup.js';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.Moderation
    ]
});

client.commands = new Map();
client.prefix = '/';
client.mutedRoleName = 'Silenciado';
client.logChannelName = 'logs-moderacion';
client.warningCounts = new Map();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadCommands() {
    const commandFolders = readdirSync(join(__dirname, 'commands'));
    
    for (const folder of commandFolders) {
        const commandFiles = readdirSync(join(__dirname, 'commands', folder)).filter(f => f.endsWith('.js'));
        
        for (const file of commandFiles) {
            const { command } = await import(`./commands/${folder}/${file}`);
            client.commands.set(command.name, command);
            command.aliases?.forEach(alias => client.commands.set(alias, command));
        }
    }
    
    logSuccess(`Comandos cargados: ${client.commands.size}`);
}

function loadEvents() {
    const eventFiles = readdirSync(join(__dirname, 'events')).filter(f => f.endsWith('.js'));
    
    for (const file of eventFiles) {
        const event = await import(`./events/${file}`).then(m => m.default);
        const eventName = file.replace('.js', '');
        
        if (event.once) {
            client.once(eventName, (...args) => event.execute(...args, client));
        } else {
            client.on(eventName, (...args) => event.execute(...args, client));
        }
    }
    
    logSuccess(`Eventos cargados: ${eventFiles.length}`);
}

client.on('ready', async (client) => {
    logInfo(`Bot conectado como ${client.user.tag}`);
    logInfo(`Sirviendo en ${client.guilds.cache.size} servidores`);
    
    for (const guild of client.guilds.cache.values()) {
        await setupGuild(guild, client);
    }
});

client.on('guildCreate', async (guild) => {
    logInfo(`Nuevo servidor: ${guild.name}`);
    await setupGuild(guild, client);
});

client.login(process.env.TOKEN).then(() => {
    loadCommands();
    loadEvents();
}).catch(err => handleError('Error al iniciar sesión', err));
