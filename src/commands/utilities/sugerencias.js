import { EmbedBuilder } from 'discord.js';
import { getSuggestionsConfig } from '../../utils/config.js';

export const command = {
    name: 'sugerencias',
    description: 'Sistema de sugerencias',
    options: [
        {
            name: 'enviar',
            description: 'Envía una sugerencia al sistema',
            type: 1, // SUB_COMMAND
            options: [
                {
                    name: 'texto',
                    type: 3, // STRING
                    description: 'Escribe tu sugerencia detalladamente',
                    required: true
                }
            ]
        },
        {
            name: 'setup',
            description: 'Configura el canal para recibir sugerencias',
            type: 1, // SUB_COMMAND
            options: [
                {
                    name: 'canal',
                    type: 7, // CHANNEL
                    description: 'Canal de texto destino',
                    required: true
                }
            ]
        }
    ],
    async execute(interaction, client) {
        const subCommand = interaction.options.getSubcommand();

        if (subCommand === 'setup') {
            if (!interaction.member.permissions.has('ManageGuild')) {
                return interaction.reply({ content: '❌ Necesitas permisos de Administrar Servidor.', flags: 64 });
            }
            const canal = interaction.options.getChannel('canal');
            
            const { setSuggestionsChannel } = await import('../../utils/config.js');
            setSuggestionsChannel(interaction.guild.id, canal.id);
            
            return interaction.reply({ content: `✅ Canal de sugerencias configurado a <#${canal.id}>`, flags: 64 });
        }

        if (subCommand === 'enviar') {
            const config = getSuggestionsConfig(interaction.guild.id);
            const texto = interaction.options.getString('texto');

            if (!config || !config.channelId) {
                return interaction.reply({ content: '❌ El sistema de sugerencias no está configurado. Usa `/sugerencias setup` primero.', flags: 64 });
            }

            const channel = interaction.guild.channels.cache.get(config.channelId);
            if (!channel) {
                return interaction.reply({ content: '❌ El canal de sugerencias configurado no existe. Configúralo de nuevo.', flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle('💡 Nueva Sugerencia')
                .setDescription(texto)
                .setColor(0x00ff00)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ content: '✅ Sugerencia enviada exitosamente.', flags: 64 });
            const msg = await channel.send({ embeds: [embed] });
            await msg.react('✅');
            await msg.react('❌');
        }
    }
};
