import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'ban',
    description: 'Banear a un usuario del servidor',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a banear',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón del ban',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razon') || 'No especificada';
        
        if (!user) {
            return interaction.reply('❌ Usuario no encontrado.');
        }
        
        if (!user.bannable) {
            return interaction.reply('❌ No puedo banear a este usuario.');
        }
        
        const embed = createModerationEmbed({
            color: 0xff0000,
            title: '🔨 Usuario Baneado',
            user,
            moderator: interaction.user,
            fields: [{ name: 'Razón', value: reason }]
        });
        
        await user.ban({ reason });
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
