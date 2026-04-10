import { EmbedBuilder } from 'discord.js';
import { getSnipe } from '../../utils/snipeStore.js';

export const command = {
    name: 'snipe',
    description: 'Ver el último mensaje eliminado en este canal',
    async execute(interaction) {
        const snipe = getSnipe(interaction.channel.id);

        if (!snipe) {
            return interaction.reply({ content: '❌ No hay mensajes eliminados recientes en este canal.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('🔍 Mensaje Eliminado')
            .setDescription(snipe.content)
            .setAuthor({
                name: snipe.author,
                iconURL: snipe.avatar || undefined
            })
            .setFooter({ text: `Eliminado hace ${getTimeAgo(snipe.timestamp)}` })
            .setTimestamp(snipe.timestamp);

        await interaction.reply({ embeds: [embed] });
    }
};

function getTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
}
