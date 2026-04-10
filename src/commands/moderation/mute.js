import { sendLog, createModerationEmbed } from '../../utils/embeds.js';

export const command = {
    name: 'mute',
    description: 'Silenciar a un usuario',
    default_member_permissions: '1099511627776',
    options: [
        {
            name: 'usuario',
            type: 6,
            description: 'Usuario a silenciar',
            required: true
        },
        {
            name: 'cantidad',
            type: 4,
            description: 'Cantidad de tiempo',
            required: true,
            min_value: 1,
            max_value: 40320
        },
        {
            name: 'unidad',
            type: 3,
            description: 'Unidad de tiempo',
            required: true,
            choices: [
                { name: 'Segundos', value: 's' },
                { name: 'Minutos', value: 'm' },
                { name: 'Horas', value: 'h' },
                { name: 'Días', value: 'd' }
            ]
        }
    ],
    async execute(interaction, client) {
        const user = interaction.options.getMember('usuario');
        const cantidad = interaction.options.getInteger('cantidad');
        const unidad = interaction.options.getString('unidad');

        if (!user) {
            return interaction.reply({ content: '❌ Usuario no encontrado.', flags: 64 });
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({ content: '❌ No puedes silenciarte a ti mismo.', flags: 64 });
        }

        if (user.id === client.user.id) {
            return interaction.reply({ content: '❌ No puedo silenciarme a mí mismo.', flags: 64 });
        }

        if (user.isCommunicationDisabled()) {
            return interaction.reply({ content: '❌ Este usuario ya está silenciado.', flags: 64 });
        }

        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const durationMs = cantidad * multipliers[unidad];

        // Discord limita el timeout a 28 días
        const maxTimeout = 28 * 24 * 60 * 60 * 1000;
        if (durationMs > maxTimeout) {
            return interaction.reply({ content: '❌ La duración máxima es 28 días.', flags: 64 });
        }

        const unitNames = { s: 'segundo(s)', m: 'minuto(s)', h: 'hora(s)', d: 'día(s)' };
        const durationText = `${cantidad} ${unitNames[unidad]}`;

        await user.timeout(durationMs);

        const embed = createModerationEmbed({
            color: 0x808080,
            title: '🔇 Usuario Silenciado',
            user,
            moderator: interaction.user,
            fields: [{ name: 'Duración', value: durationText }]
        });

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
