import { EmbedBuilder } from 'discord.js';

const choices = ['piedra', 'papel', 'tijeras'];
const winMap = {
    piedra: 'tijeras',
    papel: 'piedra',
    tijeras: 'papel'
};
const emojis = {
    piedra: '🪨',
    papel: '📄',
    tijeras: '✂️'
};

export const command = {
    name: 'rps',
    description: 'Juega piedra, papel o tijeras contra el bot',
    options: [
        {
            name: 'eleccion',
            type: 3,
            description: 'Tu elección',
            required: true,
            choices: [
                { name: 'Piedra', value: 'piedra' },
                { name: 'Papel', value: 'papel' },
                { name: 'Tijeras', value: 'tijeras' }
            ]
        }
    ],
    async execute(interaction) {
        const userChoice = interaction.options.getString('eleccion');
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let result = '';
        let color = 0x5865f2;

        if (userChoice === botChoice) {
            result = '¡Es un empate!';
            color = 0xffff00; // Amarillo
        } else if (winMap[userChoice] === botChoice) {
            result = '¡Tú ganas!';
            color = 0x00ff00; // Verde
        } else {
            result = '¡Yo gano!';
            color = 0xff0000; // Rojo
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('✊✋✌️ Piedra, Papel o Tijeras')
            .addFields(
                { name: 'Tu elección', value: `${emojis[userChoice]} ${userChoice}`, inline: true },
                { name: 'Mi elección', value: `${emojis[botChoice]} ${botChoice}`, inline: true },
                { name: 'Resultado', value: result }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
