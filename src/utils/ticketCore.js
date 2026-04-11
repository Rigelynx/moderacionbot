import {
    ChannelType,
    PermissionsBitField,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import discordTranscripts from 'discord-html-transcripts';
import { getTicketsConfig } from './config.js';
import { sendLog } from './embeds.js';
import {
    createTicketRecord,
    deleteTicketRecord,
    getNextTicketNumber,
    getOpenTicketsByOwner,
    getTicketRecord,
    updateTicketRecord
} from './ticketStore.js';

const TICKET_CREATE_BUTTON_ID = 'ticket_create';
const TICKET_TYPE_SELECT_ID = 'ticket_type_select';
const TICKET_CLAIM_BUTTON_ID = 'ticket_claim';
const TICKET_CLOSE_BUTTON_ID = 'ticket_close';
const TICKET_OPEN_MODAL_PREFIX = 'ticket_open_modal';
const TICKET_CLOSE_MODAL_ID = 'ticket_close_modal';

const SUBJECT_INPUT_ID = 'ticket_subject';
const DETAILS_INPUT_ID = 'ticket_details';
const CLOSE_REASON_INPUT_ID = 'ticket_close_reason';
const CLOSE_SUMMARY_INPUT_ID = 'ticket_close_summary';

export const TICKET_PRIORITY_CHOICES = [
    { name: 'Baja', value: 'baja' },
    { name: 'Media', value: 'media' },
    { name: 'Alta', value: 'alta' },
    { name: 'Urgente', value: 'urgente' }
];

const PRIORITY_META = {
    baja: { label: 'Baja', emoji: '🟢', color: 0x2ECC71 },
    media: { label: 'Media', emoji: '🟡', color: 0xF1C40F },
    alta: { label: 'Alta', emoji: '🟠', color: 0xE67E22 },
    urgente: { label: 'Urgente', emoji: '🔴', color: 0xE74C3C }
};

function padTicketNumber(ticketNumber) {
    return String(ticketNumber || 0).padStart(4, '0');
}

function truncate(text, maxLength = 1024) {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function sanitizeChannelName(value, fallback = 'ticket') {
    const sanitized = String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

    return sanitized || fallback;
}

function sanitizeTypeKey(value, fallback = 'general') {
    return sanitizeChannelName(value, fallback).replace(/-/g, '_').slice(0, 32);
}

function normalizePriority(priority) {
    return PRIORITY_META[priority] ? priority : 'media';
}

function getPriorityMeta(priority) {
    return PRIORITY_META[normalizePriority(priority)];
}

export function getPriorityLabel(priority) {
    return getPriorityMeta(priority).label;
}

function getTicketTypes(config) {
    const rawTypes = Array.isArray(config.types) && config.types.length > 0
        ? config.types
        : [{
            key: 'general',
            label: 'General',
            description: 'Consulta general.',
            emoji: '🎫',
            priority: 'media',
            staffRoleId: null
        }];

    const seenKeys = new Set();

    return rawTypes
        .map((type, index) => {
            const key = sanitizeTypeKey(type.key || `tipo_${index + 1}`);
            if (seenKeys.has(key)) return null;
            seenKeys.add(key);

            return {
                key,
                label: truncate(type.label?.trim() || `Tipo ${index + 1}`, 100),
                description: truncate(type.description?.trim() || 'Sin descripcion.', 100),
                emoji: type.emoji?.trim() || null,
                priority: normalizePriority(type.priority),
                staffRoleId: type.staffRoleId || null
            };
        })
        .filter(Boolean)
        .slice(0, 25);
}

function getTicketType(config, key) {
    const ticketTypes = getTicketTypes(config);
    return ticketTypes.find(type => type.key === key) || ticketTypes[0];
}

function buildTicketChannelName(config, ticketNumber, typeKey) {
    const prefix = sanitizeChannelName(config.namePrefix, 'ticket');
    const typeSlug = sanitizeChannelName(typeKey, 'general').slice(0, 18);
    return `${prefix}-${padTicketNumber(ticketNumber)}-${typeSlug}`.slice(0, 100);
}

function buildTicketTopic(ticket) {
    return [
        `ticketId=${ticket.ticketNumber}`,
        `owner=${ticket.ownerId}`,
        `claimed=${ticket.claimedBy || 'none'}`,
        `type=${ticket.typeKey || 'general'}`,
        `priority=${ticket.priority || 'media'}`
    ].join(' | ');
}

function parseTicketTopic(topic) {
    if (!topic) return null;

    const ticketIdMatch = topic.match(/ticketId=(\d+)/i);
    const ownerMatch = topic.match(/owner=(\d+)/i) || topic.match(/\(ID:\s*(\d+)\)/i);
    const claimedMatch = topic.match(/claimed=([^\s|]+)/i);
    const typeMatch = topic.match(/type=([^\s|]+)/i);
    const priorityMatch = topic.match(/priority=([^\s|]+)/i);

    if (!ownerMatch) return null;

    return {
        ticketNumber: ticketIdMatch ? Number(ticketIdMatch[1]) : null,
        ownerId: ownerMatch[1],
        claimedBy: claimedMatch && claimedMatch[1] !== 'none' ? claimedMatch[1] : null,
        typeKey: typeMatch ? sanitizeTypeKey(typeMatch[1]) : null,
        priority: priorityMatch ? normalizePriority(priorityMatch[1]) : null
    };
}

function formatTemplate(template, values) {
    return Object.entries(values).reduce(
        (text, [key, value]) => text.replaceAll(`{${key}}`, value ?? ''),
        template
    );
}

async function respond(interaction, payload) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload).catch(() => null);
    }

    return interaction.reply(payload).catch(() => null);
}

