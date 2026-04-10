import { EmbedBuilder } from 'discord.js';

export const command = {
    name: 'membercount',
    description: 'Ver el conteo de miembros del servidor',
    async execute(interaction) {
        const guild = interaction.guild;
        const members = await guild.members.fetch();
        const humans = members.filter(m => !m.user.bot).size;
        const bots = members.filter(m => m.user.bot).size;
        const online = members.filter(m => m.presence?.status === 'online').size;
        const idle = members.filter(m => m.presence?.status === 'idle').size;
        const dnd = members.filter(m => m.presence?.status === 'dnd').size;

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📊 Miembros de ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 128 }))
            .addFields(
                { name: '👥 Total', value: guild.memberCount.toString(), inline: true },
                { name: '👤 Humanos', value: humans.toString(), inline: true },
                { name: '🤖 Bots', value: bots.toString(), inline: true },
                { name: '🟢 Online', value: online.toString(), inline: true },
                { name: '🌙 Ausente', value: idle.toString(), inline: true },
                { name: '⛔ No Molestar', value: dnd.toString(), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
