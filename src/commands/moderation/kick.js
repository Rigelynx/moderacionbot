import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'kick',
    description: 'Expulsar a un usuario del servidor',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a expulsar',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón del kick',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razon') || 'No especificada';
        
        if (!user) {
            return interaction.reply('❌ Usuario no encontrado.');
        }
        
        if (!user.kickable) {
            return interaction.reply('❌ No puedo expulsar a este usuario.');
        }
        
        const embed = createModerationEmbed({
            color: 0xffa500,
            title: '👢 Usuario Expulsado',
            user,
            moderator: interaction.user,
            fields: [{ name: 'Razón', value: reason }]
        });
        
        await user.kick(reason);
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
