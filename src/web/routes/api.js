import { Router } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/authMiddleware.js';
import {
    createDefaultCommandPermissionRule,
    getAllCommandPermissions,
    getAppearanceConfig,
    getConfig,
    getGoodbyeConfig,
    getLogChannelName,
    getWelcomeConfig,
    isLogsEnabled,
    setGoodbyeBackground,
    setLogChannel,
    setLogsEnabled,
    setWelcomeBackground,
    updateAppearanceConfig,
    updateCommandPermission,
    clearCommandPermission
} from '../../utils/config.js';
import { getWarnings, removeWarning } from '../../utils/warnings.js';

export function createApiRouter(client) {
    const router = Router();

    function normalizeOptionalText(value) {
        if (typeof value !== 'string') return undefined;

        const trimmed = value.trim();
        return trimmed || '';
    }

    function normalizeOptionalUrl(value) {
        if (typeof value !== 'string') return undefined;

        const trimmed = value.trim();
        return trimmed || null;
    }

    function isValidHexColor(value) {
        return /^#[0-9a-fA-F]{6}$/.test(value);
    }

    // ──────────── Public endpoints ────────────

    // Public bot stats
    router.get('/stats', (req, res) => {
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        res.json({
            servers: client.guilds.cache.size,
            users: totalMembers,
            commands: client.slashCommands?.size || 0,
            uptime: process.uptime(),
            ping: client.ws.ping
        });
    });

    router.get('/bot', (req, res) => {
        res.json({
            id: client.user?.id || null,
            username: client.user?.username || 'ModBot',
            tag: client.user?.tag || 'ModBot',
            avatar: client.user?.displayAvatarURL({ size: 128 }) || null
        });
    });

    // ──────────── Protected endpoints ────────────

    // User's guilds where bot is present
    router.get('/guilds', requireAuth, (req, res) => {
        const userGuilds = req.session.user.guilds || [];
        const botGuildIds = new Set(client.guilds.cache.map(g => g.id));

        const mutual = userGuilds
            .filter(g => botGuildIds.has(g.id))
            .filter(g => {
                const perms = BigInt(g.permissions);
                return (perms & 0x20n) === 0x20n || (perms & 0x8n) === 0x8n; // MANAGE_GUILD or ADMINISTRATOR
            })
            .map(g => {
                const botGuild = client.guilds.cache.get(g.id);
                return {
                    id: g.id,
                    name: g.name,
                    icon: g.icon
                        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
                        : null,
                    memberCount: botGuild?.memberCount || 0
                };
            });

        res.json(mutual);
    });

    // Guild detail
    router.get('/guilds/:id', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guild = req.guild;
        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ size: 128 }),
            memberCount: guild.memberCount,
            channels: guild.channels.cache
                .filter(c => c.type === 0) // Text channels
                .map(c => ({ id: c.id, name: c.name })),
            roles: guild.roles.cache
                .filter(r => r.id !== guild.id) // exclude @everyone
                .sort((a, b) => b.position - a.position)
                .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
        });
    });

    // Slash commands available for this bot
    router.get('/guilds/:id/commands', requireAuth, requireGuildAdmin(client), (req, res) => {
        const commands = [...client.slashCommands.values()]
            .map(command => ({
                name: command.name,
                description: command.description,
                category: command.category || 'general',
                defaultMemberPermissions: command.default_member_permissions || null
            }))
            .sort((a, b) => {
                if (a.category !== b.category) {
                    return a.category.localeCompare(b.category);
                }
                return a.name.localeCompare(b.name);
            });

        res.json(commands);
    });

    // Guild warnings
    router.get('/guilds/:id/warnings', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        const guildWarnings = {};

        // Get all warnings for this guild from the warnings module
        // We need to access the raw warnings data
        const allConfig = getConfig();
        
        // Build warnings map with user info
        const guild = req.guild;
        
        // Import raw warnings — we read them from file
        import('../../utils/warnings.js').then(async (warningsModule) => {
            // We need to read the warnings file directly
            const { readFileSync, existsSync } = await import('fs');
            const { join, dirname } = await import('path');
            const { fileURLToPath } = await import('url');
            
            const __dirname = dirname(fileURLToPath(import.meta.url));
            const warningsFile = join(__dirname, '..', '..', 'data', 'warnings.json');
            
            let allWarnings = {};
            if (existsSync(warningsFile)) {
                allWarnings = JSON.parse(readFileSync(warningsFile, 'utf-8'));
            }

            const guildWarns = allWarnings[guildId] || {};
            const result = [];

            for (const [userId, warns] of Object.entries(guildWarns)) {
                let member;
                try {
                    member = await guild.members.fetch(userId).catch(() => null);
                } catch { member = null; }

                for (let i = 0; i < warns.length; i++) {
                    result.push({
                        userId,
                        username: member?.user?.username || `Usuario ${userId}`,
                        avatar: member?.user?.displayAvatarURL({ size: 64 }) || null,
                        index: i,
                        reason: warns[i].reason,
                        moderator: warns[i].moderator,
                        date: warns[i].date
                    });
                }
            }

            res.json(result);
        }).catch(err => {
            res.status(500).json({ error: 'Error leyendo warnings' });
        });
    });

    // Delete a warning
    router.delete('/guilds/:id/warnings/:userId/:index', requireAuth, requireGuildAdmin(client), (req, res) => {
        const { id: guildId, userId, index } = req.params;
        const idx = parseInt(index);

        if (isNaN(idx) || idx < 0) {
            return res.status(400).json({ error: 'Índice inválido' });
        }

        const success = removeWarning(guildId, userId, idx);
        if (success) {
            res.json({ success: true, message: 'Advertencia eliminada' });
        } else {
            res.status(404).json({ error: 'Advertencia no encontrada' });
        }
    });

    // Guild config
    router.get('/guilds/:id/config', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        res.json({
            logsEnabled: isLogsEnabled(guildId),
            logChannel: getLogChannelName(guildId)
        });
    });

    // Update guild config
    router.post('/guilds/:id/config', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        const { logsEnabled, logChannel } = req.body;

        if (typeof logsEnabled === 'boolean') {
            setLogsEnabled(guildId, logsEnabled);
        }
        if (typeof logChannel === 'string' && logChannel.trim()) {
            setLogChannel(guildId, logChannel.trim());
        }

        res.json({
            success: true,
            logsEnabled: isLogsEnabled(guildId),
            logChannel: getLogChannelName(guildId)
        });
    });

    // Appearance config
    router.get('/guilds/:id/appearance', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        const appearance = getAppearanceConfig(guildId);
        const welcome = getWelcomeConfig(guildId);
        const goodbye = getGoodbyeConfig(guildId);

        res.json({
            ...appearance,
            welcomeBackgroundUrl: welcome.backgroundUrl,
            goodbyeBackgroundUrl: goodbye.backgroundUrl
        });
    });

    router.post('/guilds/:id/appearance', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        const {
            botDisplayName,
            botDescription,
            accentColor,
            dashboardBackgroundUrl,
            profileBackgroundUrl,
            welcomeBackgroundUrl,
            goodbyeBackgroundUrl
        } = req.body;

        const updates = {};

        const normalizedBotDisplayName = normalizeOptionalText(botDisplayName);
        if (normalizedBotDisplayName !== undefined) {
            updates.botDisplayName = normalizedBotDisplayName;
        }

        const normalizedBotDescription = normalizeOptionalText(botDescription);
        if (normalizedBotDescription !== undefined) {
            updates.botDescription = normalizedBotDescription;
        }

        if (typeof accentColor === 'string') {
            const normalizedColor = accentColor.trim().toUpperCase();
            if (isValidHexColor(normalizedColor)) {
                updates.accentColor = normalizedColor;
            }
        }

        const normalizedDashboardBackgroundUrl = normalizeOptionalUrl(dashboardBackgroundUrl);
        if (normalizedDashboardBackgroundUrl !== undefined) {
            updates.dashboardBackgroundUrl = normalizedDashboardBackgroundUrl;
        }

        const normalizedProfileBackgroundUrl = normalizeOptionalUrl(profileBackgroundUrl);
        if (normalizedProfileBackgroundUrl !== undefined) {
            updates.profileBackgroundUrl = normalizedProfileBackgroundUrl;
        }

        const appearance = updateAppearanceConfig(guildId, updates);

        const normalizedWelcomeBackgroundUrl = normalizeOptionalUrl(welcomeBackgroundUrl);
        if (normalizedWelcomeBackgroundUrl !== undefined) {
            setWelcomeBackground(guildId, normalizedWelcomeBackgroundUrl);
        }

        const normalizedGoodbyeBackgroundUrl = normalizeOptionalUrl(goodbyeBackgroundUrl);
        if (normalizedGoodbyeBackgroundUrl !== undefined) {
            setGoodbyeBackground(guildId, normalizedGoodbyeBackgroundUrl);
        }

        res.json({
            success: true,
            ...appearance,
            welcomeBackgroundUrl: getWelcomeConfig(guildId).backgroundUrl,
            goodbyeBackgroundUrl: getGoodbyeConfig(guildId).backgroundUrl
        });
    });

    // Command permissions
    router.get('/guilds/:id/command-permissions', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        res.json(getAllCommandPermissions(guildId));
    });

    router.post('/guilds/:id/command-permissions/:commandName', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        const commandName = req.params.commandName;

        if (!client.slashCommands.has(commandName)) {
            return res.status(404).json({ error: 'Comando no encontrado' });
        }

        const updatedRule = updateCommandPermission(guildId, commandName, {
            enabled: typeof req.body.enabled === 'boolean' ? req.body.enabled : true,
            allowedRoleIds: req.body.allowedRoleIds,
            blockedRoleIds: req.body.blockedRoleIds,
            allowedChannelIds: req.body.allowedChannelIds,
            blockedChannelIds: req.body.blockedChannelIds
        });

        res.json({
            success: true,
            rule: updatedRule || createDefaultCommandPermissionRule(),
            hasCustomSettings: Boolean(updatedRule)
        });
    });

    router.delete('/guilds/:id/command-permissions/:commandName', requireAuth, requireGuildAdmin(client), (req, res) => {
        const guildId = req.params.id;
        const commandName = req.params.commandName;

        if (!client.slashCommands.has(commandName)) {
            return res.status(404).json({ error: 'Comando no encontrado' });
        }

        const removed = clearCommandPermission(guildId, commandName);

        res.json({
            success: true,
            removed,
            rule: createDefaultCommandPermissionRule(),
            hasCustomSettings: false
        });
    });

    // Guild users
    router.get('/guilds/:id/users', requireAuth, requireGuildAdmin(client), async (req, res) => {
        const guildId = req.params.id;
        try {
            const { getUsersByGuild } = await import('../../utils/users.js');
            const guildUsers = getUsersByGuild(guildId);
            
            // Format as array
            const result = Object.values(guildUsers).map(u => ({
                id: u.discordId,
                username: u.discordUsername,
                avatar: u.discordAvatar,
                registeredAt: u.registeredAt
            }));
            
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: 'Error leyendo usuarios' });
        }
    });

    // Delete user registration
    router.delete('/guilds/:id/users/:userId', requireAuth, requireGuildAdmin(client), async (req, res) => {
        const { userId } = req.params;
        try {
            const { unregisterUser } = await import('../../utils/users.js');
            const success = unregisterUser(userId);
            
            if (success) {
                res.json({ success: true, message: 'Usuario eliminado' });
            } else {
                res.status(404).json({ error: 'Usuario no encontrado' });
            }
        } catch (err) {
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    });

    return router;
}
