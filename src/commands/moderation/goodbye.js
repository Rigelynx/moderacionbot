import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';
import { getGoodbyeConfig, setGoodbyeEnabled, setGoodbyeChannel, setGoodbyeMessage, setGoodbyeBackground } from '../../utils/config.js';
import { generateCard } from '../../utils/welcomeCard.js';

export const command = {
    name: 'goodbye',
    description: 'Configurar el sistema de despedida',
    default_member_permissions: '32', // ManageGuild
    options: [
        {
            name: 'enable',
            description: 'Activar el sistema de despedida',
            type: 1
        },
        {
            name: 'disable',
            description: 'Desactivar el sistema de despedida',
            type: 1
        },
        {
            name: 'channel',
            description: 'Seleccionar el canal de despedida',
            type: 1,
            options: [
                {
                    name: 'canal',
                    type: 7,
                    description: 'Canal donde enviar las despedidas',
                    required: true,
                    channel_types: [0]
                }
            ]
        },
        {
            name: 'message',
            description: 'Cambiar el mensaje de despedida. Variables: {user} {server} {count}',
            type: 1,
            options: [
                {
                    name: 'texto',
                    type: 3,
                    description: 'Nuevo mensaje. Usa {user}, {server}, {count}',
                    required: true
                }
            ]
        },
        {
            name: 'background',
            description: 'Cambiar la imagen de fondo de la tarjeta',
            type: 1,
            options: [
                {
                    name: 'url',
                    type: 3,
                    description: 'URL de la imagen de fondo (o "reset" para el predeterminado)',
                    required: true
                }
            ]
        },
        {
            name: 'test',
            description: 'Probar la tarjeta de despedida contigo mismo',
            type: 1
        },
        {
            name: 'status',
            description: 'Ver la configuración actual de despedida',
            type: 1
        }
    ],
    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        switch (sub) {
            case 'enable': {
                setGoodbyeEnabled(guildId, true);
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ Despedida Activada')
                    .setDescription('El sistema de despedida ha sido **activado**.')
                    .addFields({ name: 'Moderador', value: interaction.user.username })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                await sendLog(interaction.guild, { embeds: [embed] }, client);
                break;
            }
            case 'disable': {
                setGoodbyeEnabled(guildId, false);
                const embed = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setTitle('⏸️ Despedida Desactivada')
                    .setDescription('El sistema de despedida ha sido **desactivado**.')
                    .addFields({ name: 'Moderador', value: interaction.user.username })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                await sendLog(interaction.guild, { embeds: [embed] }, client);
                break;
            }
            case 'channel': {
                const channel = interaction.options.getChannel('canal');
                setGoodbyeChannel(guildId, channel.id);
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('📢 Canal de Despedida Actualizado')
                    .addFields(
                        { name: 'Canal', value: `<#${channel.id}>`, inline: true },
                        { name: 'Moderador', value: interaction.user.username, inline: true }
                    )
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                await sendLog(interaction.guild, { embeds: [embed] }, client);
                break;
            }
            case 'message': {
                const text = interaction.options.getString('texto');
                setGoodbyeMessage(guildId, text);
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('💬 Mensaje de Despedida Actualizado')
                    .addFields(
                        { name: 'Nuevo mensaje', value: text },
                        { name: 'Moderador', value: interaction.user.username }
                    )
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                await sendLog(interaction.guild, { embeds: [embed] }, client);
                break;
            }
            case 'background': {
                const url = interaction.options.getString('url');
                if (url.toLowerCase() === 'reset') {
                    setGoodbyeBackground(guildId, null);
                    const embed = new EmbedBuilder()
                        .setColor(0x5865f2)
                        .setTitle('🖼️ Fondo de Despedida Reseteado')
                        .setDescription('Se usará el fondo predeterminado.')
                        .addFields({ name: 'Moderador', value: interaction.user.username })
                        .setTimestamp();
                    await interaction.reply({ embeds: [embed] });
                    await sendLog(interaction.guild, { embeds: [embed] }, client);
                } else {
                    setGoodbyeBackground(guildId, url);
                    const embed = new EmbedBuilder()
                        .setColor(0x5865f2)
                        .setTitle('🖼️ Fondo de Despedida Actualizado')
                        .addFields(
                            { name: 'URL', value: url },
                            { name: 'Moderador', value: interaction.user.username }
                        )
                        .setImage(url)
                        .setTimestamp();
                    await interaction.reply({ embeds: [embed] });
                    await sendLog(interaction.guild, { embeds: [embed] }, client);
                }
                break;
            }
            case 'test': {
                await interaction.deferReply();
                const config = getGoodbyeConfig(guildId);
                const attachment = await generateCard(interaction.member, 'goodbye', config);
                let message = config.message || '**{user}** ha abandonado **{server}** 😢';
                message = message
                    .replace(/{user}/gi, interaction.user.username)
                    .replace(/{server}/gi, interaction.guild.name)
                    .replace(/{count}/gi, interaction.guild.memberCount.toString());
                await interaction.editReply({ content: `🧪 **Vista previa de despedida:**\n${message}`, files: [attachment] });
                break;
            }
            case 'status': {
                const config = getGoodbyeConfig(guildId);
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle('📋 Configuración de Despedida')
                    .addFields(
                        { name: 'Estado', value: config.enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
                        { name: 'Canal', value: config.channelId ? `<#${config.channelId}>` : 'No configurado', inline: true },
                        { name: 'Fondo', value: config.backgroundUrl ? '[Imagen personalizada]' : 'Predeterminado', inline: true },
                        { name: 'Mensaje', value: config.message || '(predeterminado)' }
                    )
                    .setFooter({ text: 'Variables disponibles: {user}, {server}, {count}' })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                break;
            }
        }
    }
};
