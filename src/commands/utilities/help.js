import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { checkCommandAccess } from '../../utils/commandPermissions.js';

const CATEGORY_META = {
    moderation: { emoji: '🛡️', title: 'Moderación' },
    utilities: { emoji: '🧰', title: 'Utilidades' },
    info: { emoji: '📘', title: 'Información' },
    fun: { emoji: '🎮', title: 'Diversión' },
    general: { emoji: '✨', title: 'General' }
};

const COMMAND_PREVIEWS = {
    antiraid: 'defensa por niveles',
    ban: 'banear usuarios',
    clear: 'limpiar mensajes',
    help: 'ver esta guía',
    ia: 'ajustes de IA',
    kick: 'expulsar usuarios',
    logs: 'ajustar logs',
    membercount: 'ver miembros',
    modai: 'asistente para staff',
    ping: 'latencia del bot',
    profile: 'perfil visual',
    report: 'reportar al staff',
    role: 'gestión de roles',
    serverinfo: 'datos del servidor',
    ticket: 'soporte y tickets',
    verify: 'verificación web',
    warnings: 'historial de warns',
    welcome: 'bienvenidas',
    goodbye: 'despedidas'
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
        .sort((a, b) => {
            if ((a.category || 'general') !== (b.category || 'general')) {
                return (a.category || 'general').localeCompare(b.category || 'general');
            }
            return a.name.localeCompare(b.name);
        });
}

function buildCategoryField(commands = []) {
    return commands
        .slice(0, 8)
        .map(command => `\`/${command.name}\` ${COMMAND_PREVIEWS[command.name] || command.description || 'Disponible'}`)
        .join('\n');
}

export const command = {
    name: 'help',
    description: 'Muestra una ayuda más clara según tus permisos',
    async execute(interaction, client) {
        const visibleCommands = getVisibleCommands(interaction, client);
        const grouped = visibleCommands.reduce((acc, item) => {
            const category = item.category || 'general';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {});

        const fields = Object.entries(grouped)
            .map(([category, commands]) => {
                const meta = CATEGORY_META[category] || CATEGORY_META.general;
                return {
                    name: `${meta.emoji} ${meta.title} · ${commands.length}`,
                    value: buildCategoryField(commands),
                    inline: false
                };
            })
            .filter(field => field.value);

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('Centro de Ayuda')
            .setDescription('Aquí ves solo comandos que puedes usar ahora mismo en este servidor.')
            .addFields(
                {
                    name: 'Accesos rápidos',
                    value: 'Usa el dashboard para restringir comandos por rol o canal.\nUsa `/verify config` para verificación y rol automático al entrar.\nUsa `/ticket status` y `/antiraid status` para revisar sistemas clave.',
                    inline: false
                },
                ...fields
            )
            .setFooter({ text: `Comandos visibles para ti: ${visibleCommands.length}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
