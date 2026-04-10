import { 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from 'discord.js';
import { getTicketsConfig } from '../../utils/config.js';
import { handleTicketClose } from '../../utils/ticketCore.js';

export const command = {
    name: 'ticket',
    description: 'Gestión avanzada del sistema de tickets',
    default_member_permissions: '32', // ManageGuild
    options: [
        {
            name: 'setup',
            description: 'Envía el panel para abrir tickets en el canal actual',
            type: 1 // SUB_COMMAND
        },
        {
            name: 'add',
            description: 'Añade un usuario al ticket actual',
            type: 1,
            options: [
                {
                    name: 'usuario',
                    description: 'Usuario a añadir',
                    type: 6, // USER
                    required: true
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remueve un usuario del ticket actual',
            type: 1,
            options: [
                {
                    name: 'usuario',
                    description: 'Usuario a remover',
                    type: 6, // USER
                    required: true
                }
            ]
        },
        {
            name: 'close',
            description: 'Cierra el ticket actual de forma forzada y genera el transcript',
            type: 1
        }
    ],

    async execute(interaction, client) {
        // En discord.js v14 extraer de options requiere usar el getter getSubcommand
        const subcommand = interaction.options.getSubcommand();
        const config = getTicketsConfig(interaction.guild.id);

        if (!config.enabled) {
            return interaction.reply({ content: '❌ El sistema de tickets no está activado en este servidor.', flags: 64 });
        }

        // COMANDO: SETUP
        if (subcommand === 'setup') {
            if (!config.categoryId) {
                 return interaction.reply({ content: '❌ Debes configurar una categoría de tickets en el Dashboard web primero antes de enviar este panel.', flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎫 Soporte Técnico')
                .setDescription('Haz clic en el botón de abajo para abrir un ticket y contactar con el equipo de soporte. Por favor, no abras tickets sin motivo o serás sancionado.')
                .setColor(0x2b2d31)
                .setFooter({ text: 'Sistema de Tickets Seguro' });

            const button = new ButtonBuilder()
                .setCustomId('ticket_create')
                .setLabel('Abrir Ticket')
                .setEmoji('✉️')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            await interaction.channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ Panel de tickets enviado correctamente.', flags: 64 });
        }

        // Verificaciones recurrentes
        if (subcommand === 'add' || subcommand === 'remove' || subcommand === 'close') {
            if (interaction.channel.parentId !== config.categoryId) {
                return interaction.reply({ content: '❌ Este comando sólo puede usarse dentro de un canal de ticket.', flags: 64 });
            }
        }

        // COMANDO: ADD
        if (subcommand === 'add') {
            const tempUser = interaction.options.getUser('usuario');
            if (tempUser.bot) return interaction.reply({ content: '❌ No puedes añadir a bots.', flags: 64 });

            try {
                await interaction.channel.permissionOverwrites.edit(tempUser.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true
                });
                return interaction.reply({ content: `✅ Agregado correctamente al ticket: ${tempUser}` });
            } catch (err) {
                return interaction.reply({ content: '❌ Hubo un error modificando permisos.', flags: 64 });
            }
        }

        // COMANDO: REMOVE
        if (subcommand === 'remove') {
            const tempUser = interaction.options.getUser('usuario');
            
            try {
                await interaction.channel.permissionOverwrites.edit(tempUser.id, {
                    ViewChannel: false,
                    SendMessages: false,
                    ReadMessageHistory: false
                });
                return interaction.reply({ content: `✅ ${tempUser} eliminado de este ticket.` });
            } catch (err) {
                return interaction.reply({ content: '❌ Hubo un error quitando accesos al usuario.', flags: 64 });
            }
        }

        // COMANDO: CLOSE
        if (subcommand === 'close') {
            return handleTicketClose(interaction);
        }
    }
};
