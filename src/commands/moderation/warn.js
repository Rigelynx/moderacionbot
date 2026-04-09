import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'warn',
    description: 'Advertir a un usuario',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a advertir',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón de la advertencia',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razon') || 'No especificada';
        
        if (!user) {
            return interaction.reply('❌ Usuario no encontrado.');
        }
        
        const warns = client.warningCounts.get(user.id) || 0;
        const newCount = warns + 1;
        client.warningCounts.set(user.id, newCount);
        
        const embed = createModerationEmbed({
            color: 0xffff00,
            title: '⚠️ Advertencia',
            user,
            moderator: interaction.user,
            fields: [
                { name: 'Razón', value: reason },
                { name: 'Total', value: `${newCount}/5` }
            ]
        });
        
        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
        
        if (newCount >= 5) {
            await user.ban({ reason: '5 advertencias acumuladas' });
            client.warningCounts.delete(user.id);
            await interaction.channel.send(`🔨 ${user.user.tag} ha sido baneado por acumular 5 advertencias.`);
        }
    }
};
