import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'ping',
    description: 'Ver la latencia del bot',
    async execute(interaction, client) {
        const wsPing = client.ws.ping;
        const apiPing = Date.now() - interaction.createdTimestamp;
        
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'WebSocket', value: `${wsPing}ms`, inline: true },
                { name: 'API', value: `${apiPing}ms`, inline: true }
            );
        
        await interaction.reply({ embeds: [embed] });
    }
};
