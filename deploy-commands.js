import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Extraer CLIENT_ID automáticamente del token
function getClientIdFromToken(token) {
    try {
        return Buffer.from(token.split('.')[0], 'base64').toString();
    } catch {
        return null;
    }
}

async function deployCommands() {
    const commands = [];
    const commandFolders = readdirSync(join(__dirname, 'src', 'commands'));

    for (const folder of commandFolders) {
        const commandFiles = readdirSync(join(__dirname, 'src', 'commands', folder))
            .filter(f => f.endsWith('.js'));

        for (const file of commandFiles) {
            const { command } = await import(`./src/commands/${folder}/${file}`);

            if (command && command.name && command.description) {
                const cmdData = {
                    name: command.name,
                    description: command.description,
                };

                if (command.options) {
                    cmdData.options = command.options;
                }

                if (command.default_member_permissions !== undefined) {
                    cmdData.default_member_permissions = command.default_member_permissions;
                }

                commands.push(cmdData);
                console.log(`✅ Comando registrado: /${command.name}`);
            }
        }
    }

    const clientId = process.env.CLIENT_ID || getClientIdFromToken(process.env.TOKEN);

    if (!clientId) {
        console.error('❌ No se pudo obtener el CLIENT_ID. Agrégalo al archivo .env');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log(`\n📤 Registrando ${commands.length} comandos de barra...`);

        const guildId = process.env.GUILD_ID;

        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );
            console.log(`✅ Comandos registrados en el servidor: ${guildId}`);
        } else {
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );
            console.log('✅ Comandos registrados globalmente');
        }

        console.log(`\n🎉 ${commands.length} comandos registrados exitosamente!`);
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error);
    }
}

deployCommands();
