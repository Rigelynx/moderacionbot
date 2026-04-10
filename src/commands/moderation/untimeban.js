import { sendLog, createModerationEmbed } from '../../utils/embeds.js';
import { removeTempBan, getTempBan } from '../../utils/tempbans.js';
import { clearWarnings } from '../../utils/warnings.js';

export const command = {
    name: 'untimeban',
    description: 'Quitar un ban temporal antes de que expire',
    default_member_permissions: '4', // BanMembers
    options: [
        {
            name: 'usuario',
            type: 3,
            description: 'ID del usuario a desbanear',
            required: true
        },
        {
            name: 'razon',
            type: 3,
            description: 'Razón para quitar el ban temporal',
            required: false
        }
    ],
    async execute(interaction, client) {
        const userId = interaction.options.getString('usuario');
        const reason = interaction.options.getString('razon') || 'No especificada';

        // Check if user has a temp ban
        const tempBan = getTempBan(interaction.guild.id, userId);
        if (!tempBan) {
            return interaction.reply({ content: '❌ Este usuario no tiene un ban temporal activo. Usa `/unban` para un ban normal.', flags: 64 });
        }

        // Verify they are actually banned
        const bans = await interaction.guild.bans.fetch();
        const bannedUser = bans.find(b => b.user.id === userId);

        if (!bannedUser) {
            // Not banned anymore, just clean up the temp ban record
            removeTempBan(interaction.guild.id, userId);
            return interaction.reply({ content: '❌ Este usuario ya no está baneado. Registro de tempban limpiado.', flags: 64 });
        }

        // Unban and remove temp ban record
        await interaction.guild.members.unban(userId, `[Untimeban] ${reason}`);
        removeTempBan(interaction.guild.id, userId);
        clearWarnings(interaction.guild.id, userId);

        const embed = createModerationEmbed({
            color: 0x00ff00,
            title: '⏰✅ Ban Temporal Eliminado',
            user: bannedUser.user,
            moderator: interaction.user,
            fields: [
                { name: 'Razón', value: reason },
                { name: 'Ban original', value: tempBan.reason || 'No especificada' },
                { name: 'Expiraba', value: `<t:${Math.floor(new Date(tempBan.expiresAt).getTime() / 1000)}:R>` }
            ]
        });

        await interaction.reply({ embeds: [embed] });
        await sendLog(interaction.guild, { embeds: [embed] }, client);
    }
};
