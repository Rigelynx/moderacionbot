import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'vckick',
    description: 'Desconecta a un usuario de su canal de voz activo',
    default_member_permissions: '4194304', // MuteMembers / MoveMembers
    options: [
        {
            name: 'usuario',
            type: 6, // USER
            description: 'Usuario al que quieres desconectar',
            required: true
        },
        {
            name: 'razon',
            type: 3, // STRING
            description: 'Razón de la desconexión',
            required: false
        }
    ],
    async execute(interaction, client) {
        const targetUser = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('razon') || 'Sin razón especificada';

        if (!targetUser) {
            return interaction.reply({ content: '❌ Usuario no encontrado en el servidor.', flags: 64 });
        }

        if (!targetUser.voice.channel) {
            return interaction.reply({ content: '❌ El usuario no está en ningún canal de voz.', flags: 64 });
        }

        try {
            await targetUser.voice.disconnect(reason);

            const embed = new EmbedBuilder()
                .setTitle('🎙️ Expulsado de Voice')
                .setColor(0xffa500)
                .addFields(
                    { name: 'Usuario', value: targetUser.user.tag, inline: true },
                    { name: 'Moderador', value: interaction.user.tag, inline: true },
                    { name: 'Razón', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ Error al desconectar: ${error.message}`, flags: 64 });
        }
    }
};
