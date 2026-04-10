import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { addWarning, getWarningCount } from '../../utils/warnings.js';

export const command = {
    name: 'warn',
    description: 'Advertir a un usuario',
    default_member_permissions: '1099511627776',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a advertir',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón de la advertencia',
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
            return interaction.reply({ content: '❌ No puedes advertirte a ti mismo.', flags: 64 });
        }

        if (user.user.bot) {
            return interaction.reply({ content: '❌ No puedes advertir a un bot.', flags: 64 });
        }

        const guildId = interaction.guild.id;
        const newCount = addWarning(guildId, user.id, reason, interaction.user.username);

        const embed = createModerationEmbed({
            color: 0xffff00,
            title: '⚠️ Advertencia',
            user,
            moderator: interaction.user,
            fields: [
                { name: 'Razón', value: reason },
                { name: 'Total', value: `${newCount}/5` }
            ]
        });

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);

        if (newCount >= 5) {
            if (user.bannable) {
                try {
                    await user.ban({ reason: '5 advertencias acumuladas' });
                    await interaction.channel.send(`🔨 **${user.user.username}** ha sido baneado por acumular 5 advertencias.`);
                } catch (error) {
                    await interaction.channel.send(`⚠️ No se pudo banear automáticamente a **${user.user.username}**: ${error.message}`);
                }
            } else {
                await interaction.channel.send(`⚠️ **${user.user.username}** tiene 5 advertencias pero no pude banearlo (rol superior al mío).`);
            }
        }
    }
};