function getSupportRoleIds(config, ticketRecord) {
    const roleIds = new Set();

    if (config.roleId) roleIds.add(config.roleId);
    if (ticketRecord?.staffRoleId) roleIds.add(ticketRecord.staffRoleId);

    return [...roleIds];
}

function isSupportMember(member, config, ticketRecord = null) {
    if (!member) return false;

    if (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.ManageChannels)
    ) {
        return true;
    }

    return getSupportRoleIds(config, ticketRecord).some(roleId => member.roles?.cache?.has(roleId));
}

function resolveTicketLogChannel(guild, config) {
    if (!config.logChannelId) return null;

    const channel = guild.channels.cache.get(config.logChannelId);
    return channel && channel.isTextBased() ? channel : null;
}

function buildPanelEmbed(config, guild) {
    const ticketTypes = getTicketTypes(config);
    const typeLines = ticketTypes
        .slice(0, 6)
        .map(type => {
            const priority = getPriorityMeta(type.priority);
            return `${type.emoji || '🎫'} **${type.label}** · ${priority.emoji} ${priority.label}`;
        })
        .join('\n');

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(config.panelTitle)
        .setDescription(config.panelDescription)
        .addFields(
            { name: 'Apertura', value: 'El usuario completa un formulario privado antes de crear el ticket.', inline: false },
            { name: 'Tipos disponibles', value: typeLines || 'No hay tipos configurados.', inline: false },
            { name: 'Privacidad', value: 'Solo el autor, el bot y el staff veran el canal.', inline: false }
        )
        .setFooter({ text: 'Sistema de tickets profesional' })
        .setTimestamp();
}

function buildPanelComponents(config) {
    const rows = [];
    const ticketTypes = getTicketTypes(config);
    const button = new ButtonBuilder()
        .setCustomId(TICKET_CREATE_BUTTON_ID)
        .setLabel(config.panelButtonLabel)
        .setStyle(ButtonStyle.Primary);

    if (config.panelButtonEmoji) {
        try {
            button.setEmoji(config.panelButtonEmoji);
        } catch {
            // Ignorar emojis invalidos en configuracion.
        }
    }

    rows.push(new ActionRowBuilder().addComponents(button));

    if (ticketTypes.length > 1) {
        const select = new StringSelectMenuBuilder()
            .setCustomId(TICKET_TYPE_SELECT_ID)
            .setPlaceholder('Selecciona el tipo de ticket')
            .addOptions(ticketTypes.map(type => {
                const option = {
                    label: truncate(type.label, 100),
                    description: truncate(type.description, 100),
                    value: type.key
                };

                if (type.emoji) {
                    try {
                        new ButtonBuilder().setCustomId(`preview_${type.key}`).setLabel('x').setStyle(ButtonStyle.Secondary).setEmoji(type.emoji);
                        option.emoji = type.emoji;
                    } catch {
                        // Ignorar emojis invalidos dentro del selector.
                    }
                }

                return option;
            }));

        rows.push(new ActionRowBuilder().addComponents(select));
    }

    return rows;
}

