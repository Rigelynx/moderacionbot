import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'warnings',
    description: 'Ver las advertencias de un usuario',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a consultar',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario') || interaction.member;
        const warns = client.warningCounts.get(user.id) || 0;
        
        const embed = new EmbedBuilder()
            .setColor(0xffff00)
            .setTitle('📋 Registro de Advertencias')
            .addFields(
                { name: 'Usuario', value: user.user.tag, inline: true },
                { name: 'Advertencias', value: `${warns}/5`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
