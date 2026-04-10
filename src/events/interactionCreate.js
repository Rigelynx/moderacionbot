import { handleTicketCreate, handleTicketClose } from '../utils/ticketCore.js';

export default {
    name: 'interactionCreate',
    once: false,

    async execute(interaction, client) {
        if (interaction.isButton()) {
            if (interaction.customId === 'ticket_create') {
                return await handleTicketCreate(interaction);
            }
            if (interaction.customId === 'ticket_close') {
                return await handleTicketClose(interaction);
            }
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error ejecutando slash command ${interaction.commandName}:`, error);

            const content = '❌ Hubo un error al ejecutar el comando.';
            const options = { content, flags: 64 };

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch {
                // No se pudo responder, ignorar silenciosamente
            }
        }
    }
};