function buildTicketControlsRow(ticketRecord) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(TICKET_CLAIM_BUTTON_ID)
            .setLabel(ticketRecord?.claimedBy ? 'Liberar' : 'Reclamar')
            .setEmoji(ticketRecord?.claimedBy ? '🔓' : '🛠️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(TICKET_CLOSE_BUTTON_ID)
            .setLabel('Cerrar')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
    );
}

function buildTicketEmbed(guild, config, ticketRecord) {
    const priority = getPriorityMeta(ticketRecord.priority);
    const welcomeText = formatTemplate(config.welcomeMessage, {
        user: `<@${ticketRecord.ownerId}>`,
        mention: `<@${ticketRecord.ownerId}>`,
        server: guild.name,
        ticket: `#${padTicketNumber(ticketRecord.ticketNumber)}`,
        ticketId: padTicketNumber(ticketRecord.ticketNumber),
        staffRole: ticketRecord.staffRoleId ? `<@&${ticketRecord.staffRoleId}>` : (config.roleId ? `<@&${config.roleId}>` : 'Staff'),
        type: ticketRecord.typeLabel || 'General',
        priority: priority.label,
        subject: ticketRecord.subject || 'Sin asunto'
    });

    const embed = new EmbedBuilder()
        .setColor(priority.color)
        .setTitle(`${priority.emoji} Ticket #${padTicketNumber(ticketRecord.ticketNumber)} · ${truncate(ticketRecord.subject || ticketRecord.typeLabel || 'Sin asunto', 120)}`)
        .setDescription(truncate(welcomeText, 4000))
        .addFields(
            { name: 'Tipo', value: `${ticketRecord.typeEmoji || '🎫'} ${ticketRecord.typeLabel || 'General'}`, inline: true },
            { name: 'Prioridad', value: `${priority.emoji} ${priority.label}`, inline: true },
            { name: 'Asignado a', value: ticketRecord.claimedBy ? `<@${ticketRecord.claimedBy}>` : 'Sin asignar', inline: true },
            { name: 'Creador', value: `<@${ticketRecord.ownerId}>`, inline: true },
            { name: 'Asunto', value: truncate(ticketRecord.subject || 'Sin asunto', 1024), inline: true },
            { name: 'Participantes extra', value: ticketRecord.participants?.length ? ticketRecord.participants.map(userId => `<@${userId}>`).join(', ') : 'Ninguno', inline: true }
        )
        .setFooter({ text: 'Usa los botones o /ticket para gestionar este caso' })
        .setTimestamp();

    if (ticketRecord.description) {
        embed.addFields({
            name: 'Contexto',
            value: truncate(ticketRecord.description, 1024),
            inline: false
        });
    }

    return embed;
}

