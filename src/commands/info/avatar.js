import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'avatar',
    description: 'Ver el avatar de un usuario',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a consultar',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`🖼️ Avatar de ${user.username}`)
            .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            .addFields(
                { name: 'Usuario', value: user.tag },
                { name: 'URL', value: `[Click aquí](${user.displayAvatarURL({ size: 1024 })})` }
            );
        
        await interaction.reply({ embeds: [embed] });
    }
};
