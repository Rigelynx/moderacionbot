import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'massban',
    description: 'Banear múltiples usuarios por ID',
    default_member_permissions: '4', // BanMembers
    options: [
        {
            name: 'ids',
            type: 3,
            description: 'IDs de usuarios separadas por espacio',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón del ban masivo',
            required: false
        }
    ],
    async execute(interaction, client) {
        const idsInput = interaction.options.getString('ids');
        const reason = interaction.options.getString('razon') || 'Ban masivo';

        const ids = idsInput.split(/[\s,]+/).filter(id => /^\d{17,20}$/.test(id));

        if (ids.length === 0) {
            return interaction.reply({ content: '❌ No se encontraron IDs válidas. Asegúrate de usar IDs numéricas separadas por espacio.', flags: 64 });
        }

        if (ids.length > 20) {
            return interaction.reply({ content: '❌ Máximo 20 usuarios a la vez.', flags: 64 });
        }

        await interaction.deferReply();

        const results = { success: [], failed: [] };

        for (const id of ids) {
            try {
                await interaction.guild.members.ban(id, { reason: `[Massban] ${reason}` });
                results.success.push(id);
            } catch {
                results.failed.push(id);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(results.success.length > 0 ? 0xff0000 : 0xffa500)
            .setTitle('🔨 Ban Masivo')
            .addFields(
                { name: 'Moderador', value: interaction.user.username, inline: true },
                { name: 'Razón', value: reason, inline: true },
                { name: `✅ Baneados (${results.success.length})`, value: results.success.length > 0 ? results.success.map(id => `\`${id}\``).join(', ') : 'Ninguno' },
                { name: `❌ Fallidos (${results.failed.length})`, value: results.failed.length > 0 ? results.failed.map(id => `\`${id}\``).join(', ') : 'Ninguno' }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
