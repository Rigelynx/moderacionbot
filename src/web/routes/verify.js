import { Router } from 'express';
import { PermissionFlagsBits } from 'discord.js';
import { getVerificationConfig } from '../../utils/config.js';
import { consumeVerificationToken, deleteVerificationToken, getVerificationToken } from '../../utils/verificationStore.js';
import { sendVerificationSuccessLog } from '../../utils/verification.js';

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function createHumanChallenge() {
    const left = Math.floor(Math.random() * 8) + 4;
    const right = Math.floor(Math.random() * 7) + 2;
    const multiplier = Math.floor(Math.random() * 4) + 2;
    const operators = [
        { symbol: '+', result: left + right },
        { symbol: '-', result: left - right },
        { symbol: '×', result: left * multiplier }
    ];
    const math = pickRandom(operators);
    const verificationCode = Math.random().toString(36).slice(2, 7).toUpperCase();

    return {
        prompt: math.symbol === '×'
            ? `${left} ${math.symbol} ${multiplier}`
            : `${left} ${math.symbol} ${right}`,
        answer: String(math.result),
        verificationCode
    };
}

function getChallengeBucket(session) {
    if (!session) {
        return {};
    }

    if (!session.verifyChallenges || typeof session.verifyChallenges !== 'object') {
        session.verifyChallenges = {};
    }

    return session.verifyChallenges;
}

