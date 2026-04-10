import { PermissionsBitField } from 'discord.js';

// Middleware: require authenticated session
export function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'No autenticado. Inicia sesión primero.' });
    }
    next();
}

// Middleware: require admin permissions on a guild
export function requireGuildAdmin(client) {
    return (req, res, next) => {
        const guildId = req.params.id;
        const userId = req.session.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // Check if the user has MANAGE_GUILD or ADMINISTRATOR in their guild list
        const userGuild = req.session.user.guilds?.find(g => g.id === guildId);
        if (!userGuild) {
            return res.status(403).json({ error: 'No tienes acceso a este servidor' });
        }

        const permissions = new PermissionsBitField(BigInt(userGuild.permissions));
        const hasAdmin = permissions.has(PermissionsBitField.Flags.Administrator) ||
                         permissions.has(PermissionsBitField.Flags.ManageGuild);

        if (!hasAdmin) {
            return res.status(403).json({ error: 'No tienes permisos de administrador en este servidor' });
        }

        // Check if bot is in this guild
        const botGuild = client.guilds.cache.get(guildId);
        if (!botGuild) {
            return res.status(404).json({ error: 'El bot no está en este servidor' });
        }

        req.guild = botGuild;
        next();
    };
}
