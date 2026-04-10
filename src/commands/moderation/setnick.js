import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'setnick',
    description: 'Cambiar el apodo de un miembro',
    default_member_permissions: '134217728',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario al que cambiar el apodo',
            required: true
        },
        {
            name: 'apodo',
            type: 3,
            description: 'Nuevo apodo (vacío para resetear)',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const nick = interaction.options.getString('apodo');

        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        const oldNick = user.nickname || user.user.username;
        const newNick = nick || null;

        try {
            await user.setNickname(newNick);

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Apodo Actualizado')
                .addFields(
                    { name: 'Usuario', value: user.user.username, inline: true },
                    { name: 'Apodo anterior', value: oldNick, inline: true },
                    { name: 'Nuevo apodo', value: newNick || '(nombre por defecto)', inline: true },
                    { name: 'Moderador', value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ No pude cambiar el apodo: ${error.message}`, flags: 64 });
        }
    }
};
