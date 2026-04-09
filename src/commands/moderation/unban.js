import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'unban',
    description: 'Desbanear a un usuario del servidor',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a desbanear',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón del unban',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'No especificada';
        
        const bans = await interaction.guild.bans.fetch();
        const bannedUser = bans.find(b => b.user.id === user.id);
        
        if (!bannedUser) {
            return interaction.reply('❌ Este usuario no está baneado.');
        }
        
        const embed = createModerationEmbed({
            color: 0x00ff00,
            title: '✅ Usuario Desbaneado',
            user,
            moderator: interaction.user,
            fields: [{ name: 'Razón', value: reason }]
        });
        
        await interaction.guild.members.unban(user, reason);
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