function buildTicketLogEmbed({ channel, actorTag, reason, resolution, ticketRecord }) {
    const priority = getPriorityMeta(ticketRecord?.priority);

    return new EmbedBuilder()
        .setTitle('🔒 Ticket Cerrado')
        .setColor(0xFF0000)
        .addFields(
            { name: 'Canal', value: channel.name, inline: true },
            { name: 'Ticket', value: `#${padTicketNumber(ticketRecord?.ticketNumber)}`, inline: true },
            { name: 'Creador', value: ticketRecord?.ownerId ? `<@${ticketRecord.ownerId}>` : 'Desconocido', inline: true },
            { name: 'Tipo', value: `${ticketRecord?.typeEmoji || '🎫'} ${ticketRecord?.typeLabel || 'General'}`, inline: true },
            { name: 'Prioridad', value: `${priority.emoji} ${priority.label}`, inline: true },
            { name: 'Asignado a', value: ticketRecord?.claimedBy ? `<@${ticketRecord.claimedBy}>` : 'Sin asignar', inline: true },
            { name: 'Cerrado por', value: actorTag, inline: true },
            { name: 'Razon', value: truncate(reason || 'No especificada', 1024), inline: false },
            { name: 'Resumen final', value: truncate(resolution || 'No se adjunto resumen final.', 1024), inline: false }
        )
        .setTimestamp();
}

async function syncTicketControlMessage(channel, config, ticketRecord) {
    if (!ticketRecord?.controlMessageId) return;

    const controlMessage = await channel.messages.fetch(ticketRecord.controlMessageId).catch(() => null);
    if (!controlMessage) return;

    await controlMessage.edit({
        embeds: [buildTicketEmbed(channel.guild, config, ticketRecord)],
        components: [buildTicketControlsRow(ticketRecord)]
    }).catch(() => { });
}

async function ensureTicketRecord(guildId, channel, config = getTicketsConfig(guildId)) {
    const existing = getTicketRecord(guildId, channel.id);
    const parsed = parseTicketTopic(channel.topic);

    if (existing) {
        const type = getTicketType(config, existing.typeKey || parsed?.typeKey);
        const patchedRecord = {
            ...existing,
            ticketNumber: existing.ticketNumber || parsed?.ticketNumber || getNextTicketNumber(guildId),
            ownerId: existing.ownerId || parsed?.ownerId,
            claimedBy: existing.claimedBy ?? parsed?.claimedBy ?? null,
            typeKey: type.key,
            typeLabel: existing.typeLabel || type.label,
            typeEmoji: existing.typeEmoji || type.emoji,
            priority: normalizePriority(existing.priority || parsed?.priority || type.priority),
            staffRoleId: existing.staffRoleId || type.staffRoleId || config.roleId || null,
            participants: Array.isArray(existing.participants) ? existing.participants : [],
            subject: existing.subject || type.label,
            description: existing.description || 'Ticket migrado desde el sistema anterior.'
        };

        if (JSON.stringify(existing) !== JSON.stringify(patchedRecord)) {
            updateTicketRecord(guildId, channel.id, patchedRecord);
            await channel.setTopic(buildTicketTopic(patchedRecord)).catch(() => { });
        }

        return patchedRecord;
    }

    if (!parsed?.ownerId) return null;

    const type = getTicketType(config, parsed.typeKey);
    const record = createTicketRecord(guildId, channel.id, {
        ticketNumber: parsed.ticketNumber || getNextTicketNumber(guildId),
        ownerId: parsed.ownerId,
        claimedBy: parsed.claimedBy || null,
        typeKey: type.key,
        typeLabel: type.label,
        typeEmoji: type.emoji,
        priority: normalizePriority(parsed.priority || type.priority),
        staffRoleId: type.staffRoleId || config.roleId || null,
        participants: [],
        subject: type.label,
        description: 'Ticket migrado desde el sistema anterior.'
    });

    await channel.setTopic(buildTicketTopic(record)).catch(() => { });
    return record;
}

function getUserOpenTicketChannels(guild, config, ownerId) {
    const channels = new Map();

    for (const ticket of getOpenTicketsByOwner(guild.id, ownerId)) {
        const channel = guild.channels.cache.get(ticket.channelId);
        if (channel) channels.set(channel.id, channel);
    }

    for (const channel of guild.channels.cache.values()) {
        if (channel.type !== ChannelType.GuildText || channel.parentId !== config.categoryId) continue;

        const parsed = parseTicketTopic(channel.topic);
        if (parsed?.ownerId === ownerId) {
            channels.set(channel.id, channel);
        }
    }

    return Array.from(channels.values());
}

