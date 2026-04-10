import { EmbedBuilder, PermissionsBitField, ChannelType } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'lockdown',
    description: 'Bloquea o desbloquea todos los canales de texto del servidor',
    default_member_permissions: '32', // ManageGuild / Administrator
    options: [
        {
            name: 'estado',
            type: 3, // STRING
            description: 'Activar o desactivar el lockdown',
            required: true,
            choices: [
                { name: 'Activar (Bloquear servidor)', value: 'lock' },
                { name: 'Desactivar (Desbloquear servidor)', value: 'unlock' }
            ]
        }
    ],
    async execute(interaction, client) {
        const action = interaction.options.getString('estado');
        const isLocking = action === 'lock';
        
        await interaction.deferReply(); // Podría tardar si hay muchos canales

        try {
            const channels = interaction.guild.channels.cache.filter(
                c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement
            );

            let successCount = 0;
            const everyoneRole = interaction.guild.roles.everyone;

            for (const [id, channel] of channels) {
                // Ignore channels where everyone already cannot send messages, 
                // but actually for consistency we just force it in overwrites.
                try {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: isLocking ? false : null
                    });
                    successCount++;
                } catch (e) {
                    // Ignore channels we don't have perms for
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(isLocking ? '🔒 Servidor en Lockdown' : '🔓 Lockdown Terminado')
                .setDescription(isLocking ? 
                    `El servidor ha sido bloqueado por razones de seguridad.\nSe modificaron ${successCount} canales.` : 
                    `El servidor ha vuelto a la normalidad.\nSe restauraron ${successCount} canales.`)
                .setColor(isLocking ? 0xff0000 : 0x00ff00)
                .setFooter({ text: `Acción por ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            await sendLog(interaction.guild, { embeds: [embed] }, client);
        } catch (error) {
            await interaction.editReply({ content: `❌ Error al procesar el lockdown: ${error.message}` });
        }
    }
};
