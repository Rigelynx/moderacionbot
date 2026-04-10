import { EmbedBuilder } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

const permOptions = [
    { name: 'canal', type: 7, description: 'Canal', required: true },
    { name: 'rol', type: 8, description: 'Rol', required: true },
    { name: 'estado', type: 3, description: 'allow/deny/reset', required: true, choices: [
        { name: 'Permitir', value: 'allow' },
        { name: 'Denegar', value: 'deny' },
        { name: 'Resetear', value: 'reset' }
    ]}
];

export const command = {
    name: 'perm',
    description: 'Configurar permisos de canal',
    default_member_permissions: '16', // ManageChannels
    options: [
        { name: 'view', description: 'Permiso para ver canal', type: 1, options: [...permOptions] },
        { name: 'send', description: 'Permiso para enviar mensajes', type: 1, options: [...permOptions] },
        { name: 'embed', description: 'Permiso para insertar enlaces', type: 1, options: [...permOptions] },
        { name: 'manage', description: 'Permiso para gestionar canal', type: 1, options: [...permOptions] },
        { name: 'speak', description: 'Permiso para hablar en voz', type: 1, options: [...permOptions] },
        { name: 'react', description: 'Permiso para añadir reacciones', type: 1, options: [...permOptions] },
        { name: 'attach', description: 'Permiso para adjuntar archivos', type: 1, options: [...permOptions] },
        { name: 'mention', description: 'Permiso para mencionar @everyone', type: 1, options: [...permOptions] },
        { name: 'history', description: 'Permiso para leer historial de mensajes', type: 1, options: [...permOptions] },
        { name: 'connect', description: 'Permiso para conectarse a canal de voz', type: 1, options: [...permOptions] },
        { name: 'stream', description: 'Permiso para transmitir en voz', type: 1, options: [...permOptions] },
        { name: 'priority', description: 'Permiso para ser orador prioritario', type: 1, options: [...permOptions] }
    ],
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.options.getChannel('canal');
        const role = interaction.options.getRole('rol');
        const estado = interaction.options.getString('estado');

        const permissionMap = {
            view: 'ViewChannel',
            send: 'SendMessages',
            embed: 'EmbedLinks',
            manage: 'ManageChannels',
            speak: 'Speak',
            react: 'AddReactions',
            attach: 'AttachFiles',
            mention: 'MentionEveryone',
            history: 'ReadMessageHistory',
            connect: 'Connect',
            stream: 'Stream',
            priority: 'PrioritySpeaker'
        };

        const permissionNames = {
            ViewChannel: 'Ver Canal',
            SendMessages: 'Enviar Mensajes',
            EmbedLinks: 'Insertar Enlaces',
            ManageChannels: 'Gestionar Canal',
            Speak: 'Hablar',
            AddReactions: 'Añadir Reacciones',
            AttachFiles: 'Adjuntar Archivos',
            MentionEveryone: 'Mencionar @everyone',
            ReadMessageHistory: 'Leer Historial',
            Connect: 'Conectar a Voz',
            Stream: 'Transmitir',
            PrioritySpeaker: 'Orador Prioritario'
        };

        const permission = permissionMap[subcommand];
        let value = null;

        switch (estado) {
            case 'allow':
                value = true;
                break;
            case 'deny':
                value = false;
                break;
            case 'reset':
                value = null;
                break;
        }

        try {
            await channel.permissionOverwrites.edit(role, {
                [permission]: value
            });

            const estadoEmoji = estado === 'allow' ? '✅' : estado === 'deny' ? '❌' : '🔄';
            const estadoTexto = estado === 'allow' ? 'Permitido' : estado === 'deny' ? 'Denegado' : 'Reseteado';

            const embed = new EmbedBuilder()
                .setColor(estado === 'allow' ? 0x00ff00 : estado === 'deny' ? 0xff0000 : 0x808080)
                .setTitle(`${estadoEmoji} Permiso Actualizado`)
                .addFields(
                    { name: 'Canal', value: `<#${channel.id}>`, inline: true },
                    { name: 'Rol', value: role.name, inline: true },
                    { name: 'Permiso', value: permissionNames[permission] || permission, inline: true },
                    { name: 'Estado', value: estadoTexto, inline: true },
                    { name: 'Moderador', value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.reply({ content: `❌ Error al actualizar permisos: ${error.message}`, flags: 64 });
        }
    }
};
