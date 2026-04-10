import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'announce',
    description: 'Enviar un anuncio con embed a un canal',
    default_member_permissions: '8192', // ManageMessages
    options: [
        {
            name: 'canal',
            type: 7,
            description: 'Canal donde enviar el anuncio',
            required: true,
            channel_types: [0] // Text channels only
        },
        {
            name: 'titulo',
            type: 3,
            description: 'Título del anuncio',
            required: true
        },
        {
            name: 'mensaje',
            type: 3,
            description: 'Contenido del anuncio',
            required: true
        },
        {
            name: 'color',
            type: 3,
            description: 'Color del embed (hex sin #)',
            required: false
        }
    ],
    async execute(interaction, client) {
        const channel = interaction.options.getChannel('canal');
        const titulo = interaction.options.getString('titulo');
        const mensaje = interaction.options.getString('mensaje');
        const colorInput = interaction.options.getString('color');

        let color = 0x5865f2;
        if (colorInput) {
            const parsed = parseInt(colorInput.replace('#', ''), 16);
            if (!isNaN(parsed)) color = parsed;
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(titulo)
            .setDescription(mensaje)
            .setFooter({ text: `Anuncio de ${interaction.user.username}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] });

        const confirmEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Anuncio Enviado')
            .addFields(
                { name: 'Canal', value: `<#${channel.id}>`, inline: true },
                { name: 'Título', value: titulo, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [confirmEmbed], flags: 64 });

        // Log
        const logEmbed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📢 Anuncio Enviado')
            .addFields(
                { name: 'Canal', value: `<#${channel.id}>`, inline: true },
                { name: 'Título', value: titulo, inline: true },
                { name: 'Moderador', value: interaction.user.username, inline: true }
            )
            .setTimestamp();
        await sendLog(interaction.guild, { embeds: [logEmbed] }, client);
    }
};
