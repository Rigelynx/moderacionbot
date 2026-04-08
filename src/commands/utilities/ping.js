import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'ping',
    description: 'Ver la latencia del bot',
    usage: '!ping'
};

export async function execute(message, args, client) {
    const wsPing = client.ws.ping;
    const apiPing = Date.now() - message.createdTimestamp;
    
    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🏓 Pong!')
        .addFields(
            { name: 'WebSocket', value: `${wsPing}ms`, inline: true },
            { name: 'API', value: `${apiPing}ms`, inline: true }
        );
    
    await message.reply({ embeds: [embed] });
}
