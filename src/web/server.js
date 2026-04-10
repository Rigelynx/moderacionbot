import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createAuthRouter } from './routes/auth.js';
import { createApiRouter } from './routes/api.js';
import { logInfo, logSuccess } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function startWebServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Middleware
    app.use(express.json());
    app.use(cookieParser());
    app.use(session({
        secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true behind HTTPS proxy
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    }));

    // Static files
    app.use(express.static(join(__dirname, 'public')));

    // Routes
    app.use('/auth', createAuthRouter(client));
    app.use('/api', createApiRouter(client));

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
