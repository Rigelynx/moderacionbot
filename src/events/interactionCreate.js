import {
    handleTicketCreate,
    handleTicketCreateModal,
    handleTicketCloseModal,
    handleTicketCloseRequest,
    handleTicketClaim,
    handleTicketTypeSelect,
    getTicketButtonIds
} from '../utils/ticketCore.js';
import { checkCommandAccess } from '../utils/commandPermissions.js';

const ticketButtons = getTicketButtonIds();

export default {
    name: 'interactionCreate',
    once: false,

    async execute(interaction, client) {
        if (interaction.isButton()) {
            try {
                if (interaction.customId === ticketButtons.create) {
                    return await handleTicketCreate(interaction);
                }
                if (interaction.customId === ticketButtons.claim) {
                    return await handleTicketClaim(interaction);
                }
                if (interaction.customId === ticketButtons.close) {
                    return await handleTicketCloseRequest(interaction);
                }
            } catch (error) {
                console.error(`Error procesando botón ${interaction.customId}:`, error);
                
                const content = '❌ Hubo un error al procesar esta acción.';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, flags: 64 }).catch(() => {});
                } else {
                    await interaction.reply({ content, flags: 64 }).catch(() => {});
                }
                return;
            }
        }

        if (interaction.isStringSelectMenu()) {
            try {
                if (interaction.customId === ticketButtons.typeSelect) {
                    return await handleTicketTypeSelect(interaction);
                }
            } catch (error) {
                console.error(`Error procesando select ${interaction.customId}:`, error);

                const content = '❌ Hubo un error al procesar esta selección.';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, flags: 64 }).catch(() => {});
                } else {
                    await interaction.reply({ content, flags: 64 }).catch(() => {});
                }
                return;
            }
        }

        if (interaction.isModalSubmit()) {
            try {
                if (interaction.customId.startsWith(`${ticketButtons.createModalPrefix}:`)) {
                    return await handleTicketCreateModal(interaction);
                }
                if (interaction.customId === ticketButtons.closeModalId) {
                    return await handleTicketCloseModal(interaction);
                }
            } catch (error) {
                console.error(`Error procesando modal ${interaction.customId}:`, error);

                const content = '❌ Hubo un error al procesar el formulario.';
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content, flags: 64 }).catch(() => {});
                } else {
                    await interaction.reply({ content, flags: 64 }).catch(() => {});
                }
                return;
            }
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        const commandAccess = checkCommandAccess(interaction, interaction.commandName);
        if (!commandAccess.allowed) {
            return interaction.reply({
                content: commandAccess.reason,
                flags: 64
            }).catch(() => {});
        }

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
