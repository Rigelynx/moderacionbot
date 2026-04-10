import { Router } from 'express';
import { logInfo, logError } from '../../utils/logger.js';

export function createAuthRouter(client) {
    const router = Router();

    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const REDIRECT_URI = `${BASE_URL}/auth/callback`;

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

            // Get user info
            const userRes = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });
            const user = await userRes.json();

            // Get user guilds
            const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });
            const guilds = await guildsRes.json();

            // Save to session
            req.session.user = {
                id: user.id,
                username: user.username,
                globalName: user.global_name,
                avatar: user.avatar,
                discriminator: user.discriminator,
                guilds: guilds
            };
            req.session.accessToken = tokenData.access_token;

            logInfo(`Usuario autenticado: ${user.username} (${user.id})`);
            res.redirect('/dashboard');
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
            avatar: user.avatar
                ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`
        });
    });

    return router;
}
