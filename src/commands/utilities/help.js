import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField
} from 'discord.js';
import { checkCommandAccess } from '../../utils/commandPermissions.js';

const CATEGORY_ORDER = ['home', 'moderation', 'utilities', 'info', 'fun'];
const CATEGORY_META = {
    home: { emoji: '🏠', title: 'Inicio', color: 0x5865f2 },
    moderation: { emoji: '🛡️', title: 'Moderación', color: 0xed4245 },
    utilities: { emoji: '🧰', title: 'Utilidades', color: 0x57f287 },
    info: { emoji: '📘', title: 'Información', color: 0x5dade2 },
    fun: { emoji: '🎮', title: 'Diversión', color: 0xf1c40f },
    general: { emoji: '✨', title: 'General', color: 0x5865f2 }
};

const COMMAND_PREVIEWS = {
    '8ball': 'predicciones clásicas o IA',
    afk: 'marcarte como ausente',
    announce: 'enviar anuncios',
    antiraid: 'defensa por niveles',
    avatar: 'ver avatars',
    ban: 'banear usuarios',
    channelinfo: 'datos del canal',
    clear: 'limpiar mensajes',
    coinflip: 'cara o cruz',
    goodbye: 'despedidas visuales',
    help: 'abrir esta ayuda',
    ia: 'ajustes de IA',
    kick: 'expulsar usuarios',
    logs: 'configurar logs',
    membercount: 'ver el conteo',
    modai: 'asistente del staff',
    mute: 'silenciar miembros',
    perm: 'permisos de canal',
    ping: 'latencia del bot',
    poll: 'crear encuestas',
    profile: 'perfil visual',
    register: 'registro de usuarios',
    report: 'enviar reportes',
    role: 'gestión de roles',
    roleinfo: 'detalles de roles',
    rps: 'piedra, papel o tijeras',
    serverinfo: 'info del servidor',
    snipe: 'último mensaje borrado',
    sugerencias: 'sistema de ideas',
    ticket: 'tickets y soporte',
    unafk: 'quitar AFK',
    userinfo: 'info de usuarios',
    verify: 'verificación web',
    warnings: 'historial de advertencias',
    welcome: 'bienvenidas visuales'
};

function canUseByDiscordPermission(interaction, command) {
    if (!command?.default_member_permissions) {
        return true;
    }

    try {
        const required = new PermissionsBitField(BigInt(command.default_member_permissions));
        return interaction.memberPermissions?.has(required, true) ?? false;
    } catch {
        return true;
    }
}

function getVisibleCommands(interaction, client) {
    return [...client.slashCommands.values()]
        .filter(command => canUseByDiscordPermission(interaction, command))
        .filter(command => checkCommandAccess(interaction, command.name).allowed)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function groupCommands(commands) {
    return commands.reduce((acc, command) => {
        const category = command.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(command);
        return acc;
    }, {});
}

function buildHomeEmbed(groupedCommands, totalCommands, userTag) {
    const categories = Object.entries(groupedCommands)
        .sort((a, b) => {
            const aIndex = CATEGORY_ORDER.indexOf(a[0]);
            const bIndex = CATEGORY_ORDER.indexOf(b[0]);
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        })
        .map(([category, commands]) => {
            const meta = CATEGORY_META[category] || CATEGORY_META.general;
            return `${meta.emoji} **${meta.title}**\n${commands.length} comando(s) visibles`;
        })
        .join('\n\n');

    return new EmbedBuilder()
        .setColor(CATEGORY_META.home.color)
        .setTitle('Centro de Ayuda')
        .setDescription('Una ayuda más limpia, con botones, y filtrada según tus permisos reales en este servidor.')
        .addFields(
            {
                name: 'Navegación',
                value: 'Pulsa un botón para abrir una categoría concreta.',
                inline: false
            },
            {
                name: 'Categorías disponibles',
                value: categories || 'No encontré categorías visibles para ti.',
                inline: false
            },
            {
                name: 'Tips rápidos',
                value: 'El dashboard sirve para restringir comandos por rol o canal.\n`/verify config` gestiona verificación y rol automático.\n`/ticket status` y `/antiraid status` te ayudan a revisar sistemas clave.',
                inline: false
            }
        )
        .setFooter({ text: `${userTag} • ${totalCommands} comandos visibles` })
        .setTimestamp();
}

function buildCategoryEmbed(category, groupedCommands, totalCommands, userTag) {
    const commands = groupedCommands[category] || [];
    const meta = CATEGORY_META[category] || CATEGORY_META.general;

    const commandLines = commands.length
        ? commands.map(command => `\`/${command.name}\`\n${COMMAND_PREVIEWS[command.name] || command.description || 'Disponible'}`).join('\n\n')
        : 'No tienes comandos visibles en esta categoría.';

    return new EmbedBuilder()
        .setColor(meta.color)
        .setTitle(`${meta.emoji} ${meta.title}`)
        .setDescription('Estos son los comandos visibles para ti dentro de esta categoría.')
        .addFields({
            name: `Comandos · ${commands.length}`,
            value: commandLines.slice(0, 1024),
            inline: false
        })
        .setFooter({ text: `${userTag} • ${totalCommands} comandos visibles en total` })
        .setTimestamp();
}

function buildHelpButtons(activePage, availableCategories, userId) {
    const ids = ['home', ...availableCategories];
    const row = new ActionRowBuilder();

    for (const category of ids.slice(0, 5)) {
        const meta = CATEGORY_META[category] || CATEGORY_META.general;
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`help:${userId}:${category}`)
                .setLabel(meta.title)
                .setEmoji(meta.emoji)
                .setStyle(activePage === category ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    }

    return [row];
}

export function createHelpPayload(interaction, client, page = 'home') {
    const visibleCommands = getVisibleCommands(interaction, client);
    const groupedCommands = groupCommands(visibleCommands);
    const availableCategories = CATEGORY_ORDER.filter(category => category !== 'home' && groupedCommands[category]?.length);
    const selectedPage = page === 'home' || groupedCommands[page] ? page : 'home';
    const userTag = interaction.user?.tag || interaction.user?.username || 'Usuario';

    const embed = selectedPage === 'home'
        ? buildHomeEmbed(groupedCommands, visibleCommands.length, userTag)
        : buildCategoryEmbed(selectedPage, groupedCommands, visibleCommands.length, userTag);

    return {
        embeds: [embed],
        components: buildHelpButtons(selectedPage, availableCategories, interaction.user.id)
    };
}

export async function handleHelpButton(interaction, client) {
    const [, ownerId, page] = interaction.customId.split(':');

    if (interaction.user.id !== ownerId) {
        return interaction.reply({
            content: '❌ Esta ayuda fue abierta por otro usuario. Usa `/help` para abrir la tuya.',
            flags: 64
        });
    }

    const payload = createHelpPayload(interaction, client, page);
    return interaction.update(payload);
}

export const command = {
    name: 'help',
    description: 'Muestra una ayuda interactiva con botones',
    async execute(interaction, client) {
        const payload = createHelpPayload(interaction, client, 'home');
        await interaction.reply({ ...payload, flags: 64 });
    }
};
