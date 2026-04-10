import { EmbedBuilder } from 'discord.js';

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
            type: 3,
            description: 'Lo que quieres saber',
            required: true
        }
    ],
    async execute(interaction) {
        const question = interaction.options.getString('pregunta');
        const answer = answers[Math.floor(Math.random() * answers.length)];

        let color = 0x5865f2; // Azul por defecto
        
        // Asignar colores basados en la respuesta
        const positiveIndex = answers.indexOf(answer);
        if (positiveIndex < 10) color = 0x00ff00; // Verde (Positiva)
        else if (positiveIndex < 15) color = 0xffff00; // Amarillo (Neutral)
        else color = 0xff0000; // Rojo (Negativa)

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎱 Bola Mágica 8')
            .addFields(
                { name: 'Pregunta', value: question },
                { name: 'Respuesta', value: answer }
            )
            .setFooter({ text: `Preguntado por ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
