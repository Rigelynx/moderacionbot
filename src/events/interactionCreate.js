export default {
    name: 'interactionCreate',
    once: false,
    
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;
        
        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error ejecutando slash command ${interaction.commandName}:`, error);
            await interaction.reply({
                content: '❌ Hubo un error al ejecutar el comando.',
                flags: 64
            });
        }
    }
};
