import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createAuthRouter } from './routes/auth.js';
import { createApiRouter } from './routes/api.js';
import { createVerifyRouter } from './routes/verify.js';
import { logSuccess, logWarning } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
    const isProduction = process.env.NODE_ENV === 'production';
    const configuredSessionSecret = process.env.SESSION_SECRET?.trim();
    const hasStrongConfiguredSecret = Boolean(configuredSessionSecret && configuredSessionSecret.length >= 32);

    if (isProduction && !hasStrongConfiguredSecret) {
        throw new Error('SESSION_SECRET debe estar configurado y tener al menos 32 caracteres en producción.');
    }

    const sessionSecret = configuredSessionSecret || randomBytes(32).toString('hex');

    if (!configuredSessionSecret) {
        logWarning('SESSION_SECRET no está configurado; usando un secreto temporal solo apto para desarrollo local.');
    } else if (!hasStrongConfiguredSecret) {
        logWarning('SESSION_SECRET es corto; para producción usa al menos 32 caracteres.');
    }

    if (isProduction) {
        app.set('trust proxy', 1);
    }

    // Middleware
    app.use(express.json());
    app.use(cookieParser());
    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        proxy: isProduction,
        cookie: {
            secure: isProduction,
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    }));

    // Static files
    app.use(express.static(join(__dirname, 'public')));

    // Routes
    app.use('/auth', createAuthRouter(client));
    app.use('/api', createApiRouter(client));
    app.use('/verify', createVerifyRouter(client));

    // SPA fallback — serve index.html for unmatched routes
    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'public', 'index.html'));
    });

    app.get('/dashboard', (req, res) => {
        res.sendFile(join(__dirname, 'public', 'dashboard.html'));
    });

    app.listen(PORT, () => {
        logSuccess(`🌐 Servidor web corriendo en http://localhost:${PORT}`);
    });

    return app;
}
