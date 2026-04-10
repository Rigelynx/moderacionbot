import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';
import { removeWarning, getWarningCount } from '../../utils/warnings.js';

export const command = {
    name: 'unwarn',
    description: 'Quitar una advertencia a un usuario',
    default_member_permissions: '1099511627776',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario al que quitar la advertencia',
            required: true
        },
        {
            name: 'numero',
            type: 4,
            description: 'Número de la advertencia a quitar (última si no se especifica)',
            required: false,
            min_value: 1
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const number = interaction.options.getInteger('numero');

        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        const guildId = interaction.guild.id;
        const currentCount = getWarningCount(guildId, user.id);

        if (currentCount === 0) {
            return interaction.reply({ content: '❌ Este usuario no tiene advertencias.', flags: 64 });
        }

        const index = number !== null ? number - 1 : undefined;
        const removed = removeWarning(guildId, user.id, index);

        if (!removed) {
            return interaction.reply({ content: `❌ Número de advertencia inválido. El usuario tiene ${currentCount} advertencia(s).`, flags: 64 });
        }

        const newCount = getWarningCount(guildId, user.id);

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Advertencia Removida')
            .addFields(
                { name: 'Usuario', value: `${user.user.username} (${user.id})`, inline: true },
                { name: 'Moderador', value: interaction.user.username, inline: true },
                { name: 'Advertencias restantes', value: `${newCount}/5`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