function renderVerificationPage({
    guildName,
    roleName,
    panelDescription,
    challengePrompt,
    verificationCode,
    expiresAt,
    minAccountAgeDays,
    errorMessage = ''
}) {
    const safeGuildName = escapeHtml(guildName);
    const safeRoleName = escapeHtml(roleName);
    const safePanelDescription = escapeHtml(panelDescription);
    const safeChallengePrompt = escapeHtml(challengePrompt);
    const safeVerificationCode = escapeHtml(verificationCode);
    const safeErrorMessage = escapeHtml(errorMessage);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación | ${safeGuildName}</title>
    <meta name="description" content="Portal de verificación de ${safeGuildName}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #07111a;
            --panel: rgba(14, 27, 39, 0.86);
            --panel-border: rgba(148, 193, 255, 0.14);
            --text: #f4fbff;
            --muted: #99b8cb;
            --accent: #4ade80;
            --accent-strong: #22c55e;
            --danger: #fb7185;
            --shadow: 0 32px 90px rgba(0, 0, 0, 0.42);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            color: var(--text);
            background:
                radial-gradient(circle at top left, rgba(34, 197, 94, 0.22), transparent 28%),
                radial-gradient(circle at right, rgba(56, 189, 248, 0.18), transparent 24%),
                linear-gradient(160deg, #03070b 0%, var(--bg) 58%, #081923 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .shell {
            width: min(100%, 1040px);
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 24px;
        }

        .hero, .panel {
            border: 1px solid var(--panel-border);
            background: var(--panel);
            backdrop-filter: blur(18px);
            border-radius: 28px;
            box-shadow: var(--shadow);
        }

        .hero {
            padding: 36px;
            position: relative;
            overflow: hidden;
        }

        .hero::after {
            content: '';
            position: absolute;
            inset: auto -40px -60px auto;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(74, 222, 128, 0.24), transparent 70%);
            pointer-events: none;
        }

        .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.06);
            color: var(--muted);
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        h1 {
            font-size: clamp(34px, 4vw, 52px);
            line-height: 0.96;
            margin: 18px 0 16px;
            letter-spacing: -0.045em;
        }

        .hero p {
            color: var(--muted);
            font-size: 16px;
            line-height: 1.7;
            max-width: 52ch;
            margin: 0 0 24px;
        }

        .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 28px;
        }

        .meta-card {
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .meta-label {
            display: block;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 6px;
        }

        .meta-value {
            font-size: 15px;
            font-weight: 700;
        }

        .panel {
            padding: 28px;
        }

        .panel h2 {
            margin: 0 0 10px;
            font-size: 24px;
            letter-spacing: -0.03em;
        }

        .panel-copy {
            color: var(--muted);
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .error {
            display: ${safeErrorMessage ? 'block' : 'none'};
            margin-bottom: 16px;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid rgba(251, 113, 133, 0.28);
            background: rgba(251, 113, 133, 0.1);
            color: #ffd8de;
            font-size: 14px;
        }

        .challenge-box {
            padding: 18px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 20px;
        }

        .challenge-box label {
            display: block;
            color: var(--muted);
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
        }

        .challenge-prompt {
            font-size: 30px;
            font-weight: 800;
            letter-spacing: -0.04em;
        }

        input {
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(2, 6, 9, 0.35);
            color: var(--text);
            border-radius: 16px;
            padding: 16px 18px;
            font-size: 16px;
            outline: none;
            transition: border-color 160ms ease, transform 160ms ease;
        }

        input:focus {
            border-color: rgba(74, 222, 128, 0.55);
            transform: translateY(-1px);
        }

        button {
            width: 100%;
            margin-top: 14px;
            padding: 16px 20px;
            border: 0;
            border-radius: 16px;
            background: linear-gradient(135deg, var(--accent), var(--accent-strong));
            color: #05210f;
            font-size: 16px;
            font-weight: 800;
            cursor: pointer;
            transition: transform 160ms ease, box-shadow 160ms ease;
            box-shadow: 0 18px 34px rgba(34, 197, 94, 0.26);
        }

        button:hover { transform: translateY(-1px); }
        button:disabled { cursor: wait; opacity: 0.8; }

        .status {
            min-height: 24px;
            margin-top: 16px;
            color: var(--muted);
            font-size: 14px;
        }

        .status.success { color: #c8ffe0; }
        .status.error { color: #ffd8de; }

        @media (max-width: 900px) {
            .shell {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="shell">
        <section class="hero">
            <span class="eyebrow">Verificación web</span>
            <h1>${safeGuildName}</h1>
            <p>${safePanelDescription}</p>
            <div class="meta">
                <div class="meta-card">
                    <span class="meta-label">Rol al aprobar</span>
                    <span class="meta-value">${safeRoleName}</span>
                </div>
                <div class="meta-card">
                    <span class="meta-label">Expira</span>
                    <span class="meta-value"><span data-expiry="${expiresAt}">Cargando...</span></span>
                </div>
                <div class="meta-card">
                    <span class="meta-label">Antigüedad mínima</span>
                    <span class="meta-value">${minAccountAgeDays} día(s)</span>
                </div>
                <div class="meta-card">
                    <span class="meta-label">Resultado</span>
                    <span class="meta-value">Rol automático al aprobar</span>
                </div>
            </div>
        </section>

        <section class="panel">
            <h2>Completa la verificación</h2>
            <p class="panel-copy">Este enlace es personal, temporal y solo sirve para tu cuenta en Discord. Completa las dos comprobaciones y el bot intentará darte acceso completo al servidor.</p>
            <div class="error" id="errorBox">${safeErrorMessage}</div>
            <form id="verifyForm">
                <div class="challenge-box">
                    <label>Reto humano</label>
                    <div class="challenge-prompt">${safeChallengePrompt}</div>
                </div>
                <div class="challenge-box">
                    <label>Código visible</label>
                    <div class="challenge-prompt">${safeVerificationCode}</div>
                </div>
                <input id="answerInput" name="answer" type="text" inputmode="numeric" autocomplete="off" placeholder="Escribe el resultado matemático" required>
                <input id="codeInput" name="code" type="text" autocomplete="off" placeholder="Escribe el código exactamente igual" maxlength="5" required>
                <input id="websiteInput" name="website" type="text" autocomplete="off" tabindex="-1" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true">
                <button id="submitBtn" type="submit">Verificar ahora</button>
            </form>
            <div class="status" id="statusBox"></div>
        </section>
    </div>
    <script>
        const expiryEl = document.querySelector('[data-expiry]');
        const statusBox = document.getElementById('statusBox');
        const errorBox = document.getElementById('errorBox');
        const form = document.getElementById('verifyForm');
        const button = document.getElementById('submitBtn');
        const answerInput = document.getElementById('answerInput');
        const codeInput = document.getElementById('codeInput');
        const websiteInput = document.getElementById('websiteInput');

        function updateExpiry() {
            if (!expiryEl) return;
            const expiresAt = Number(expiryEl.dataset.expiry);
            const diff = expiresAt - Date.now();
            if (diff <= 0) {
                expiryEl.textContent = 'Expirado';
                button.disabled = true;
                statusBox.textContent = 'Este enlace ya expiró. Vuelve a Discord y pulsa el botón otra vez.';
                statusBox.className = 'status error';
                return;
            }

            const minutes = Math.max(1, Math.ceil(diff / 60000));
            expiryEl.textContent = 'En ' + minutes + ' min';
        }

        updateExpiry();
        setInterval(updateExpiry, 30000);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            statusBox.textContent = 'Validando...';
            statusBox.className = 'status';
            errorBox.style.display = 'none';
            button.disabled = true;

            try {
                const response = await fetch(window.location.pathname, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        answer: answerInput.value.trim(),
                        code: codeInput.value.trim(),
                        website: websiteInput.value.trim()
                    })
                });

                const payload = await response.json();
                if (!response.ok || !payload.success) {
                    throw new Error(payload.error || 'No se pudo completar la verificación.');
                }

                statusBox.textContent = payload.message || 'Verificación completada.';
                statusBox.className = 'status success';
                button.disabled = true;
                answerInput.disabled = true;
                codeInput.disabled = true;
            } catch (error) {
                statusBox.textContent = error.message || 'Error inesperado.';
                statusBox.className = 'status error';
                button.disabled = false;
                errorBox.textContent = error.message || 'Error inesperado.';
                errorBox.style.display = 'block';
            }
        });
    </script>
</body>
</html>`;
}

export function createVerifyRouter(client) {
    const router = Router();

    router.get('/:guildId/:token', async (req, res) => {
        const { guildId, token } = req.params;
        const tokenEntry = getVerificationToken(token);

        if (!tokenEntry || tokenEntry.guildId !== guildId) {
            return res.status(404).send('Enlace de verificación inválido o expirado.');
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            deleteVerificationToken(token);
            return res.status(404).send('El servidor ya no está disponible.');
        }

        const config = getVerificationConfig(guildId);
        if (!config.enabled || !config.roleId) {
            deleteVerificationToken(token);
            return res.status(410).send('La verificación está desactivada o incompleta.');
        }

        const member = await guild.members.fetch(tokenEntry.userId).catch(() => null);
        if (!member) {
            deleteVerificationToken(token);
            return res.status(404).send('No encontré al usuario dentro del servidor.');
        }

        const role = guild.roles.cache.get(config.roleId);
        if (!role) {
            deleteVerificationToken(token);
            return res.status(410).send('El rol de verificación ya no existe.');
        }

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
            deleteVerificationToken(token);
            return res.status(503).send('El bot no tiene permisos para gestionar roles en este servidor.');
        }

        if (member.roles.cache.has(role.id)) {
            deleteVerificationToken(token);
            return res.send(renderVerificationPage({
                guildName: guild.name,
                roleName: role.name,
                panelDescription: 'Tu cuenta ya estaba verificada. No necesitas completar más pasos.',
                challengePrompt: '0 + 0',
                verificationCode: 'READY',
                expiresAt: Date.now(),
                minAccountAgeDays: config.minAccountAgeDays,
                errorMessage: 'Ya tienes acceso completo. Puedes volver a Discord.'
            }));
        }

        const challenge = createHumanChallenge();
        const bucket = getChallengeBucket(req.session);
        bucket[token] = {
            guildId,
            answer: challenge.answer,
            verificationCode: challenge.verificationCode,
            createdAt: Date.now()
        };

        return res.send(renderVerificationPage({
            guildName: guild.name,
            roleName: role.name,
            panelDescription: config.panelDescription,
            challengePrompt: challenge.prompt,
            verificationCode: challenge.verificationCode,
            expiresAt: tokenEntry.expiresAt,
            minAccountAgeDays: config.minAccountAgeDays
        }));
    });

    router.post('/:guildId/:token', async (req, res) => {
        const { guildId, token } = req.params;
        const tokenEntry = getVerificationToken(token);

        if (!tokenEntry || tokenEntry.guildId !== guildId) {
            return res.status(404).json({ success: false, error: 'El enlace ya no es válido o expiró.' });
        }

        const challenge = getChallengeBucket(req.session)[token];
        if (!challenge || challenge.guildId !== guildId) {
            return res.status(400).json({ success: false, error: 'La comprobación humana ya no es válida. Recarga la página.' });
        }

        challenge.attempts = (challenge.attempts || 0) + 1;

        if (challenge.attempts > 5) {
            delete getChallengeBucket(req.session)[token];
            return res.status(429).json({
                success: false,
                error: 'Demasiados intentos fallidos. Recarga la página para generar un nuevo reto.'
            });
        }

        const submittedAnswer = String(req.body?.answer || '').trim();
        const submittedCode = String(req.body?.code || '').trim().toUpperCase();
        const honeypotValue = String(req.body?.website || '').trim();

        if (honeypotValue) {
            return res.status(400).json({ success: false, error: 'La comprobación humana falló.' });
        }

        if ((Date.now() - challenge.createdAt) < 3500) {
            return res.status(400).json({
                success: false,
                error: 'La verificación fue demasiado rápida. Espera unos segundos y vuelve a intentarlo.'
            });
        }

        if (!submittedAnswer || submittedAnswer !== challenge.answer) {
            return res.status(400).json({ success: false, error: 'La respuesta del reto no es correcta.' });
        }

        if (!submittedCode || submittedCode !== challenge.verificationCode) {
            return res.status(400).json({ success: false, error: 'El código de verificación no coincide.' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            deleteVerificationToken(token);
            delete getChallengeBucket(req.session)[token];
            return res.status(404).json({ success: false, error: 'El servidor ya no está disponible.' });
        }

        const config = getVerificationConfig(guildId);
        const role = guild.roles.cache.get(config.roleId);
        if (!config.enabled || !role) {
            deleteVerificationToken(token);
            delete getChallengeBucket(req.session)[token];
            return res.status(410).json({ success: false, error: 'La verificación ya no está disponible en este momento.' });
        }

        if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return res.status(503).json({
                success: false,
                error: 'El bot no tiene permisos para gestionar roles en este servidor.'
            });
        }

        if (guild.members.me.roles.highest.comparePositionTo(role) <= 0) {
            return res.status(503).json({
                success: false,
                error: 'No puedo asignar el rol configurado porque está por encima de mi rol más alto.'
            });
        }

        const member = await guild.members.fetch(tokenEntry.userId).catch(() => null);
        if (!member) {
            deleteVerificationToken(token);
            delete getChallengeBucket(req.session)[token];
            return res.status(404).json({ success: false, error: 'No pude encontrar tu usuario dentro del servidor.' });
        }

        const minAgeMs = (config.minAccountAgeDays || 0) * 24 * 60 * 60 * 1000;
        if (minAgeMs > 0 && (Date.now() - member.user.createdTimestamp) < minAgeMs) {
            return res.status(403).json({
                success: false,
                error: `Tu cuenta debe tener una antigüedad mínima de ${config.minAccountAgeDays} día(s) para completar esta verificación.`
            });
        }

        if (member.roles.cache.has(role.id)) {
            consumeVerificationToken(token);
            delete getChallengeBucket(req.session)[token];
            return res.json({ success: true, message: `Ya estabas verificado. El rol ${role.name} ya está en tu cuenta.` });
        }

        try {
            await member.roles.add(role.id, 'Usuario verificado mediante portal web');
        } catch {
            return res.status(500).json({
                success: false,
                error: 'No pude asignarte el rol. Revisa la jerarquía de roles del bot e inténtalo otra vez.'
            });
        }

        consumeVerificationToken(token);
        delete getChallengeBucket(req.session)[token];
        await sendVerificationSuccessLog(guild, client, {
            user: member.user,
            roleId: role.id
        });

        return res.json({
            success: true,
            message: `Verificación completada. Ya recibiste el rol ${role.name}.`
        });
    });

    return router;
}
