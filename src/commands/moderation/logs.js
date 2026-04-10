import { EmbedBuilder } from 'discord.js';
import { isLogsEnabled, getLogChannelName, setLogChannel, setLogsEnabled } from '../../utils/config.js';

export const command = {
    name: 'logs',
    description: 'Gestionar el sistema de logs',
    default_member_permissions: '32',
    options: [
        {
            name: 'set',
            description: 'Establecer el canal de logs',
            type: 1,
            options: [
                {
                    name: 'canal',
                    type: 7,
                    description: 'Canal para enviar logs',
                    required: true
                }
            ]
        },
        {
            name: 'disable',
            description: 'Desactivar el sistema de logs',
            type: 1
        },
        {
            name: 'enable',
            description: 'Activar el sistema de logs',
            type: 1
        },
        {
            name: 'status',
            description: 'Ver estado actual de logs',
            type: 1
        }
    ],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'set':
                await this.setChannel(interaction, client);
                break;
            case 'disable':
                await this.disableLogs(interaction);
                break;
            case 'enable':
                await this.enableLogs(interaction);
                break;
            case 'status':
                await this.status(interaction);
                break;
        }
    },

    async setChannel(interaction, client) {
        const canal = interaction.options.getChannel('canal');

        if (!canal.isTextBased()) {
            return interaction.reply({ content: '❌ Selecciona un canal de texto.', flags: 64 });
        }

        setLogChannel(interaction.guild.id, canal.name);

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Canal de Logs Actualizado')
            .addFields(
                { name: 'Canal', value: `#${canal.name}`, inline: true },
                { name: 'Estado', value: 'Activado', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async disableLogs(interaction) {
        setLogsEnabled(interaction.guild.id, false);

        const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('🔕 Logs Desactivados')
            .setDescription('Los comandos de moderación ya no enviarán mensajes al canal de logs.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async enableLogs(interaction) {
        setLogsEnabled(interaction.guild.id, true);

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🔔 Logs Activados')
            .setDescription(`Los logs se enviarán a #${getLogChannelName(interaction.guild.id)}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async status(interaction) {
        const enabled = isLogsEnabled(interaction.guild.id);
        const channelName = getLogChannelName(interaction.guild.id);
        const channel = interaction.guild.channels.cache.find(c => c.name === channelName);

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle('📋 Estado de Logs')
            .addFields(
                { name: 'Estado', value: enabled ? '🟢 Activado' : '🔴 Desactivado', inline: true },
                { name: 'Canal', value: channel ? `#${channel.name}` : '❌ No encontrado', inline: true },
                { name: 'Canal configurado', value: channelName, inline: false }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
