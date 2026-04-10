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
\`/softban @usuario [razón]\` - Ban + unban (borra msgs)
\`/tempban @usuario <tiempo> [razón]\` - Ban temporal
\`/unban <id> [razón]\` - Desbanear
\`/untimeban <id> [razón]\` - Quitar ban temporal
\`/massban <ids> [razón]\` - Banear múltiples
\`/massunban <ids> [razón]\` - Desbanear múltiples
\`/kick @usuario [razón]\` - Expulsar
\`/mute @usuario <cantidad> <unidad>\` - Silenciar
\`/unmute @usuario\` - Desilenciar
\`/warn @usuario [razón]\` - Advertir
\`/unwarn @usuario [número]\` - Quitar advertencia
\`/warnings [@usuario]\` - Ver advertencias
\`/clear <cantidad>\` - Eliminar mensajes
\`/setnick @usuario [apodo]\` - Cambiar apodo
\`/removenick @usuario\` - Quitar apodo`, inline: false },
                { name: '👋 Bienvenidas / Despedidas', value: `
\`/welcome\` - Configurar sistema bienvenida
\`/goodbye\` - Configurar sistema despedida`, inline: false },
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
\`/perm <tipo> <canal> <rol> <estado>\`
*Tipos: view, send, embed, manage, speak, react, attach, mention, history, connect, stream, priority*
*Estado: allow/deny/reset*`, inline: false },
                { name: '🔒 Canal', value: `
\`/lock\` - Bloquear canal
\`/unlock\` - Desbloquear canal
\`/slowmode <segundos>\` - Modo lento
\`/lockdown <estado>\` - Bloquear/desbloquear servidor
\`/nuke\` - Limpiar historial del canal
\`/vckick @usuario\` - Kickear de Voz`, inline: false },
                { name: '👤 Info', value: `
\`/avatar [@usuario]\` - Ver avatar
\`/userinfo [@usuario]\` - Info de usuario
\`/serverinfo\` - Info del servidor
\`/roleinfo <rol>\` - Info detallada de rol
\`/channelinfo [canal]\` - Info de canal`, inline: false },
                { name: '📊 Utilidades', value: `
\`/announce <canal> <titulo> <mensaje>\` - Anuncio
\`/poll <pregunta> <opciones...>\` - Encuesta
\`/snipe\` - Último msj eliminado
\`/membercount\` - Conteo de miembros
\`/register\` - Registrarte en el bot
\`/unregister\` - Eliminar registro
\`/profile [@usuario]\` - Ver perfil
\`/ticket\` - Gestión de tickets
\`/ping\` - Ver latencia
\`/help\` - Mostrar ayuda
\`/report @usuario <razón>\` - Reportar
\`/afk [razón]\` - Ponerse ausente
\`/sugerencias\` - Sugerencias (enviar/setup)`, inline: false },
                { name: '🎮 Diversión', value: `
\`/8ball <pregunta>\` - Bola mágica
\`/coinflip\` - Cara o cruz
\`/rps <elección>\` - Piedra, papel, tijeras`, inline: false }
            )
            .setFooter({ text: 'Usa / para ver los comandos de Discord' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
