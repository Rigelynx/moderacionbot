import {
    ApplicationCommandOptionType,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { getTicketsConfig, updateTicketsConfig } from '../../utils/config.js';
import { getOpenTicketCount } from '../../utils/ticketStore.js';
import {
    TICKET_PRIORITY_CHOICES,
    createTicketPanelPayload,
    getPriorityLabel,
    handleTicketAdd,
    handleTicketAssign,
    handleTicketClaim,
    handleTicketClose,
    handleTicketPriority,
    handleTicketRemove,
    handleTicketRename
} from '../../utils/ticketCore.js';

const priorityChoices = TICKET_PRIORITY_CHOICES.map(choice => ({
    name: choice.name,
    value: choice.value
}));

function isGuildManager(member) {
    return (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.permissions.has(PermissionFlagsBits.ManageGuild)
    );
}

function formatChannel(value) {
    return value ? `<#${value}>` : 'No configurado';
}

function formatRole(value) {
    return value ? `<@&${value}>` : 'No configurado';
}

function formatMessagePreview(text) {
    if (!text) return 'No configurado';
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function sanitizeTypeKey(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 32);
}

function getTicketTypes(config) {
    return Array.isArray(config.types) ? config.types : [];
}

function moveTypeToFront(types, key) {
    const index = types.findIndex(type => type.key === key);
    if (index <= 0) return types;

    const next = [...types];
    const [type] = next.splice(index, 1);
    next.unshift(type);
    return next;
}

function formatTypesList(types) {
    if (!types.length) return 'No hay tipos configurados.';

    return types
        .map((type, index) => `${index === 0 ? '⭐ ' : ''}${type.emoji || '🎫'} \`${type.key}\` · **${type.label}** · ${getPriorityLabel(type.priority)} · ${type.staffRoleId ? `<@&${type.staffRoleId}>` : 'Rol global'}`)
        .join('\n')
        .slice(0, 1024);
}

export const command = {
    name: 'ticket',
    description: 'Sistema de tickets profesional y configurable',
    options: [
        {
            name: 'setup',
            description: 'Publica o actualiza el panel de apertura de tickets',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'canal',
                    description: 'Canal donde se publicara el panel',
                    type: ApplicationCommandOptionType.Channel,
                    channel_types: [ChannelType.GuildText],
                    required: false
                }
            ]
        },
        {
            name: 'status',
            description: 'Muestra el estado completo del sistema de tickets',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'config',
            description: 'Configura la parte operativa del sistema',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'habilitado', description: 'Activa o desactiva el sistema', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'categoria', description: 'Categoria donde se crearan los tickets', type: ApplicationCommandOptionType.Channel, channel_types: [ChannelType.GuildCategory], required: false },
                { name: 'rol_staff', description: 'Rol global que atendera los tickets', type: ApplicationCommandOptionType.Role, required: false },
                { name: 'canal_logs', description: 'Canal para logs y transcripciones', type: ApplicationCommandOptionType.Channel, channel_types: [ChannelType.GuildText], required: false },
                { name: 'max_abiertos', description: 'Maximo de tickets abiertos por usuario', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 5, required: false },
                { name: 'prefijo', description: 'Prefijo de nombre para canales de ticket', type: ApplicationCommandOptionType.String, required: false },
                { name: 'mencionar_staff', description: 'Menciona al staff al abrir un ticket', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'razon_cierre_obligatoria', description: 'Exige razon obligatoria al cerrar', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        },
        {
            name: 'panel',
            description: 'Configura el panel de apertura',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'canal', description: 'Canal por defecto del panel', type: ApplicationCommandOptionType.Channel, channel_types: [ChannelType.GuildText], required: false },
                { name: 'titulo', description: 'Titulo del embed del panel', type: ApplicationCommandOptionType.String, required: false },
                { name: 'descripcion', description: 'Descripcion del panel', type: ApplicationCommandOptionType.String, required: false },
                { name: 'boton', description: 'Texto del boton principal', type: ApplicationCommandOptionType.String, required: false },
                { name: 'emoji', description: 'Emoji del boton principal', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'mensaje',
            description: 'Configura el mensaje inicial dentro del ticket',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'bienvenida',
                    description: 'Variables: {user}, {server}, {ticket}, {ticketId}, {staffRole}, {type}, {priority}, {subject}',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'tipos',
            description: 'Lista los tipos de ticket configurados',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'tipo_add',
            description: 'Agrega un nuevo tipo de ticket',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'clave', description: 'Identificador unico del tipo', type: ApplicationCommandOptionType.String, required: true },
                { name: 'nombre', description: 'Nombre visible del tipo', type: ApplicationCommandOptionType.String, required: true },
                { name: 'descripcion', description: 'Descripcion corta del tipo', type: ApplicationCommandOptionType.String, required: true },
                { name: 'prioridad', description: 'Prioridad por defecto', type: ApplicationCommandOptionType.String, choices: priorityChoices, required: true },
                { name: 'emoji', description: 'Emoji del tipo', type: ApplicationCommandOptionType.String, required: false },
                { name: 'rol_staff', description: 'Rol especifico para este tipo', type: ApplicationCommandOptionType.Role, required: false },
                { name: 'predeterminado', description: 'Deja este tipo como el rapido del boton principal', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        },
        {
            name: 'tipo_edit',
            description: 'Edita un tipo de ticket existente',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'clave', description: 'Clave del tipo a editar', type: ApplicationCommandOptionType.String, required: true },
                { name: 'nombre', description: 'Nuevo nombre visible', type: ApplicationCommandOptionType.String, required: false },
                { name: 'descripcion', description: 'Nueva descripcion', type: ApplicationCommandOptionType.String, required: false },
                { name: 'prioridad', description: 'Nueva prioridad por defecto', type: ApplicationCommandOptionType.String, choices: priorityChoices, required: false },
                { name: 'emoji', description: 'Nuevo emoji', type: ApplicationCommandOptionType.String, required: false },
                { name: 'rol_staff', description: 'Nuevo rol especifico', type: ApplicationCommandOptionType.Role, required: false },
                { name: 'usar_rol_global', description: 'Quita el rol especifico y usa el rol global', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'predeterminado', description: 'Mover este tipo al boton rapido', type: ApplicationCommandOptionType.Boolean, required: false }
            ]
        },
        {
            name: 'tipo_remove',
            description: 'Elimina un tipo de ticket',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'clave', description: 'Clave del tipo a eliminar', type: ApplicationCommandOptionType.String, required: true }
            ]
        },
        { name: 'claim', description: 'Reclama o libera el ticket actual', type: ApplicationCommandOptionType.Subcommand },
        {
            name: 'assign',
            description: 'Asigna el ticket actual a otro miembro del staff',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'usuario', description: 'Miembro del staff', type: ApplicationCommandOptionType.User, required: true }
            ]
        },
        {
            name: 'priority',
            description: 'Cambia la prioridad del ticket actual',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'nivel', description: 'Nueva prioridad', type: ApplicationCommandOptionType.String, choices: priorityChoices, required: true }
            ]
        },
        {
            name: 'rename',
            description: 'Renombra el ticket actual',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'nombre', description: 'Nuevo nombre del canal', type: ApplicationCommandOptionType.String, required: true }
            ]
        },
        {
            name: 'add',
            description: 'Anade un usuario al ticket actual',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'usuario', description: 'Usuario a anadir', type: ApplicationCommandOptionType.User, required: true }
            ]
        },
        {
            name: 'remove',
            description: 'Remueve un usuario del ticket actual',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'usuario', description: 'Usuario a remover', type: ApplicationCommandOptionType.User, required: true }
            ]
        },
        {
            name: 'close',
            description: 'Cierra el ticket actual y genera transcript',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'razon', description: 'Motivo del cierre', type: ApplicationCommandOptionType.String, required: true },
                { name: 'resumen', description: 'Resumen final o resolucion', type: ApplicationCommandOptionType.String, required: false }
            ]
        }
    ],

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const currentConfig = getTicketsConfig(guildId);

        if (['setup', 'status', 'config', 'panel', 'mensaje', 'tipos', 'tipo_add', 'tipo_edit', 'tipo_remove'].includes(subcommand) && !isGuildManager(interaction.member)) {
            return interaction.reply({
                content: '❌ Solo los administradores del servidor pueden usar esta parte del sistema de tickets.',
                flags: 64
            });
        }

        if (subcommand === 'setup') {
            if (!currentConfig.categoryId) {
                return interaction.reply({
                    content: '❌ Configura primero la categoria con `/ticket config categoria:#categoria`.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
            if (targetChannel.type !== ChannelType.GuildText) {
                return interaction.editReply({
                    content: '❌ El panel solo puede publicarse en canales de texto normales.'
                });
            }

            const panelPayload = createTicketPanelPayload(interaction.guild);
            let panelMessage = null;

            if (
                currentConfig.panelMessageId &&
                currentConfig.panelChannelId &&
                currentConfig.panelChannelId === targetChannel.id
            ) {
                try {
                    const existingMessage = await targetChannel.messages.fetch(currentConfig.panelMessageId);
                    panelMessage = await existingMessage.edit(panelPayload);
                } catch {
                    panelMessage = null;
                }
            }

            if (!panelMessage) {
                panelMessage = await targetChannel.send(panelPayload);
            }

            updateTicketsConfig(guildId, {
                panelChannelId: targetChannel.id,
                panelMessageId: panelMessage.id
            });

            return interaction.editReply({
                content: `✅ Panel de tickets publicado en ${targetChannel}.`
            });
        }

        if (subcommand === 'status') {
            const ticketTypes = getTicketTypes(currentConfig);
            const liveOpenTickets = interaction.guild.channels.cache.filter(
                channel => channel.type === ChannelType.GuildText && channel.parentId === currentConfig.categoryId
            ).size;

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🎫 Estado del Sistema de Tickets')
                .addFields(
                    { name: 'Estado', value: currentConfig.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
                    { name: 'Tickets abiertos', value: String(liveOpenTickets || getOpenTicketCount(guildId)), inline: true },
                    { name: 'Max. por usuario', value: String(currentConfig.maxOpenTickets), inline: true },
                    { name: 'Categoria', value: formatChannel(currentConfig.categoryId), inline: true },
                    { name: 'Rol Staff Global', value: formatRole(currentConfig.roleId), inline: true },
                    { name: 'Canal de logs', value: formatChannel(currentConfig.logChannelId), inline: true },
                    { name: 'Canal del panel', value: formatChannel(currentConfig.panelChannelId), inline: true },
                    { name: 'Prefijo', value: `\`${currentConfig.namePrefix}\``, inline: true },
                    { name: 'Mencionar staff', value: currentConfig.mentionStaffOnOpen ? 'Si' : 'No', inline: true },
                    { name: 'Razon obligatoria al cerrar', value: currentConfig.closeReasonRequired !== false ? 'Si' : 'No', inline: true },
                    { name: 'Titulo panel', value: currentConfig.panelTitle, inline: false },
                    { name: 'Boton panel', value: `${currentConfig.panelButtonEmoji || 'Sin emoji'} ${currentConfig.panelButtonLabel}`, inline: false },
                    { name: 'Mensaje inicial', value: formatMessagePreview(currentConfig.welcomeMessage), inline: false },
                    { name: `Tipos configurados (${ticketTypes.length})`, value: formatTypesList(ticketTypes), inline: false }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (subcommand === 'config') {
            const updates = {};

            const enabled = interaction.options.getBoolean('habilitado');
            const category = interaction.options.getChannel('categoria');
            const role = interaction.options.getRole('rol_staff');
            const logChannel = interaction.options.getChannel('canal_logs');
            const maxOpenTickets = interaction.options.getInteger('max_abiertos');
            const prefix = interaction.options.getString('prefijo');
            const mentionStaffOnOpen = interaction.options.getBoolean('mencionar_staff');
            const closeReasonRequired = interaction.options.getBoolean('razon_cierre_obligatoria');

            if (typeof enabled === 'boolean') updates.enabled = enabled;
            if (category) updates.categoryId = category.id;
            if (role) updates.roleId = role.id;
            if (logChannel) updates.logChannelId = logChannel.id;
            if (typeof maxOpenTickets === 'number') updates.maxOpenTickets = maxOpenTickets;
            if (prefix) updates.namePrefix = prefix.trim();
            if (typeof mentionStaffOnOpen === 'boolean') updates.mentionStaffOnOpen = mentionStaffOnOpen;
            if (typeof closeReasonRequired === 'boolean') updates.closeReasonRequired = closeReasonRequired;

            if (Object.keys(updates).length === 0) {
                return interaction.reply({
                    content: '❌ Debes indicar al menos un ajuste para actualizar.',
                    flags: 64
                });
            }

            const updatedConfig = updateTicketsConfig(guildId, updates);

            const embed = new EmbedBuilder()
                .setColor(0x00C853)
                .setTitle('⚙️ Configuracion de Tickets Actualizada')
                .addFields(
                    { name: 'Estado', value: updatedConfig.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
                    { name: 'Categoria', value: formatChannel(updatedConfig.categoryId), inline: true },
                    { name: 'Rol Staff', value: formatRole(updatedConfig.roleId), inline: true },
                    { name: 'Canal Logs', value: formatChannel(updatedConfig.logChannelId), inline: true },
                    { name: 'Max. abiertos', value: String(updatedConfig.maxOpenTickets), inline: true },
                    { name: 'Prefijo', value: `\`${updatedConfig.namePrefix}\``, inline: true },
                    { name: 'Mencionar staff', value: updatedConfig.mentionStaffOnOpen ? 'Si' : 'No', inline: true },
                    { name: 'Razon obligatoria', value: updatedConfig.closeReasonRequired !== false ? 'Si' : 'No', inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (subcommand === 'panel') {
            const updates = {};

            const channel = interaction.options.getChannel('canal');
            const title = interaction.options.getString('titulo');
            const description = interaction.options.getString('descripcion');
            const buttonLabel = interaction.options.getString('boton');
            const emoji = interaction.options.getString('emoji');

            if (channel) updates.panelChannelId = channel.id;
            if (title) updates.panelTitle = title.trim();
            if (description) updates.panelDescription = description.trim();
            if (buttonLabel) updates.panelButtonLabel = buttonLabel.trim();
            if (emoji) updates.panelButtonEmoji = emoji.trim();

            if (Object.keys(updates).length === 0) {
                return interaction.reply({
                    content: '❌ Debes indicar al menos un cambio para el panel.',
                    flags: 64
                });
            }

            const updatedConfig = updateTicketsConfig(guildId, updates);

            const embed = new EmbedBuilder()
                .setColor(0x00C853)
                .setTitle('🧩 Panel de Tickets Actualizado')
                .setDescription('Los cambios ya estan guardados. Usa `/ticket setup` para publicar o refrescar el panel.')
                .addFields(
                    { name: 'Canal panel', value: formatChannel(updatedConfig.panelChannelId), inline: true },
                    { name: 'Titulo', value: updatedConfig.panelTitle, inline: false },
                    { name: 'Boton', value: `${updatedConfig.panelButtonEmoji || 'Sin emoji'} ${updatedConfig.panelButtonLabel}`, inline: false },
                    { name: 'Descripcion', value: formatMessagePreview(updatedConfig.panelDescription), inline: false }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (subcommand === 'mensaje') {
            const welcomeMessage = interaction.options.getString('bienvenida').trim();
            const updatedConfig = updateTicketsConfig(guildId, { welcomeMessage });

            const embed = new EmbedBuilder()
                .setColor(0x00C853)
                .setTitle('💬 Mensaje Inicial Actualizado')
                .setDescription('Variables disponibles: `{user}`, `{server}`, `{ticket}`, `{ticketId}`, `{staffRole}`, `{type}`, `{priority}`, `{subject}`')
                .addFields({
                    name: 'Preview',
                    value: formatMessagePreview(updatedConfig.welcomeMessage)
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (subcommand === 'tipos') {
            const ticketTypes = getTicketTypes(currentConfig);
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🗂️ Tipos de Ticket')
                .setDescription('El primero de la lista es el tipo rapido que usa el boton principal.')
                .addFields({
                    name: `Tipos (${ticketTypes.length})`,
                    value: formatTypesList(ticketTypes)
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (subcommand === 'tipo_add') {
            const currentTypes = getTicketTypes(currentConfig);
            if (currentTypes.length >= 10) {
                return interaction.reply({
                    content: '❌ Alcanzaste el limite de 10 tipos de ticket.',
                    flags: 64
                });
            }

            const key = sanitizeTypeKey(interaction.options.getString('clave'));
            if (!key) {
                return interaction.reply({
                    content: '❌ La clave del tipo no es valida.',
                    flags: 64
                });
            }

            if (currentTypes.some(type => type.key === key)) {
                return interaction.reply({
                    content: `❌ Ya existe un tipo con la clave \`${key}\`.`,
                    flags: 64
                });
            }

            const nextType = {
                key,
                label: interaction.options.getString('nombre').trim(),
                description: interaction.options.getString('descripcion').trim(),
                priority: interaction.options.getString('prioridad'),
                emoji: interaction.options.getString('emoji')?.trim() || null,
                staffRoleId: interaction.options.getRole('rol_staff')?.id || null
            };

            let nextTypes = [...currentTypes, nextType];
            if (interaction.options.getBoolean('predeterminado')) {
                nextTypes = moveTypeToFront(nextTypes, key);
            }

            updateTicketsConfig(guildId, { types: nextTypes });

            return interaction.reply({
                content: `✅ Tipo \`${key}\` creado correctamente.`,
                flags: 64
            });
        }

        if (subcommand === 'tipo_edit') {
            const currentTypes = getTicketTypes(currentConfig);
            const key = sanitizeTypeKey(interaction.options.getString('clave'));
            const index = currentTypes.findIndex(type => type.key === key);

            if (index === -1) {
                return interaction.reply({
                    content: `❌ No existe un tipo con la clave \`${key}\`.`,
                    flags: 64
                });
            }

            const updates = {};
            const name = interaction.options.getString('nombre');
            const description = interaction.options.getString('descripcion');
            const priority = interaction.options.getString('prioridad');
            const emoji = interaction.options.getString('emoji');
            const role = interaction.options.getRole('rol_staff');
            const useGlobalRole = interaction.options.getBoolean('usar_rol_global');
            const setDefault = interaction.options.getBoolean('predeterminado');

            if (name) updates.label = name.trim();
            if (description) updates.description = description.trim();
            if (priority) updates.priority = priority;
            if (emoji) updates.emoji = emoji.trim();
            if (role) updates.staffRoleId = role.id;
            if (useGlobalRole) updates.staffRoleId = null;

            if (Object.keys(updates).length === 0 && !setDefault) {
                return interaction.reply({
                    content: '❌ Debes indicar al menos un cambio para editar el tipo.',
                    flags: 64
                });
            }

            const nextTypes = [...currentTypes];
            nextTypes[index] = {
                ...nextTypes[index],
                ...updates
            };

            const finalTypes = setDefault ? moveTypeToFront(nextTypes, key) : nextTypes;
            updateTicketsConfig(guildId, { types: finalTypes });

            return interaction.reply({
                content: `✅ Tipo \`${key}\` actualizado correctamente.`,
                flags: 64
            });
        }

        if (subcommand === 'tipo_remove') {
            const currentTypes = getTicketTypes(currentConfig);
            const key = sanitizeTypeKey(interaction.options.getString('clave'));
            const nextTypes = currentTypes.filter(type => type.key !== key);

            if (nextTypes.length === currentTypes.length) {
                return interaction.reply({
                    content: `❌ No existe un tipo con la clave \`${key}\`.`,
                    flags: 64
                });
            }

            updateTicketsConfig(guildId, { types: nextTypes });

            return interaction.reply({
                content: `✅ Tipo \`${key}\` eliminado correctamente.`,
                flags: 64
            });
        }

        if (subcommand === 'claim') {
            return handleTicketClaim(interaction);
        }

        if (subcommand === 'assign') {
            return handleTicketAssign(interaction, interaction.options.getUser('usuario'));
        }

        if (subcommand === 'priority') {
            return handleTicketPriority(interaction, interaction.options.getString('nivel'));
        }

        if (subcommand === 'rename') {
            return handleTicketRename(interaction, interaction.options.getString('nombre'));
        }

        if (subcommand === 'add') {
            return handleTicketAdd(interaction, interaction.options.getUser('usuario'));
        }

        if (subcommand === 'remove') {
            return handleTicketRemove(interaction, interaction.options.getUser('usuario'));
        }

        if (subcommand === 'close') {
            return handleTicketClose(interaction, {
                reason: interaction.options.getString('razon'),
                resolution: interaction.options.getString('resumen') || undefined
            });
        }
    }
};
