import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { addTempBan } from '../../utils/tempbans.js';

export const command = {
    name: 'tempban',
    description: 'Banear temporalmente a un usuario',
    default_member_permissions: '4', // BanMembers
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a banear temporalmente',
            required: true
        },
        {
            name: 'cantidad',
            type: 4,
            description: 'Cantidad de tiempo',
            required: true,
            min_value: 1,
            max_value: 365
        },
        {
            name: 'unidad',
            type: 3,
            description: 'Unidad de tiempo',
            required: true,
            choices: [
                { name: 'Minutos', value: 'm' },
                { name: 'Horas', value: 'h' },
                { name: 'Días', value: 'd' }
            ]
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón del ban temporal',
            required: false
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const cantidad = interaction.options.getInteger('cantidad');
        const unidad = interaction.options.getString('unidad');
        const reason = interaction.options.getString('razon') || 'No especificada';

        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes banearte a ti mismo.', flags: 64 });
        }

        if (user.id === client.user.id) {
            return interaction.reply({ content: '❌ No puedo banearme a mí mismo.', flags: 64 });
        }

        if (!user.bannable) {
            return interaction.reply({ content: '❌ No puedo banear a este usuario. Puede tener un rol superior al mío.', flags: 64 });
        }

        const multipliers = { m: 60000, h: 3600000, d: 86400000 };
        const durationMs = cantidad * multipliers[unidad];
        const expiresAt = new Date(Date.now() + durationMs).toISOString();

        const unitNames = { m: 'minuto(s)', h: 'hora(s)', d: 'día(s)' };
        const durationText = `${cantidad} ${unitNames[unidad]}`;

        // Save temp ban data
        addTempBan(interaction.guild.id, user.id, reason, interaction.user.username, expiresAt);

        // Ban the user
        await user.ban({ reason: `[TempBan: ${durationText}] ${reason}` });

        const embed = createModerationEmbed({
            color: 0xff4500,
            title: '⏰ Ban Temporal',
            user,
            moderator: interaction.user,
            fields: [
                { name: 'Duración', value: durationText, inline: true },
                { name: 'Expira', value: `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>`, inline: true },
                { name: 'Razón', value: reason }
            ]
        });

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