async function requireTicketChannel(interaction, config) {
    if (!interaction.guild || interaction.channel?.type !== ChannelType.GuildText) {
        await respond(interaction, { content: '❌ Este comando solo funciona dentro de un servidor.', flags: 64 });
        return null;
    }

    if (interaction.channel.parentId !== config.categoryId) {
        await respond(interaction, { content: '❌ Este comando solo funciona dentro de un ticket activo.', flags: 64 });
        return null;
    }

    const record = await ensureTicketRecord(interaction.guild.id, interaction.channel, config);
    if (!record) {
        await respond(interaction, { content: '❌ No pude leer la metadata de este ticket.', flags: 64 });
        return null;
    }

    return record;
}

function canCloseTicket(interaction, config, ticketRecord) {
    return isSupportMember(interaction.member, config, ticketRecord) || interaction.user.id === ticketRecord.ownerId;
}

async function showOpenTicketModal(interaction, config, type) {
    if (!config.enabled) {
        return respond(interaction, { content: '❌ El sistema de tickets esta desactivado en este servidor.', flags: 64 });
    }

    if (!config.categoryId) {
        return respond(interaction, { content: '❌ No hay una categoria configurada para los tickets. Usa `/ticket config`.', flags: 64 });
    }

    const priority = getPriorityMeta(type.priority);
    const modal = new ModalBuilder()
        .setCustomId(`${TICKET_OPEN_MODAL_PREFIX}:${type.key}`)
        .setTitle(`Nuevo ticket · ${truncate(type.label, 30)}`);

    const subjectInput = new TextInputBuilder()
        .setCustomId(SUBJECT_INPUT_ID)
        .setLabel(`Asunto (${priority.label})`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(`Ej: ${type.label} - necesito ayuda con...`)
        .setRequired(true)
        .setMaxLength(100);

    const detailsInput = new TextInputBuilder()
        .setCustomId(DETAILS_INPUT_ID)
        .setLabel('Describe tu caso')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Explica el contexto, IDs, capturas o cualquier detalle util.')
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(subjectInput),
        new ActionRowBuilder().addComponents(detailsInput)
    );

    return interaction.showModal(modal);
}

async function saveAndSyncTicket(interaction, updates) {
    const config = getTicketsConfig(interaction.guild.id);
    const updatedRecord = updateTicketRecord(interaction.guild.id, interaction.channel.id, updates);
    if (!updatedRecord) return null;

    await interaction.channel.setTopic(buildTicketTopic(updatedRecord)).catch(() => { });
    await syncTicketControlMessage(interaction.channel, config, updatedRecord);
    return updatedRecord;
}

export function createTicketPanelPayload(guild) {
    const config = getTicketsConfig(guild.id);
    return {
        embeds: [buildPanelEmbed(config, guild)],
        components: buildPanelComponents(config)
    };
}

export function getTicketButtonIds() {
    return {
        create: TICKET_CREATE_BUTTON_ID,
        typeSelect: TICKET_TYPE_SELECT_ID,
        claim: TICKET_CLAIM_BUTTON_ID,
        close: TICKET_CLOSE_BUTTON_ID,
        createModalPrefix: TICKET_OPEN_MODAL_PREFIX,
        closeModalId: TICKET_CLOSE_MODAL_ID
    };
}

export async function handleTicketCreate(interaction) {
    const config = getTicketsConfig(interaction.guild.id);
    const defaultType = getTicketTypes(config)[0];
    return showOpenTicketModal(interaction, config, defaultType);
}

export async function handleTicketTypeSelect(interaction) {
    const config = getTicketsConfig(interaction.guild.id);
    const selectedType = getTicketType(config, interaction.values[0]);
    return showOpenTicketModal(interaction, config, selectedType);
}

