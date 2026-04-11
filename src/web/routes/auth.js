import { Router } from 'express';
import { logInfo, logError } from '../../utils/logger.js';

export function createAuthRouter(client) {
    const router = Router();

    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const REDIRECT_URI = `${BASE_URL}/auth/callback`;

    function createAvatarUrl(user) {
        return user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0', 10) % 5}.png`;
    }

    function resolveStoredAvatar(user) {
        if (typeof user.avatar === 'string' && user.avatar.startsWith('http')) {
            return user.avatar;
        }

        return createAvatarUrl(user);
    }

    // Redirect to Discord OAuth2
    router.get('/login', (req, res) => {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            scope: 'identify guilds'
        });
        res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    });

    // OAuth2 callback
    router.get('/callback', async (req, res) => {
        const { code } = req.query;
        if (!code) return res.redirect('/?error=no_code');

        try {
            // Exchange code for token
            const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: REDIRECT_URI,
                    scope: 'identify guilds'
                })
            });

            if (!tokenRes.ok) {
                logError('OAuth2 token exchange failed');
                return res.redirect('/?error=token_failed');
            }

            const tokenData = await tokenRes.json();

            const authHeaders = {
                Authorization: `Bearer ${tokenData.access_token}`
            };

            // Load profile and guilds in parallel to reduce login latency
            const [userRes, guildsRes] = await Promise.all([
                fetch('https://discord.com/api/users/@me', { headers: authHeaders }),
                fetch('https://discord.com/api/users/@me/guilds', { headers: authHeaders })
            ]);

            if (!userRes.ok || !guildsRes.ok) {
                logError('OAuth2 user/guild fetch failed');
                return res.redirect('/?error=user_fetch_failed');
            }

            const [user, guilds] = await Promise.all([
                userRes.json(),
                guildsRes.json()
            ]);

            // Save to session
            req.session.user = {
                id: user.id,
                username: user.username,
                globalName: user.global_name,
                avatar: createAvatarUrl(user),
                discriminator: user.discriminator,
                guilds: Array.isArray(guilds)
                    ? guilds.map(guild => ({
                        id: guild.id,
                        name: guild.name,
                        icon: guild.icon,
                        permissions: guild.permissions
                    }))
                    : []
            };
            req.session.accessToken = tokenData.access_token;

            logInfo(`Usuario autenticado: ${user.username} (${user.id})`);

            req.session.save((sessionError) => {
                if (sessionError) {
                    logError(`Error guardando sesión OAuth2: ${sessionError.message}`);
                    return res.redirect('/?error=session_failed');
                }

                res.redirect('/dashboard');
            });
        } catch (err) {
            logError(`Error en OAuth2 callback: ${err.message}`);
            res.redirect('/?error=auth_failed');
        }
    });

    // Logout
    router.get('/logout', (req, res) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    });

    // Get current user
    router.get('/me', (req, res) => {
        if (!req.session.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        const user = req.session.user;
        res.json({
            id: user.id,
            username: user.username,
            globalName: user.globalName,
            avatar: resolveStoredAvatar(user)
        });
    });

    return router;
}
