import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'removenick',
    description: 'Quitar el apodo de un usuario y regresar a su nombre original',
    default_member_permissions: '134217728', // ManageNicknames
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario al que quitar el apodo',
            required: true
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');

        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        if (!user.nickname) {
            return interaction.reply({ content: '❌ Este usuario no tiene un apodo.', flags: 64 });
        }

        const oldNick = user.nickname;

        try {
            await user.setNickname(null);

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🔄 Apodo Eliminado')
                .addFields(
                    { name: 'Usuario', value: user.user.username, inline: true },
                    { name: 'Apodo eliminado', value: oldNick, inline: true },
                    { name: 'Moderador', value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ No pude quitar el apodo: ${error.message}`, flags: 64 });
        }
    }
};
