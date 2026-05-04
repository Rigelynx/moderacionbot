import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { askMagic8Ball } from '../../utils/aiFun.js';

const answers = [
    // Positivas
    'Es cierto.', 'Es decididamente así.', 'Sin duda.', 'Sí, definitivamente.', 'Puedes confiar en ello.',
    'Como yo lo veo, sí.', 'Lo más probable.', 'Perspectiva buena.', 'Sí.', 'Las señales apuntan a que sí.',
    // Neutrales
    'Respuesta confusa, intenta de nuevo.', 'Pregunta de nuevo más tarde.', 
    'Mejor no decirte ahora.', 'No puedo predecir ahora.', 'Concéntrate y pregunta de nuevo.',
    // Negativas
    'No cuentes con ello.', 'Mi respuesta es no.', 'Mis fuentes dicen que no.', 
    'Perspectiva no tan buena.', 'Muy dudoso.'
];

export const command = {
    name: '8ball',
    description: 'Hazle una pregunta a la bola mágica 8',
    options: [
        {
            name: 'pregunta',
            type: ApplicationCommandOptionType.String,
            description: 'Lo que quieres saber',
            required: true
        },
        {
            name: 'modo',
            type: ApplicationCommandOptionType.String,
            description: 'Modo de respuesta',
            required: false,
            choices: [
                { name: 'Clasico', value: 'clasico' },
                { name: 'IA', value: 'ia' }
            ]
        },
        {
            name: 'personalidad',
            type: ApplicationCommandOptionType.String,
            description: 'Personalidad para el modo IA',
            required: false,
            choices: [
                { name: 'Sabia', value: 'sabia' },
                { name: 'Sarcastica suave', value: 'sarcastica' },
                { name: 'Dramatica', value: 'dramatica' },
                { name: 'Caotica', value: 'caotica' }
            ]
        }
    ],
    async execute(interaction) {
        const question = interaction.options.getString('pregunta');
        const mode = interaction.options.getString('modo') || 'clasico';
        const personality = interaction.options.getString('personalidad') || 'sabia';
        const answer = answers[Math.floor(Math.random() * answers.length)];
        let finalAnswer = answer;
        let footerNote = `Preguntado por ${interaction.user.username}`;

        let color = 0x5865f2; // Azul por defecto

        if (mode === 'ia') {
            await interaction.deferReply();
            const aiResult = await askMagic8Ball(interaction.guild.id, {
                question,
                personality
            });

            if (aiResult.ok) {
                finalAnswer = aiResult.text;
                color = 0x2B2D42;
                footerNote = `Modo IA (${personality}) · ${footerNote}`;
            } else {
                footerNote = `IA no disponible: ${aiResult.reason}. Use modo clasico.`;
            }
        }

        if (mode !== 'ia' || finalAnswer === answer) {
            // Asignar colores basados en la respuesta clasica.
            const positiveIndex = answers.indexOf(answer);
            if (positiveIndex < 10) color = 0x00ff00; // Verde (Positiva)
            else if (positiveIndex < 15) color = 0xffff00; // Amarillo (Neutral)
            else color = 0xff0000; // Rojo (Negativa)
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎱 Bola Mágica 8')
            .addFields(
                { name: 'Pregunta', value: question },
                { name: 'Respuesta', value: finalAnswer.slice(0, 1024) }
            )
            .setFooter({ text: footerNote.slice(0, 2048) })
            .setTimestamp();

        if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.reply({ embeds: [embed] });
        }
    }
};
