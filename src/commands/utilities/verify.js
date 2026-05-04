import {
    ApplicationCommandOptionType,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { getVerificationConfig, updateVerificationConfig } from '../../utils/config.js';
import {
    createVerificationPanelPayload,
    isGuildManager,
    isVerificationChannel,
    publishVerificationPanel
} from '../../utils/verification.js';

function formatChannel(channelId) {
    return channelId ? `<#${channelId}>` : 'No configurado';
}

function formatRole(roleId) {
    return roleId ? `<@&${roleId}>` : 'No configurado';
}

function stripReplyFlags(payload = {}) {
    const nextPayload = { ...payload };
    delete nextPayload.flags;
    delete nextPayload.ephemeral;
    return nextPayload;
}

async function respond(interaction, payload) {
    if (interaction.deferred && !interaction.replied) {
        return interaction.editReply(stripReplyFlags(payload));
    }

    if (interaction.replied) {
        return interaction.followUp(payload);
    }

    return interaction.reply(payload);
}

export const command = {
    name: 'verify',
    description: 'Sistema de verificación web con rol automático',
    default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
    options: [
        {
            name: 'setup',
            description: 'Publica o refresca el panel de verificación',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'canal',
                    description: 'Canal donde se publicará el panel',
                    type: ApplicationCommandOptionType.Channel,
                    required: false,
                    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                }
            ]
        },
        {
            name: 'status',
            description: 'Muestra la configuración actual del sistema',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'config',
            description: 'Configura el sistema de verificación',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'habilitado', description: 'Activa o desactiva la verificación', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'rol_verificado', description: 'Rol que recibirá el usuario verificado', type: ApplicationCommandOptionType.Role, required: false },
                { name: 'canal_panel', description: 'Canal por defecto del panel', type: ApplicationCommandOptionType.Channel, required: false, channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement] },
                { name: 'edad_cuenta_dias', description: 'Edad mínima de la cuenta en días', type: ApplicationCommandOptionType.Integer, required: false, min_value: 0, max_value: 365 },
                { name: 'titulo', description: 'Título del panel', type: ApplicationCommandOptionType.String, required: false },
                { name: 'descripcion', description: 'Descripción del panel', type: ApplicationCommandOptionType.String, required: false },
                { name: 'boton', description: 'Texto del botón de verificación', type: ApplicationCommandOptionType.String, required: false }
            ]
        }
    ],

    async execute(interaction) {
        if (!isGuildManager(interaction.member)) {
            return respond(interaction, {
                content: '❌ Solo los administradores del servidor pueden configurar la verificación.',
                flags: 64
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const config = getVerificationConfig(guildId);

        if (subcommand === 'status') {
            const embed = new EmbedBuilder()
                .setColor(config.enabled ? 0x57F287 : 0x747F8D)
                .setTitle('🔐 Estado del sistema de verificación')
                .addFields(
                    { name: 'Estado', value: config.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
                    { name: 'Rol verificado', value: formatRole(config.roleId), inline: true },
                    { name: 'Canal del panel', value: formatChannel(config.panelChannelId), inline: true },
                    { name: 'Mensaje del panel', value: config.panelMessageId ? `\`${config.panelMessageId}\`` : 'No publicado', inline: false },
                    { name: 'Edad mínima de cuenta', value: `${config.minAccountAgeDays} día(s)`, inline: true },
                    { name: 'Título panel', value: config.panelTitle, inline: false },
                    { name: 'Botón', value: config.panelButtonLabel, inline: true },
                    { name: 'Descripción', value: config.panelDescription.slice(0, 1024), inline: false }
                )
                .setTimestamp();

            return respond(interaction, { embeds: [embed], flags: 64 });
        }

        if (subcommand === 'config') {
            const updates = {};

            const enabled = interaction.options.getBoolean('habilitado');
            const role = interaction.options.getRole('rol_verificado');
            const panelChannel = interaction.options.getChannel('canal_panel');
            const minAccountAgeDays = interaction.options.getInteger('edad_cuenta_dias');
            const title = interaction.options.getString('titulo');
            const description = interaction.options.getString('descripcion');
            const buttonLabel = interaction.options.getString('boton');

            if (typeof enabled === 'boolean') updates.enabled = enabled;
            if (role) {
                if (interaction.guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
                    return respond(interaction, {
                        content: '❌ Ese rol está por encima de mi rol más alto. Muévelo más abajo antes de configurarlo.',
                        flags: 64
                    });
                }

                updates.roleId = role.id;
            }
            if (panelChannel) updates.panelChannelId = panelChannel.id;
            if (typeof minAccountAgeDays === 'number') updates.minAccountAgeDays = minAccountAgeDays;
            if (title) updates.panelTitle = title.trim();
            if (description) updates.panelDescription = description.trim();
            if (buttonLabel) updates.panelButtonLabel = buttonLabel.trim();

            if (!Object.keys(updates).length) {
                return respond(interaction, {
                    content: '❌ Debes indicar al menos un ajuste para actualizar.',
                    flags: 64
                });
            }

            const updated = updateVerificationConfig(guildId, updates);
            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Configuración de verificación actualizada')
                .addFields(
                    { name: 'Estado', value: updated.enabled ? 'Activado' : 'Desactivado', inline: true },
                    { name: 'Rol', value: formatRole(updated.roleId), inline: true },
                    { name: 'Canal', value: formatChannel(updated.panelChannelId), inline: true },
                    { name: 'Edad mínima', value: `${updated.minAccountAgeDays} día(s)`, inline: true },
                    { name: 'Título', value: updated.panelTitle, inline: false },
                    { name: 'Botón', value: updated.panelButtonLabel, inline: true }
                )
                .setTimestamp();

            return respond(interaction, { embeds: [embed], flags: 64 });
        }

        if (subcommand === 'setup') {
            if (!config.roleId) {
                return respond(interaction, {
                    content: '❌ Configura primero el rol con `/verify config rol_verificado:@rol`.',
                    flags: 64
                });
            }

            await interaction.deferReply({ flags: 64 });

            const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
            if (!isVerificationChannel(targetChannel)) {
                return respond(interaction, {
                    content: '❌ El panel de verificación solo puede publicarse en canales de texto o anuncios.'
                });
            }

            const panelMessage = await publishVerificationPanel(interaction.guild, targetChannel);
            const preview = createVerificationPanelPayload(interaction.guild);

            return respond(interaction, {
                content: `✅ Panel de verificación publicado en ${targetChannel}.\nMensaje: https://discord.com/channels/${interaction.guild.id}/${targetChannel.id}/${panelMessage.id}`,
                embeds: preview.embeds
            });
        }
    }
};
