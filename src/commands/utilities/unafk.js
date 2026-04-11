import { EmbedBuilder } from 'discord.js';
import { getAfk, removeAfk } from '../../utils/afk.js';
import { sendLog } from '../../utils/embeds.js';

const AFK_PREFIX = '[AFK] ';

export const command = {
    name: 'unafk',
    description: 'Quita manualmente tu estado AFK',
    async execute(interaction, client) {
        const previousAfk = getAfk(interaction.guild.id, interaction.user.id);
        const removedAfk = removeAfk(interaction.guild.id, interaction.user.id);

        let removedNicknamePrefix = false;

        try {
            if (interaction.member?.manageable) {
                const currentNick = interaction.member.displayName;
                if (currentNick.startsWith(AFK_PREFIX)) {
                    await interaction.member.setNickname(currentNick.replace(AFK_PREFIX, '').substring(0, 32));
                    removedNicknamePrefix = true;
                }
            }
        } catch {
            // Ignorar errores de permisos de nick
        }

        if (!removedAfk && !removedNicknamePrefix) {
            return interaction.reply({
                content: 'ℹ️ No tienes un estado AFK activo en este momento.',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00b894)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setTitle('👋 Estado AFK Desactivado')
            .setDescription('He quitado manualmente tu estado AFK.')
            .setTimestamp();

        if (previousAfk?.reason) {
            embed.addFields({ name: 'Razón anterior', value: previousAfk.reason, inline: false });
        }

        await interaction.reply({ embeds: [embed] });

        const logEmbed = new EmbedBuilder()
            .setTitle('👋 Estado AFK Desactivado')
            .setColor(0x00b894)
            .addFields(
                { name: 'Usuario', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Manual', value: 'Sí', inline: true }
            )
            .setTimestamp();

        if (previousAfk?.reason) {
            logEmbed.addFields({ name: 'Razón anterior', value: previousAfk.reason, inline: false });
        }

        await sendLog(interaction.guild, { embeds: [logEmbed] }, client);
    }
};
