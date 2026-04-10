import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { sendLog } from '../../utils/embeds.js';

export const command = {
    name: 'nuke',
    description: 'Elimina y clona el canal actual para limpiar el historial al 100%',
    default_member_permissions: '16', // ManageChannels
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: '❌ No tienes permisos para usar esto.', flags: 64 });
        }
        
        await interaction.reply({ content: 'Preparando nuke...', flags: 64 });
        
        const channelToNuke = interaction.channel;
        try {
            const clonedChannel = await channelToNuke.clone();
            await clonedChannel.setPosition(channelToNuke.position);
            
            await channelToNuke.delete('Nuked by ' + interaction.user.tag);
            
            const embed = new EmbedBuilder()
                .setTitle('☢️ Canal Nuked')
                .setDescription('Este canal ha sido limpiado y reiniciado.')
                .setColor(0xff0000)
                .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
                .setFooter({ text: `Nuked por ${interaction.user.username}` })
                .setTimestamp();
                
            await clonedChannel.send({ embeds: [embed] });
            
            // Log if possible
            const logEmbed = new EmbedBuilder()
                .setTitle('☢️ Canal Nuked')
                .addFields(
                    { name: 'Canal', value: `#${clonedChannel.name}`, inline: true },
                    { name: 'Moderador', value: interaction.user.tag, inline: true }
                )
                .setColor(0xff0000)
                .setTimestamp();
            await sendLog(interaction.guild, { embeds: [logEmbed] }, client);
            
        } catch (error) {
            console.error('Error in nuke:', error);
            // Si falla y aún existe el canal, mandar msj
            if (interaction.channel) {
                await interaction.editReply({ content: `❌ Fallo al nukear el canal: ${error.message}` });
            }
        }
    }
};
