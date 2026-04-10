import { EmbedBuilder } from 'discord.js';
import { setAfk } from '../../utils/afk.js';

export const command = {
    name: 'afk',
    description: 'Establece tu estado como ausente (AFK)',
    options: [
        {
            name: 'razon',
            type: 3, // STRING
            description: 'Razón de tu ausencia',
            required: false
        }
    ],
    async execute(interaction, client) {
        const razon = interaction.options.getString('razon') || 'AFK';
        
        setAfk(interaction.guild.id, interaction.user.id, razon);

        // Cambiar el nick temporalmente a [AFK] Name si tiene permisos, aunque a veces el bot no puede cambiar nicknames altos.
        try {
            if (interaction.member.manageable) {
                const prefix = '[AFK] ';
                let currentNick = interaction.member.displayName;
                if (!currentNick.startsWith(prefix)) {
                    // Truncar para no pasar el límite de 32 caracteres de Discord
                    const newNick = (prefix + currentNick).substring(0, 32);
                    await interaction.member.setNickname(newNick);
                }
            }
        } catch(e) {
            // Ignorar errores de permisos de nick
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`✅ He configurado tu estado como AFK.\n**Razón:** ${razon}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
