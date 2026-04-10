import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'help',
    description: 'Mostrar todos los comandos disponibles',
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📚 Lista de Comandos')
            .setDescription('Comandos disponibles en este bot')
            .addFields(
                { name: '🔨 Moderación', value: `
\`/ban @usuario [razón]\` - Banear
\`/unban <id> [razón]\` - Desbanear
\`/kick @usuario [razón]\` - Expulsar
\`/mute @usuario <cantidad> <unidad>\` - Silenciar
\`/unmute @usuario\` - Desilenciar
\`/warn @usuario [razón]\` - Advertir
\`/unwarn @usuario [número]\` - Quitar advertencia
\`/warnings [@usuario]\` - Ver advertencias
\`/clear <cantidad>\` - Eliminar mensajes
\`/setnick @usuario [apodo]\` - Cambiar apodo`, inline: false },
                { name: '👔 Roles', value: `
\`/role create <nombre> [color]\` - Crear rol
\`/role delete <rol>\` - Eliminar rol
\`/role add @usuario <rol>\` - Añadir rol
\`/role remove @usuario <rol>\` - Quitar rol
\`/role list\` - Ver roles`, inline: false },
                { name: '📝 Logs', value: `
\`/logs set #canal\` - Cambiar canal de logs
\`/logs enable\` - Activar logs
\`/logs disable\` - Desactivar logs
\`/logs status\` - Ver estado de logs`, inline: false },
                { name: '🔐 Permisos', value: `
\`/perm view <canal> <rol> <estado>\` - Ver canal
\`/perm send <canal> <rol> <estado>\` - Enviar msgs
\`/perm embed <canal> <rol> <estado>\` - Insertar enlaces
\`/perm manage <canal> <rol> <estado>\` - Gestionar canal
\`/perm speak <canal> <rol> <estado>\` - Hablar en voz
*Estado: allow/deny/reset*`, inline: false },
                { name: '🔒 Canal', value: `
\`/lock\` - Bloquear canal
\`/unlock\` - Desbloquear canal
\`/slowmode <segundos>\` - Modo lento`, inline: false },
                { name: '👤 Info', value: `
\`/avatar [@usuario]\` - Ver avatar
\`/userinfo [@usuario]\` - Info de usuario
\`/serverinfo\` - Info del servidor`, inline: false },
                { name: '📊 Utilidades', value: `
\`/ping\` - Ver latencia
\`/help\` - Mostrar ayuda`, inline: false }
            )
            .setFooter({ text: 'Usa / para ver los comandos de Discord' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
