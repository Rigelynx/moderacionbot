import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

export const command = {
    name: 'poll',
    description: 'Crear una encuesta con reacciones',
    options: [
        {
            name: 'pregunta',
            type: 3,
            description: 'La pregunta de la encuesta',
            required: true
        },
        {
            name: 'opcion1',
            type: 3,
            description: 'Primera opción',
            required: true
        },
        {
            name: 'opcion2',
            type: 3,
            description: 'Segunda opción',
            required: true
        },
        {
            name: 'opcion3',
            type: 3,
            description: 'Tercera opción',
            required: false
        },
        {
            name: 'opcion4',
            type: 3,
            description: 'Cuarta opción',
            required: false
        },
        {
            name: 'opcion5',
            type: 3,
            description: 'Quinta opción',
            required: false
        }
    ],
    async execute(interaction, client) {
        const pregunta = interaction.options.getString('pregunta');
        const options = [];

        for (let i = 1; i <= 5; i++) {
            const opt = interaction.options.getString(`opcion${i}`);
            if (opt) options.push(opt);
        }

        const optionsText = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📊 Encuesta')
            .setDescription(`**${pregunta}**\n\n${optionsText}`)
            .setFooter({ text: `Creada por ${interaction.user.username}` })
            .setTimestamp();

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

        // Add reactions
        for (let i = 0; i < options.length; i++) {
            await msg.react(numberEmojis[i]);
        }

        // Log
        const logEmbed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📊 Encuesta Creada')
            .addFields(
                { name: 'Pregunta', value: pregunta },
                { name: 'Opciones', value: options.join(', ') },
                { name: 'Canal', value: `<#${interaction.channel.id}>`, inline: true },
                { name: 'Creador', value: interaction.user.username, inline: true }
            )
            .setTimestamp();
        await sendLog(interaction.guild, { embeds: [logEmbed] }, client);
    }
};
