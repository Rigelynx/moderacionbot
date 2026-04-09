import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'unmute',
    description: 'Quitar el silencio a un usuario',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a desilenciar',
            required: true
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        
        if (!user) {
            return interaction.reply('❌ Usuario no encontrado.');
        }
        
        if (!user.isCommunicationDisabled()) {
            return interaction.reply('❌ Este usuario no está silenciado.');
        }
        
        await user.timeout(null);
        
        const embed = createModerationEmbed({
            color: 0x00ff00,
            title: '🔊 Usuario Desilenciado',
            user,
            moderator: interaction.user
        });
        
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
