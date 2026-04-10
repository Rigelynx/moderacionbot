import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'softban',
    description: 'Banear y desbanear inmediatamente (borra mensajes recientes)',
    default_member_permissions: '4', // BanMembers
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a softbanear',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón del softban',
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
            return interaction.reply({ content: '❌ No puedes softbanearte a ti mismo.', flags: 64 });
        }

        if (user.id === client.user.id) {
            return interaction.reply({ content: '❌ No puedo softbanearme a mí mismo.', flags: 64 });
        }

        if (!user.bannable) {
            return interaction.reply({ content: '❌ No puedo banear a este usuario. Puede tener un rol superior al mío.', flags: 64 });
        }

        const embed = createModerationEmbed({
            color: 0xffa500,
            title: '🧹 Softban Aplicado',
            user,
            moderator: interaction.user,
            fields: [
                { name: 'Razón', value: reason },
                { name: 'Efecto', value: 'Mensajes recientes eliminados, usuario puede volver a entrar' }
            ]
        });

        // Ban with message deletion, then immediately unban
        await user.ban({ reason: `[Softban] ${reason}`, deleteMessageSeconds: 604800 }); // 7 days of messages
        await interaction.guild.members.unban(user.id, 'Softban - desbaneo automático');

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