export async function handleTicketCreateModal(interaction) {
    const guildId = interaction.guild.id;
    const config = getTicketsConfig(guildId);
    const [, rawTypeKey] = interaction.customId.split(':');
    const selectedType = getTicketType(config, rawTypeKey);

    if (!config.enabled) {
        return interaction.reply({ content: '❌ El sistema de tickets esta desactivado en este servidor.', flags: 64 });
    }

    if (!config.categoryId) {
        return interaction.reply({ content: '❌ No hay una categoria configurada para tickets.', flags: 64 });
    }

    const category = interaction.guild.channels.cache.get(config.categoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
        return interaction.reply({ content: '❌ La categoria configurada para tickets no es valida.', flags: 64 });
    }

    const openChannels = getUserOpenTicketChannels(interaction.guild, config, interaction.user.id);
    if (openChannels.length >= config.maxOpenTickets) {
        return interaction.reply({
            content: `❌ Ya alcanzaste el maximo de tickets abiertos (${config.maxOpenTickets}). Usa ${openChannels.map(channel => `<#${channel.id}>`).join(', ')}.`,
            flags: 64
        });
    }

    await interaction.deferReply({ flags: 64 });

    try {
        const ticketNumber = getNextTicketNumber(guildId);
        const subject = interaction.fields.getTextInputValue(SUBJECT_INPUT_ID).trim();
        const description = interaction.fields.getTextInputValue(DETAILS_INPUT_ID).trim();

        const ticketRecord = {
            ticketNumber,
            ownerId: interaction.user.id,
            ownerTag: interaction.user.tag,
            typeKey: selectedType.key,
            typeLabel: selectedType.label,
            typeEmoji: selectedType.emoji,
            priority: selectedType.priority,
            claimedBy: null,
            staffRoleId: selectedType.staffRoleId || config.roleId || null,
            participants: [],
            subject,
            description
        };

        const permissionOverwrites = [
            {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.EmbedLinks
                ]
            },
            {
                id: interaction.client.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles
                ]
            }
        ];

        for (const roleId of getSupportRoleIds(config, ticketRecord)) {
            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) continue;

            permissionOverwrites.push({
                id: role.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles
                ]
            });
        }

        const ticketChannel = await interaction.guild.channels.create({
            name: buildTicketChannelName(config, ticketNumber, selectedType.key),
            type: ChannelType.GuildText,
            parent: category.id,
            topic: buildTicketTopic(ticketRecord),
            permissionOverwrites
        });

        createTicketRecord(guildId, ticketChannel.id, ticketRecord);

        const pingTargets = [];
        if (config.mentionStaffOnOpen && ticketRecord.staffRoleId && interaction.guild.roles.cache.has(ticketRecord.staffRoleId)) {
            pingTargets.push(`<@&${ticketRecord.staffRoleId}>`);
        }
        pingTargets.push(interaction.user.toString());

        const controlMessage = await ticketChannel.send({
            content: pingTargets.join(' | '),
            embeds: [buildTicketEmbed(interaction.guild, config, ticketRecord)],
            components: [buildTicketControlsRow(ticketRecord)]
        });

        const updatedRecord = updateTicketRecord(guildId, ticketChannel.id, {
            controlMessageId: controlMessage.id
        });

        await syncTicketControlMessage(ticketChannel, config, updatedRecord);

        await interaction.editReply({
            content: `✅ Ticket creado correctamente: ${ticketChannel}`
        });

        const logChannel = resolveTicketLogChannel(interaction.guild, config);
        const priority = getPriorityMeta(ticketRecord.priority);
        const openEmbed = new EmbedBuilder()
            .setTitle('🎫 Ticket Creado')
            .setColor(priority.color)
            .addFields(
                { name: 'Canal', value: `${ticketChannel}`, inline: true },
                { name: 'Ticket', value: `#${padTicketNumber(ticketNumber)}`, inline: true },
                { name: 'Tipo', value: `${ticketRecord.typeEmoji || '🎫'} ${ticketRecord.typeLabel}`, inline: true },
                { name: 'Prioridad', value: `${priority.emoji} ${priority.label}`, inline: true },
                { name: 'Usuario', value: `${interaction.user.tag}`, inline: true },
                { name: 'Asunto', value: truncate(subject, 1024), inline: false }
            )
            .setTimestamp();

        if (logChannel) {
            await logChannel.send({ embeds: [openEmbed] }).catch(() => { });
        } else {
            await sendLog(interaction.guild, { embeds: [openEmbed] }, interaction.client);
        }
    } catch (error) {
        console.error('Error creando ticket:', error);
        await interaction.editReply({ content: '❌ Hubo un error al crear el ticket.' }).catch(() => { });
    }
}

