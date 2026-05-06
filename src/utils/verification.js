import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { getVerificationConfig, updateVerificationConfig } from './config.js';
import { sendLog } from './embeds.js';
import { createVerificationToken } from './verificationStore.js';

const VERIFY_BUTTON_ID = 'verify_open_portal';
const VERIFY_TOKEN_TTL_MS = 15 * 60 * 1000;

function getBaseUrl() {
    return (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function stripReplyFlags(payload = {}) {
    const nextPayload = { ...payload };
    delete nextPayload.flags;
    delete nextPayload.ephemeral;
    return nextPayload;
}

async function respond(interaction, payload) {
    if (interaction.deferred && !interaction.replied) {
        return interaction.editReply(stripReplyFlags(payload)).catch(() => null);
    }

    if (interaction.replied) {
        return interaction.followUp(payload).catch(() => null);
    }

    return interaction.reply(payload).catch(() => null);
}

export function getVerificationButtonId() {
    return VERIFY_BUTTON_ID;
}

export function createVerificationPanelPayload(guild) {
    const config = getVerificationConfig(guild.id);
    const minAgeText = config.minAccountAgeDays > 0
        ? `La cuenta debe tener una antigüedad mínima de **${config.minAccountAgeDays} día(s)**.`
        : 'No hay requisito mínimo de antigüedad de cuenta.';

    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(config.panelTitle)
        .setDescription(config.panelDescription)
        .addFields(
            { name: 'Proceso', value: 'Abre el portal web, completa la comprobación humana y el bot te asignará el rol automáticamente.', inline: false },
            { name: 'Antigüedad mínima de cuenta', value: minAgeText, inline: false },
            { name: 'Rol a recibir', value: config.roleId ? `<@&${config.roleId}>` : 'No configurado', inline: false }
        )
        .setFooter({ text: 'La sesión de verificación expira en 15 minutos.' })
        .setTimestamp();

    const button = new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel(config.panelButtonLabel || 'Verificarme')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

    return {
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(button)]
    };
}

export async function publishVerificationPanel(guild, channel) {
    const config = getVerificationConfig(guild.id);
    const payload = createVerificationPanelPayload(guild);
    let panelMessage = null;

    if (config.panelMessageId && config.panelChannelId === channel.id) {
        const existingMessage = await channel.messages.fetch(config.panelMessageId).catch(() => null);
        if (existingMessage) {
            panelMessage = await existingMessage.edit(payload).catch(() => null);
        }
    }

    if (!panelMessage) {
        panelMessage = await channel.send(payload);
    }

    updateVerificationConfig(guild.id, {
        panelChannelId: channel.id,
        panelMessageId: panelMessage.id
    });

    return panelMessage;
}

export async function handleVerificationButton(interaction) {
    const config = getVerificationConfig(interaction.guild.id);

    if (!config.enabled) {
        return respond(interaction, {
            content: '❌ El sistema de verificación está desactivado en este servidor.',
            flags: 64
        });
    }

    if (!config.roleId) {
        return respond(interaction, {
            content: '❌ La verificación no tiene un rol configurado todavía.',
            flags: 64
        });
    }

    const role = interaction.guild.roles.cache.get(config.roleId);
    if (!role) {
        return respond(interaction, {
            content: '❌ El rol de verificación configurado ya no existe.',
            flags: 64
        });
    }

    if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return respond(interaction, {
            content: '❌ No tengo permisos para gestionar roles en este servidor.',
            flags: 64
        });
    }

    if (interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
        return respond(interaction, {
            content: '❌ No puedo asignar ese rol porque está por encima de mi rol más alto.',
            flags: 64
        });
    }

    if (interaction.member.roles.cache.has(role.id)) {
        return respond(interaction, {
            content: `✅ Ya estás verificado y tienes el rol ${role}.`,
            flags: 64
        });
    }

    const tokenEntry = createVerificationToken(interaction.guild.id, interaction.user.id, VERIFY_TOKEN_TTL_MS);
    const verificationUrl = buildVerificationUrl(interaction.guild.id, tokenEntry.token);

    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🔐 Portal de verificación')
        .setDescription('Abre el enlace seguro y completa la comprobación humana para recibir el rol automáticamente.')
        .addFields(
            { name: 'Servidor', value: interaction.guild.name, inline: true },
            { name: 'Expira', value: `<t:${Math.floor(tokenEntry.expiresAt / 1000)}:R>`, inline: true },
            { name: 'Rol', value: role.toString(), inline: true }
        )
        .setFooter({ text: 'Si el enlace expira, pulsa el botón otra vez.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Abrir verificación')
            .setStyle(ButtonStyle.Link)
            .setURL(verificationUrl)
    );

    return respond(interaction, {
        embeds: [embed],
        components: [row],
        flags: 64
    });
}

export function buildVerificationUrl(guildId, token) {
    return `${getBaseUrl()}/verify/${guildId}/${token}`;
}

export async function sendVerificationSuccessLog(guild, client, { user, roleId, verifiedBy = 'Portal web' }) {
    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Usuario verificado')
        .addFields(
            { name: 'Usuario', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Rol asignado', value: roleId ? `<@&${roleId}>` : 'No configurado', inline: true },
            { name: 'Origen', value: verifiedBy, inline: true }
        )
        .setTimestamp();

    await sendLog(guild, { embeds: [embed] }, client);
}

export function isGuildManager(member) {
    return Boolean(
        member?.permissions?.has(PermissionFlagsBits.Administrator) ||
        member?.permissions?.has(PermissionFlagsBits.ManageGuild)
    );
}

export function isVerificationChannel(channel) {
    return channel?.type === ChannelType.GuildText || channel?.type === ChannelType.GuildAnnouncement;
}
