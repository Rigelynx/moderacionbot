import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'help',
    description: 'Mostrar todos los comandos disponibles',
    usage: '!help'
};

export async function execute(message, args, client) {
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('📚 Lista de Comandos')
        .setDescription('Comandos disponibles en este bot')
        .addFields(
            { name: '🔨 Moderación', value: `
\`!ban @usuario [razón]\` - Banear
\`!kick @usuario [razón]\` - Expulsar
\`!mute @usuario [duración]\` - Silenciar
\`!unmute @usuario\` - Desilenciar
\`!warn @usuario [razón]\` - Advertir
\`!warnings [@usuario]\` - Ver advertencias
\`!clear [cantidad]\` - Eliminar mensajes`, inline: false },
            { name: '🔒 Canal', value: `
\`!lock\` - Bloquear canal
\`!unlock\` - Desbloquear canal
\`!slowmode [segundos]\` - Modo lento`, inline: false },
            { name: '👤 Info', value: `
\`!avatar [@usuario]\` - Ver avatar
\`!userinfo [@usuario]\` - Info de usuario
\`!serverinfo\` - Info del servidor`, inline: false },
            { name: '📊 Utilidades', value: `
\`!ping\` - Ver latencia
\`!help\` - Mostrar ayuda`, inline: false }
        )
        .setFooter({ text: 'Usa el prefijo ! antes de cada comando' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}