export async function handleTicketClaim(interaction) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!isSupportMember(interaction.member, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Solo el staff puede reclamar tickets.', flags: 64 });
    }

    if (ticketRecord.claimedBy && ticketRecord.claimedBy !== interaction.user.id) {
        return respond(interaction, {
            content: `❌ Este ticket ya esta reclamado por <@${ticketRecord.claimedBy}>.`,
            flags: 64
        });
    }

    const nextClaimedBy = ticketRecord.claimedBy === interaction.user.id ? null : interaction.user.id;
    await saveAndSyncTicket(interaction, { claimedBy: nextClaimedBy });

    return respond(interaction, {
        content: nextClaimedBy
            ? '✅ Reclamaste este ticket correctamente.'
            : '✅ El ticket quedo liberado para otro miembro del staff.',
        flags: 64
    });
}

export async function handleTicketAssign(interaction, targetUser) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!isSupportMember(interaction.member, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Solo el staff puede reasignar tickets.', flags: 64 });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
        return respond(interaction, { content: '❌ No pude encontrar a ese usuario en el servidor.', flags: 64 });
    }

    if (!isSupportMember(targetMember, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Ese usuario no pertenece al staff autorizado para este ticket.', flags: 64 });
    }

    await saveAndSyncTicket(interaction, { claimedBy: targetUser.id });

    return respond(interaction, {
        content: `✅ Ticket asignado a ${targetUser}.`,
        flags: 64
    });
}

export async function handleTicketPriority(interaction, priority) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!isSupportMember(interaction.member, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Solo el staff puede cambiar la prioridad.', flags: 64 });
    }

    const nextPriority = normalizePriority(priority);
    await saveAndSyncTicket(interaction, { priority: nextPriority });

    const meta = getPriorityMeta(nextPriority);
    return respond(interaction, {
        content: `✅ Prioridad actualizada a ${meta.emoji} ${meta.label}.`,
        flags: 64
    });
}

export async function handleTicketAdd(interaction, targetUser) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!isSupportMember(interaction.member, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Solo el staff puede anadir usuarios al ticket.', flags: 64 });
    }

    if (targetUser.bot) {
        return respond(interaction, { content: '❌ No puedes anadir bots a un ticket.', flags: 64 });
    }

    await interaction.channel.permissionOverwrites.edit(targetUser.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
    });

    const participants = Array.from(new Set([...(ticketRecord.participants || []), targetUser.id]));
    await saveAndSyncTicket(interaction, { participants });

    return respond(interaction, {
        content: `✅ ${targetUser} fue anadido al ticket.`,
        flags: 64
    });
}

export async function handleTicketRemove(interaction, targetUser) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!isSupportMember(interaction.member, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Solo el staff puede remover usuarios del ticket.', flags: 64 });
    }

    if (targetUser.id === ticketRecord.ownerId) {
        return respond(interaction, { content: '❌ No puedes remover al creador del ticket.', flags: 64 });
    }

    await interaction.channel.permissionOverwrites.delete(targetUser.id).catch(async () => {
        await interaction.channel.permissionOverwrites.edit(targetUser.id, {
            ViewChannel: false,
            SendMessages: false,
            ReadMessageHistory: false
        });
    });

    const participants = (ticketRecord.participants || []).filter(userId => userId !== targetUser.id);
    await saveAndSyncTicket(interaction, { participants });

    return respond(interaction, {
        content: `✅ ${targetUser} fue removido del ticket.`,
        flags: 64
    });
}

