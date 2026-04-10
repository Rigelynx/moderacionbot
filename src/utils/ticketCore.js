import { 
    ChannelType, 
    PermissionsBitField, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from 'discord.js';
import discordTranscripts from 'discord-html-transcripts';
import { getTicketsConfig } from './config.js';
import { sendLog } from './embeds.js';

/**
 * Módulo Core para creación y clausura de tickets
 */

export async function handleTicketCreate(interaction) {
    const guildId = interaction.guild.id;
    const config = getTicketsConfig(guildId);

    if (!config.enabled) {
        return interaction.reply({ content: '❌ El sistema de tickets está desactivado en este servidor.', flags: 64 });
    }

    if (!config.categoryId) {
        return interaction.reply({ content: '❌ La categoría de tickets no está configurada. Avisa a un administrador.', flags: 64 });
    }

    const category = interaction.guild.channels.cache.get(config.categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.reply({ content: '❌ La categoría configurada no es válida.', flags: 64 });
    }

    // Comprobar si el usuario ya tiene un ticket abierto
    const ticketName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketName && c.parentId === config.categoryId);
    
    if (existingChannel) {
        return interaction.reply({ content: `❌ Ya tienes un ticket abierto: <#${existingChannel.id}>`, flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    try {
        // Preparar array de permisos inicial: quitar ViewChannel al everyone
        const permissionOverwrites = [
            {
                id: interaction.guild.id, // @everyone
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id, // Creador del ticket
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles
                ],
            },
            {
                id: interaction.client.user.id, // El bot
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ReadMessageHistory
                ],
            }
        ];

        // Añadir el rol de staff si está configurado
        if (config.roleId) {
            const role = interaction.guild.roles.cache.get(config.roleId);
            if (role) {
                permissionOverwrites.push({
                    id: role.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ],
                });
            }
        }

        // Crear el canal
        const ticketChannel = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissionOverwrites,
            topic: `Ticket de ${interaction.user.tag} (ID: ${interaction.user.id})`
        });

        // Respuesta en el canal creado
        const embed = new EmbedBuilder()
            .setTitle('🎫 Ticket de Soporte')
            .setDescription(`¡Hola ${interaction.user}!\n\nUn miembro del equipo de soporte te atenderá en breve.\nPor favor, describe tu problema detalladamente.`)
            .setColor(0x5865F2)
            .setTimestamp();

        const closeButton = new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Cerrar Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');

        const row = new ActionRowBuilder().addComponents(closeButton);

        const pingMessage = config.roleId ? `<@&${config.roleId}> | ${interaction.user}` : `${interaction.user}`;
        await ticketChannel.send({ content: pingMessage, embeds: [embed], components: [row] });

        // Confirmar creación
        await interaction.followUp({ content: `✅ Ticket creado exitosamente: ${ticketChannel}` });

        sendLog(interaction.guild, `🎫 Ticket creado por ${interaction.user.tag} (${ticketChannel.name})`, interaction.client);

    } catch (error) {
        console.error('Error creando ticket:', error);
        await interaction.followUp({ content: '❌ Hubo un error al intentar crear el canal del ticket.' });
    }
}

export async function handleTicketClose(interaction) {
    const channel = interaction.channel;
    
    // Verificar que estemos en un canal de ticket válido (por parentId)
    const config = getTicketsConfig(interaction.guild.id);
    if (!config.enabled || channel.parentId !== config.categoryId) {
        return interaction.reply({ content: '❌ Este no es un canal de ticket válido o el sistema está apagado.', flags: 64 });
    }

    // Notificar proceso de cierre
    await interaction.reply({ content: '🔒 Compilando transcripción y cerrando ticket en unos segundos...' });

    try {
        // Generar transcript
        const attachment = await discordTranscripts.createTranscript(channel, {
            limit: -1, // Capturar todo
            returnType: 'attachment',
            filename: `${channel.name}-transcript.html`,
            saveImages: true,
            poweredBy: false
        });

        // Identificar canal de destino (específico de tickets o general)
        let logChannelObj = null;
        if (config.logChannelId) {
            logChannelObj = interaction.guild.channels.cache.get(config.logChannelId);
        }

        // Crear embed informando del cierre
        const logEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Cerrado')
            .setColor(0xFF0000)
            .addFields(
                { name: 'Ticket', value: channel.name, inline: true },
                { name: 'Cerrado por', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();

        // Enviar transcript al canal log si existe
        if (logChannelObj && logChannelObj.isTextBased()) {
            await logChannelObj.send({ embeds: [logEmbed], files: [attachment] });
        } else {
            // Si falla o no está configurado, mandar por sendLog global
            sendLog(interaction.guild, `🔒 **Ticket Cerrado:** ${channel.name} por ${interaction.user.tag}\n*(Mira el archivo adjunto para el historial)*`, interaction.client, attachment);
        }

        // Borrar canal asíncronamente con un leve delay
        setTimeout(async () => {
            try {
                await channel.delete('Cierre de ticket');
            } catch(e) {
                console.error("Error al borrar canal del ticket", e);
            }
        }, 3000);

    } catch (error) {
        console.error('Error cerrando ticket y generando transcript:', error);
        await interaction.editReply({ content: '❌ Ocurrió un error al intentar generar la transcripción o cerrar el canal.' });
    }
}
