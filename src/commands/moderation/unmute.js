import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'unmute',
    description: 'Quitar el silencio a un usuario',
    default_member_permissions: '1099511627776',
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
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        if (!user.isCommunicationDisabled()) {
            return interaction.reply({ content: '❌ Este usuario no está silenciado.', flags: 64 });
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
