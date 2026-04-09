import { REST, Routes, Client, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

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
                
                commands.push(cmdData);
                console.log(`✅ Comando registrado: /${command.name}`);
            }
        }
    }
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    try {
        console.log(`\n📤 Registrando ${commands.length} comandos de barra...`);
        
        const guildId = process.env.GUILD_ID;
        
        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands }
            );
            console.log(`✅ Comandos registrados en el servidor: ${guildId}`);
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
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
