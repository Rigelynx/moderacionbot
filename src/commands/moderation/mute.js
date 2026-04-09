import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { parseDuration } from '../../utils/helpers.js';

export const command = {
    name: 'mute',
    description: 'Silenciar a un usuario',
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
            required: false,
            min_value: 1,
            max_value: 2147483647
        },
        {
            name: 'unidad',
            type: 3,
            description: 'Unidad de tiempo',
            required: false,
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
        
        if (user.isCommunicationDisabled()) {
            return interaction.reply({ content: '❌ Este usuario ya está silenciado.', flags: 64 });
        }
        
        let durationText = 'indefinido';
        let durationMs = null;
        
        if (cantidad && unidad) {
            const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
            durationMs = cantidad * multipliers[unidad];
            durationText = `${cantidad} ${unidad === 's' ? 'segundo(s)' : unidad === 'm' ? 'minuto(s)' : unidad === 'h' ? 'hora(s)' : 'día(s)'}`;
            
            if (durationMs) {
                await user.timeout(durationMs);
            }
        }
        
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
