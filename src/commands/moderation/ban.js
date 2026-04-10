import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'ban',
    description: 'Banear a un usuario del servidor',
    default_member_permissions: '4',
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
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes banearte a ti mismo.', flags: 64 });
        }

        if (user.id === client.user.id) {
            return interaction.reply({ content: '❌ No puedo banearme a mí mismo.', flags: 64 });
        }

        if (!user.bannable) {
            return interaction.reply({ content: '❌ No puedo banear a este usuario. Puede tener un rol superior al mío.', flags: 64 });
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
