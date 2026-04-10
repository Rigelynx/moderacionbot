import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';
import { clearWarnings } from '../../utils/warnings.js';

export const command = {
    name: 'massunban',
    description: 'Desbanear múltiples usuarios por ID',
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
            description: 'Razón del desbaneo masivo',
            required: false
        }
    ],
    async execute(interaction, client) {
        const idsInput = interaction.options.getString('ids');
        const reason = interaction.options.getString('razon') || 'Desbaneo masivo';

        const ids = idsInput.split(/[\s,]+/).filter(id => /^\d{17,20}$/.test(id));

        if (ids.length === 0) {
            return interaction.reply({ content: '❌ No se encontraron IDs válidas.', flags: 64 });
        }

        if (ids.length > 20) {
            return interaction.reply({ content: '❌ Máximo 20 usuarios a la vez.', flags: 64 });
        }

        await interaction.deferReply();

        const results = { success: [], failed: [] };

        for (const id of ids) {
            try {
                await interaction.guild.members.unban(id, `[Massunban] ${reason}`);
                clearWarnings(interaction.guild.id, id);
                results.success.push(id);
            } catch {
                results.failed.push(id);
            }
        }

        const embed = new EmbedBuilder()
            .setColor(results.success.length > 0 ? 0x00ff00 : 0xffa500)
            .setTitle('✅ Desbaneo Masivo')
            .addFields(
                { name: 'Moderador', value: interaction.user.username, inline: true },
                { name: 'Razón', value: reason, inline: true },
                { name: `✅ Desbaneados (${results.success.length})`, value: results.success.length > 0 ? results.success.map(id => `\`${id}\``).join(', ') : 'Ninguno' },
                { name: `❌ Fallidos (${results.failed.length})`, value: results.failed.length > 0 ? results.failed.map(id => `\`${id}\``).join(', ') : 'Ninguno' }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
