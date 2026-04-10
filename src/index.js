import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { handleError, logInfo, logSuccess } from './utils/logger.js';
import { setupGuild } from './utils/guildSetup.js';
import { loadConfig } from './utils/config.js';
import { loadWarnings } from './utils/warnings.js';

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

client.on('ready', async () => {
    logInfo(`Bot conectado como ${client.user.username}`);
    logInfo(`Sirviendo en ${client.guilds.cache.size} servidores`);

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
        loadWarnings();
        await loadCommands();
        await loadEvents();
        await client.login(process.env.TOKEN);
    } catch (err) {
        handleError('Error al iniciar sesión', err);
    }
})();
