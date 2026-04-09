import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'clear',
    description: 'Eliminar mensajes del canal',
    options: [
        {
            name: 'cantidad',
            type: 4,
            description: 'Cantidad de mensajes a eliminar (1-100)',
            required: true,
            min_value: 1,
            max_value: 100
        }
    ],
    async execute(interaction, client) {
        const amount = interaction.options.getInteger('cantidad');
        
        const messages = await interaction.channel.messages.fetch({ limit: amount });
        
        const twoWeeks = 14 * 24 * 60 * 60 * 1000;
        const deletableMessages = messages.filter(msg => 
            Date.now() - msg.createdTimestamp < twoWeeks
        );
        
        const notDeletable = messages.size - deletableMessages.size;
        
        if (deletableMessages.size > 0) {
            await interaction.channel.bulkDelete(deletableMessages);
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🗑️ Mensajes Eliminados')
            .addFields(
                { name: 'Borrados', value: `${deletableMessages.size}`, inline: true },
                { name: 'No borrados (+14 días)', value: `${notDeletable}`, inline: true },
                { name: 'Canal', value: interaction.channel.name, inline: true },
                { name: 'Moderador', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
