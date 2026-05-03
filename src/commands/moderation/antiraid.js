import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    PermissionFlagsBits
} from 'discord.js';
import { getAntiRaidConfig, updateAntiRaidConfig } from '../../utils/config.js';
import {
    ANTI_RAID_LEVELS,
    activateAntiRaidPanic,
    getAntiRaidLevelLabel,
    getAntiRaidLevelValue,
    getAntiRaidStatusSummary,
    normalizeAntiRaidLevel
} from '../../utils/antiRaid.js';

const baseLevelChoices = [
    { name: 'Monitor', value: 'monitor' },
    { name: 'Clean', value: 'clean' },
    { name: 'Contain', value: 'contain' }
];

const whitelistTypeChoices = [
    { name: 'Usuario', value: 'user' },
    { name: 'Rol', value: 'role' },
    { name: 'Canal', value: 'channel' }
];

function formatEnabled(value) {
    return value ? 'Si' : 'No';
}

function formatPanicStatus(config) {
    if (config.currentLevel !== ANTI_RAID_LEVELS.PANIC || !config.panicUntil) {
        return 'No activo';
    }

    return `${config.panicRemainingText} (${config.panicUntilText})`;
}

function createStatusEmbed(guildId) {
    const config = getAntiRaidStatusSummary(guildId);

    return new EmbedBuilder()
        .setColor(config.enabled ? 0x5865F2 : 0x747F8D)
        .setTitle('🛡️ Estado de Anti-Raid')
        .addFields(
            { name: 'Sistema', value: config.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
            { name: 'Nivel actual', value: config.effectiveLevelLabel, inline: true },
            { name: 'Nivel base', value: config.baseLevelLabel, inline: true },
            { name: 'Panic', value: formatPanicStatus(config), inline: false },
            { name: 'Motivo Panic', value: config.panicReason || 'No activo', inline: false },
            { name: 'Whitelists', value: `Usuarios: ${config.whitelistUserIds.length} | Roles: ${config.whitelistRoleIds.length} | Canales: ${config.whitelistChannelIds.length}`, inline: false },
            { name: 'Flood', value: `${formatEnabled(config.messageSpam.enabled)} | ${config.messageSpam.maxMessages} mensajes / ${config.messageSpam.intervalSeconds}s | timeout ${config.messageSpam.timeoutMinutes}m`, inline: false },
            { name: 'Duplicados', value: `${formatEnabled(config.duplicateSpam.enabled)} | ${config.duplicateSpam.maxDuplicates} repeticiones / ${config.duplicateSpam.intervalSeconds}s | timeout ${config.duplicateSpam.timeoutMinutes}m`, inline: false },
            { name: 'Menciones', value: `${formatEnabled(config.mentionSpam.enabled)} | max ${config.mentionSpam.maxMentions} | bloquear @everyone: ${formatEnabled(config.mentionSpam.blockEveryone)}`, inline: false },
            { name: 'Joins', value: `${formatEnabled(config.joinRaid.enabled)} | alerta ${config.joinRaid.warningJoins} | panic ${config.joinRaid.dangerJoins} | ventana ${config.joinRaid.intervalSeconds}s`, inline: false },
            { name: 'Cuentas nuevas', value: `${config.joinRaid.newAccountDays} dia(s) | timeout ${config.joinRaid.suspiciousTimeoutMinutes}m`, inline: false },
            { name: 'Auto Panic', value: `${formatEnabled(config.panic.autoActivateOnDanger)} | normaliza en ${config.panic.autoNormalizeMinutes}m | strict ${config.panic.messageMultiplierPercent}%`, inline: false }
        )
        .setTimestamp();
}

function createConfigEmbed(config, title = '⚙️ Anti-Raid actualizado') {
    return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(title)
        .addFields(
            { name: 'Nivel base', value: getAntiRaidLevelLabel(config.baseLevel), inline: true },
            { name: 'Nivel actual', value: getAntiRaidLevelLabel(config.enabled ? config.currentLevel : ANTI_RAID_LEVELS.OFF), inline: true },
            { name: 'Sistema', value: config.enabled ? 'Activado' : 'Desactivado', inline: true },
            { name: 'Flood', value: `${config.messageSpam.maxMessages}/${config.messageSpam.intervalSeconds}s`, inline: true },
            { name: 'Duplicados', value: `${config.duplicateSpam.maxDuplicates}/${config.duplicateSpam.intervalSeconds}s`, inline: true },
            { name: 'Menciones', value: `max ${config.mentionSpam.maxMentions}`, inline: true },
            { name: 'Joins alerta', value: `${config.joinRaid.warningJoins}`, inline: true },
            { name: 'Joins panic', value: `${config.joinRaid.dangerJoins}`, inline: true },
            { name: 'Auto retorno Panic', value: `${config.panic.autoNormalizeMinutes} minuto(s)`, inline: true }
        )
        .setTimestamp();
}

function resolveWhitelistTarget(interaction, type) {
    if (type === 'user') {
        const user = interaction.options.getUser('usuario');
        if (!user) return null;
        return { id: user.id, label: `${user.tag} (${user.id})`, key: 'whitelistUserIds' };
    }

    if (type === 'role') {
        const role = interaction.options.getRole('rol');
        if (!role) return null;
        return { id: role.id, label: `${role.name} (${role.id})`, key: 'whitelistRoleIds' };
    }

    if (type === 'channel') {
        const channel = interaction.options.getChannel('canal');
        if (!channel) return null;
        return { id: channel.id, label: `${channel.name} (${channel.id})`, key: 'whitelistChannelIds' };
    }

    return null;
}

function createWhitelistListEmbed(config) {
    const users = config.whitelistUserIds.length ? config.whitelistUserIds.map(id => `<@${id}>`).join(', ') : 'Ninguno';
    const roles = config.whitelistRoleIds.length ? config.whitelistRoleIds.map(id => `<@&${id}>`).join(', ') : 'Ninguno';
    const channels = config.whitelistChannelIds.length ? config.whitelistChannelIds.map(id => `<#${id}>`).join(', ') : 'Ninguno';

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📋 Whitelist Anti-Raid')
        .addFields(
            { name: `Usuarios (${config.whitelistUserIds.length})`, value: users.slice(0, 1024), inline: false },
            { name: `Roles (${config.whitelistRoleIds.length})`, value: roles.slice(0, 1024), inline: false },
            { name: `Canales (${config.whitelistChannelIds.length})`, value: channels.slice(0, 1024), inline: false }
        )
        .setTimestamp();
}

export const command = {
    name: 'antiraid',
    description: 'Configura la proteccion anti-raid del servidor',
    default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
    options: [
        {
            name: 'status',
            description: 'Ver el estado actual del sistema anti-raid',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'enable',
            description: 'Activar el sistema anti-raid',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'disable',
            description: 'Desactivar el sistema anti-raid',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'level',
            description: 'Cambiar el nivel base del anti-raid',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'nivel',
                    description: 'Nuevo nivel base',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: baseLevelChoices
                }
            ]
        },
        {
            name: 'config',
            description: 'Ajustar umbrales y respuestas del sistema',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'flood_habilitado', description: 'Activa o desactiva deteccion de flood', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'max_mensajes', description: 'Maximo de mensajes por ventana', type: ApplicationCommandOptionType.Integer, min_value: 3, max_value: 20, required: false },
                { name: 'ventana_mensajes', description: 'Ventana de flood en segundos', type: ApplicationCommandOptionType.Integer, min_value: 3, max_value: 60, required: false },
                { name: 'timeout_flood', description: 'Timeout por flood en minutos', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1440, required: false },
                { name: 'duplicados_habilitado', description: 'Activa o desactiva deteccion de duplicados', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'max_duplicados', description: 'Mensajes iguales permitidos', type: ApplicationCommandOptionType.Integer, min_value: 2, max_value: 10, required: false },
                { name: 'ventana_duplicados', description: 'Ventana de duplicados en segundos', type: ApplicationCommandOptionType.Integer, min_value: 5, max_value: 120, required: false },
                { name: 'timeout_duplicados', description: 'Timeout por duplicados en minutos', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1440, required: false },
                { name: 'menciones_habilitado', description: 'Activa o desactiva deteccion de menciones', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'max_menciones', description: 'Maximo de menciones por mensaje', type: ApplicationCommandOptionType.Integer, min_value: 2, max_value: 20, required: false },
                { name: 'bloquear_everyone', description: 'Bloquear menciones @everyone/@here', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'timeout_menciones', description: 'Timeout por menciones abusivas en minutos', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1440, required: false },
                { name: 'joins_habilitado', description: 'Activa o desactiva deteccion de join raid', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'joins_alerta', description: 'Entradas para alerta', type: ApplicationCommandOptionType.Integer, min_value: 3, max_value: 50, required: false },
                { name: 'joins_panic', description: 'Entradas para Panic', type: ApplicationCommandOptionType.Integer, min_value: 4, max_value: 100, required: false },
                { name: 'ventana_joins', description: 'Ventana de joins en segundos', type: ApplicationCommandOptionType.Integer, min_value: 10, max_value: 300, required: false },
                { name: 'cuenta_nueva_dias', description: 'Dias para marcar cuenta nueva', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 90, required: false },
                { name: 'timeout_cuenta_nueva', description: 'Timeout para cuentas nuevas en minutos', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1440, required: false },
                { name: 'auto_panic', description: 'Activar Panic automaticamente en join raids graves', type: ApplicationCommandOptionType.Boolean, required: false },
                { name: 'panic_minutos', description: 'Duracion automatica de Panic', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1440, required: false },
                { name: 'panic_strict_percent', description: 'Que tan estricto se vuelve Panic en porcentaje', type: ApplicationCommandOptionType.Integer, min_value: 30, max_value: 100, required: false }
            ]
        },
        {
            name: 'panic',
            description: 'Subir temporalmente el servidor a Panic',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'minutos', description: 'Duracion del modo Panic', type: ApplicationCommandOptionType.Integer, min_value: 1, max_value: 1440, required: false },
                { name: 'razon', description: 'Motivo para activar Panic', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'normalize',
            description: 'Volver manualmente al nivel base',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'razon', description: 'Motivo de la normalizacion', type: ApplicationCommandOptionType.String, required: false }
            ]
        },
        {
            name: 'whitelist_add',
            description: 'Anadir usuario, rol o canal a la whitelist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'tipo', description: 'Tipo de whitelist', type: ApplicationCommandOptionType.String, required: true, choices: whitelistTypeChoices },
                { name: 'usuario', description: 'Usuario a eximir', type: ApplicationCommandOptionType.User, required: false },
                { name: 'rol', description: 'Rol a eximir', type: ApplicationCommandOptionType.Role, required: false },
                { name: 'canal', description: 'Canal a eximir', type: ApplicationCommandOptionType.Channel, required: false }
            ]
        },
        {
            name: 'whitelist_remove',
            description: 'Quitar usuario, rol o canal de la whitelist',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                { name: 'tipo', description: 'Tipo de whitelist', type: ApplicationCommandOptionType.String, required: true, choices: whitelistTypeChoices },
                { name: 'usuario', description: 'Usuario a quitar', type: ApplicationCommandOptionType.User, required: false },
                { name: 'rol', description: 'Rol a quitar', type: ApplicationCommandOptionType.Role, required: false },
                { name: 'canal', description: 'Canal a quitar', type: ApplicationCommandOptionType.Channel, required: false }
            ]
        },
        {
            name: 'whitelist_list',
            description: 'Listar las whitelists del anti-raid',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'status') {
            return interaction.reply({ embeds: [createStatusEmbed(guildId)], flags: 64 });
        }

        if (subcommand === 'enable') {
            const current = getAntiRaidConfig(guildId);
            const updated = updateAntiRaidConfig(guildId, {
                enabled: true,
                currentLevel: current.baseLevel
            });

            return interaction.reply({
                embeds: [createConfigEmbed(updated, '✅ Anti-Raid activado')],
                flags: 64
            });
        }

        if (subcommand === 'disable') {
            const updated = updateAntiRaidConfig(guildId, {
                enabled: false
            });

            return interaction.reply({
                embeds: [createConfigEmbed(updated, '⛔ Anti-Raid desactivado')],
                flags: 64
            });
        }

        if (subcommand === 'level') {
            const levelKey = interaction.options.getString('nivel');
            const levelValue = getAntiRaidLevelValue(levelKey, { allowOff: false, allowPanic: false });

            if (!levelValue) {
                return interaction.reply({ content: '❌ Nivel no valido.', flags: 64 });
            }

            const current = getAntiRaidConfig(guildId);
            const updated = updateAntiRaidConfig(guildId, {
                baseLevel: levelValue,
                currentLevel: current.currentLevel === ANTI_RAID_LEVELS.PANIC ? ANTI_RAID_LEVELS.PANIC : levelValue
            });

            return interaction.reply({
                embeds: [createConfigEmbed(updated, `🎚️ Nivel base cambiado a ${getAntiRaidLevelLabel(levelValue)}`)],
                flags: 64
            });
        }

        if (subcommand === 'config') {
            const updates = {};
            const messageSpam = {};
            const duplicateSpam = {};
            const mentionSpam = {};
            const joinRaid = {};
            const panic = {};

            const floodEnabled = interaction.options.getBoolean('flood_habilitado');
            const maxMessages = interaction.options.getInteger('max_mensajes');
            const messageWindow = interaction.options.getInteger('ventana_mensajes');
            const floodTimeout = interaction.options.getInteger('timeout_flood');
            const duplicateEnabled = interaction.options.getBoolean('duplicados_habilitado');
            const maxDuplicates = interaction.options.getInteger('max_duplicados');
            const duplicateWindow = interaction.options.getInteger('ventana_duplicados');
            const duplicateTimeout = interaction.options.getInteger('timeout_duplicados');
            const mentionEnabled = interaction.options.getBoolean('menciones_habilitado');
            const maxMentions = interaction.options.getInteger('max_menciones');
            const blockEveryone = interaction.options.getBoolean('bloquear_everyone');
            const mentionTimeout = interaction.options.getInteger('timeout_menciones');
            const joinsEnabled = interaction.options.getBoolean('joins_habilitado');
            const warningJoins = interaction.options.getInteger('joins_alerta');
            const dangerJoins = interaction.options.getInteger('joins_panic');
            const joinWindow = interaction.options.getInteger('ventana_joins');
            const newAccountDays = interaction.options.getInteger('cuenta_nueva_dias');
            const suspiciousTimeout = interaction.options.getInteger('timeout_cuenta_nueva');
            const autoPanic = interaction.options.getBoolean('auto_panic');
            const panicMinutes = interaction.options.getInteger('panic_minutos');
            const strictPercent = interaction.options.getInteger('panic_strict_percent');

            if (typeof floodEnabled === 'boolean') messageSpam.enabled = floodEnabled;
            if (typeof maxMessages === 'number') messageSpam.maxMessages = maxMessages;
            if (typeof messageWindow === 'number') messageSpam.intervalSeconds = messageWindow;
            if (typeof floodTimeout === 'number') messageSpam.timeoutMinutes = floodTimeout;
            if (typeof duplicateEnabled === 'boolean') duplicateSpam.enabled = duplicateEnabled;
            if (typeof maxDuplicates === 'number') duplicateSpam.maxDuplicates = maxDuplicates;
            if (typeof duplicateWindow === 'number') duplicateSpam.intervalSeconds = duplicateWindow;
            if (typeof duplicateTimeout === 'number') duplicateSpam.timeoutMinutes = duplicateTimeout;
            if (typeof mentionEnabled === 'boolean') mentionSpam.enabled = mentionEnabled;
            if (typeof maxMentions === 'number') mentionSpam.maxMentions = maxMentions;
            if (typeof blockEveryone === 'boolean') mentionSpam.blockEveryone = blockEveryone;
            if (typeof mentionTimeout === 'number') mentionSpam.timeoutMinutes = mentionTimeout;
            if (typeof joinsEnabled === 'boolean') joinRaid.enabled = joinsEnabled;
            if (typeof warningJoins === 'number') joinRaid.warningJoins = warningJoins;
            if (typeof dangerJoins === 'number') joinRaid.dangerJoins = dangerJoins;
            if (typeof joinWindow === 'number') joinRaid.intervalSeconds = joinWindow;
            if (typeof newAccountDays === 'number') joinRaid.newAccountDays = newAccountDays;
            if (typeof suspiciousTimeout === 'number') joinRaid.suspiciousTimeoutMinutes = suspiciousTimeout;
            if (typeof autoPanic === 'boolean') panic.autoActivateOnDanger = autoPanic;
            if (typeof panicMinutes === 'number') panic.autoNormalizeMinutes = panicMinutes;
            if (typeof strictPercent === 'number') panic.messageMultiplierPercent = strictPercent;

            if (Object.keys(messageSpam).length) updates.messageSpam = messageSpam;
            if (Object.keys(duplicateSpam).length) updates.duplicateSpam = duplicateSpam;
            if (Object.keys(mentionSpam).length) updates.mentionSpam = mentionSpam;
            if (Object.keys(joinRaid).length) updates.joinRaid = joinRaid;
            if (Object.keys(panic).length) updates.panic = panic;

            if (!Object.keys(updates).length) {
                return interaction.reply({ content: '❌ Debes indicar al menos un ajuste.', flags: 64 });
            }

            const updated = updateAntiRaidConfig(guildId, updates);
            return interaction.reply({
                embeds: [createConfigEmbed(updated)],
                flags: 64
            });
        }

        if (subcommand === 'panic') {
            const minutes = interaction.options.getInteger('minutos') || undefined;
            const reason = interaction.options.getString('razon') || `Activado manualmente por ${interaction.user.tag}`;

            const updated = await activateAntiRaidPanic(interaction.guild, client, {
                reason,
                durationMinutes: minutes,
                actorTag: interaction.user.tag
            });

            return interaction.reply({
                embeds: [createConfigEmbed(updated, '🔴 Modo Panic activado')],
                flags: 64
            });
        }

        if (subcommand === 'normalize') {
            const reason = interaction.options.getString('razon') || `Normalizado manualmente por ${interaction.user.tag}`;
            const updated = await normalizeAntiRaidLevel(interaction.guild, client, {
                reason,
                actorTag: interaction.user.tag
            });

            return interaction.reply({
                embeds: [createConfigEmbed(updated, '🟢 Anti-Raid vuelto al nivel base')],
                flags: 64
            });
        }

        if (subcommand === 'whitelist_list') {
            const config = getAntiRaidConfig(guildId);
            return interaction.reply({ embeds: [createWhitelistListEmbed(config)], flags: 64 });
        }

        if (subcommand === 'whitelist_add' || subcommand === 'whitelist_remove') {
            const type = interaction.options.getString('tipo');
            const target = resolveWhitelistTarget(interaction, type);

            if (!target) {
                return interaction.reply({
                    content: '❌ Debes indicar el usuario, rol o canal correspondiente al tipo elegido.',
                    flags: 64
                });
            }

            const config = getAntiRaidConfig(guildId);
            const list = [...config[target.key]];
            const alreadyPresent = list.includes(target.id);

            if (subcommand === 'whitelist_add') {
                if (alreadyPresent) {
                    return interaction.reply({ content: '❌ Ese elemento ya esta en la whitelist.', flags: 64 });
                }

                list.push(target.id);
            } else {
                if (!alreadyPresent) {
                    return interaction.reply({ content: '❌ Ese elemento no estaba en la whitelist.', flags: 64 });
                }

                const index = list.indexOf(target.id);
                list.splice(index, 1);
            }

            const updated = updateAntiRaidConfig(guildId, {
                [target.key]: list
            });

            return interaction.reply({
                content: subcommand === 'whitelist_add'
                    ? `✅ Añadido a la whitelist: ${target.label}`
                    : `✅ Eliminado de la whitelist: ${target.label}`,
                embeds: [createWhitelistListEmbed(updated)],
                flags: 64
            });
        }
    }
};
