import { EmbedBuilder } from 'discord.js';
import { getWarnings } from '../../utils/warnings.js';

export const command = {
    name: 'warnings',
    description: 'Ver las advertencias de un usuario',
    default_member_permissions: '1099511627776',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a consultar',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario') || interaction.member;
        const guildId = interaction.guild.id;
        const warns = getWarnings(guildId, user.id);

        const embed = new EmbedBuilder()
            .setColor(0xffff00)
            .setTitle('📋 Registro de Advertencias')
            .addFields(
                { name: 'Usuario', value: user.user.username, inline: true },
                { name: 'Total', value: `${warns.length}/5`, inline: true }
            )
            .setTimestamp();

        if (warns.length > 0) {
            const warnList = warns.map((w, i) => {
                const timestamp = Math.floor(new Date(w.date).getTime() / 1000);
                return `**${i + 1}.** ${w.reason} — por ${w.moderator} (<t:${timestamp}:R>)`;
            }).join('\n');

            embed.addFields({ name: 'Detalle', value: warnList.slice(0, 1024) });
        } else {
            embed.setDescription('Este usuario no tiene advertencias.');
        }

        await interaction.reply({ embeds: [embed] });
    }
};