export async function handleTicketRename(interaction, rawName) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!isSupportMember(interaction.member, config, ticketRecord)) {
        return respond(interaction, { content: '❌ Solo el staff puede renombrar tickets.', flags: 64 });
    }

    const sanitizedName = sanitizeChannelName(rawName, buildTicketChannelName(config, ticketRecord.ticketNumber, ticketRecord.typeKey)).slice(0, 100);
    await interaction.channel.setName(sanitizedName);

    return respond(interaction, {
        content: `✅ El ticket fue renombrado a \`${sanitizedName}\`.`,
        flags: 64
    });
}

export async function handleTicketCloseRequest(interaction) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!canCloseTicket(interaction, config, ticketRecord)) {
        return respond(interaction, { content: '❌ No tienes permisos para cerrar este ticket.', flags: 64 });
    }

    const modal = new ModalBuilder()
        .setCustomId(TICKET_CLOSE_MODAL_ID)
        .setTitle(`Cerrar ticket #${padTicketNumber(ticketRecord.ticketNumber)}`);

    const reasonInput = new TextInputBuilder()
        .setCustomId(CLOSE_REASON_INPUT_ID)
        .setLabel('Razon del cierre')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ej: caso resuelto, ticket duplicado, inactividad...')
        .setRequired(config.closeReasonRequired !== false)
        .setMaxLength(120);

    const summaryInput = new TextInputBuilder()
        .setCustomId(CLOSE_SUMMARY_INPUT_ID)
        .setLabel('Resumen final o resolucion')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Opcional: resume lo que se hizo antes de cerrar el ticket.')
        .setRequired(false)
        .setMaxLength(1000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(reasonInput),
        new ActionRowBuilder().addComponents(summaryInput)
    );

    return interaction.showModal(modal);
}

export async function handleTicketCloseModal(interaction) {
    const reason = interaction.fields.getTextInputValue(CLOSE_REASON_INPUT_ID).trim();
    const resolution = interaction.fields.getTextInputValue(CLOSE_SUMMARY_INPUT_ID).trim();

    return handleTicketClose(interaction, {
        reason,
        resolution
    });
}

export async function handleTicketClose(interaction, options = {}) {
    const config = getTicketsConfig(interaction.guild.id);
    const ticketRecord = await requireTicketChannel(interaction, config);
    if (!ticketRecord) return;

    if (!canCloseTicket(interaction, config, ticketRecord)) {
        return respond(interaction, { content: '❌ No tienes permisos para cerrar este ticket.', flags: 64 });
    }

    const reason = options.reason?.trim() || '';
    const resolution = options.resolution?.trim() || '';

    if (config.closeReasonRequired !== false && !reason) {
        return respond(interaction, { content: '❌ Debes indicar una razon para cerrar el ticket.', flags: 64 });
    }

    await respond(interaction, {
        content: '🔒 Cerrando ticket y generando transcript...',
        flags: 64
    });

    let transcript = null;
    try {
        transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            returnType: 'attachment',
            filename: `${interaction.channel.name}-transcript.html`,
            saveImages: true,
            poweredBy: false
        });
    } catch (error) {
        console.error('Error generando transcript:', error);
    }

    const logEmbed = buildTicketLogEmbed({
        channel: interaction.channel,
        actorTag: interaction.user.tag,
        reason: reason || 'No especificada',
        resolution,
        ticketRecord
    });

    const logChannel = resolveTicketLogChannel(interaction.guild, config);
    const logPayload = transcript
        ? { embeds: [logEmbed], files: [transcript] }
        : { embeds: [logEmbed] };

    if (logChannel) {
        await logChannel.send(logPayload).catch(() => { });
    } else {
        await sendLog(interaction.guild, logPayload, interaction.client);
    }

    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
        await interaction.channel.delete(`Ticket cerrado por ${interaction.user.tag}`);
        deleteTicketRecord(interaction.guild.id, interaction.channel.id);
    } catch (error) {
        console.error('Error cerrando ticket:', error);
        await respond(interaction, {
            content: '❌ No pude eliminar el canal del ticket.',
            flags: 64
        });
    }
}

export function memberCanManageTickets(member, config, ticketRecord = null) {
    return isSupportMember(member, config, ticketRecord);
}
