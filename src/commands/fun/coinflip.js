import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'coinflip',
    description: 'Lanza una moneda (Cara o Cruz)',
    async execute(interaction) {
        const isCara = Math.random() < 0.5;
        const resultado = isCara ? 'Cara' : 'Cruz';
        const color = isCara ? 0xffd700 : 0xc0c0c0; // Oro para cara, plata para cruz
        const emoji = isCara ? '🪙' : '🔘';

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} Lanzamiento de moneda`)
            .setDescription(`¡La moneda cayó en **${resultado}**!`)
            .setFooter({ text: `Lanzada por ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
