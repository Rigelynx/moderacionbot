import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { clearWarnings } from '../../utils/warnings.js';

export const command = {
    name: 'unban',
    description: 'Desbanear a un usuario del servidor',
    default_member_permissions: '4',
    options: [
        {
            name: 'usuario',
            type: 3,
            description: 'ID del usuario a desbanear',
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
        const userId = interaction.options.getString('usuario');
        const reason = interaction.options.getString('razon') || 'No especificada';

        const bans = await interaction.guild.bans.fetch();
        const bannedUser = bans.find(b => b.user.id === userId);

        if (!bannedUser) {
            return interaction.reply({ content: '❌ Este usuario no está baneado. Asegúrate de usar el ID correcto.', flags: 64 });
        }

        await interaction.guild.members.unban(userId, reason);

        // Limpiar advertencias al desbanear
        clearWarnings(interaction.guild.id, userId);

        const embed = createModerationEmbed({
            color: 0x00ff00,
            title: '✅ Usuario Desbaneado',
            user: bannedUser.user,
            moderator: interaction.user,
            fields: [{ name: 'Razón', value: reason }]
        });

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
