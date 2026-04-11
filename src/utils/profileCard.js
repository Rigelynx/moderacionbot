import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

export async function generateProfileCard(targetUser, profileData, guild, appearance = {}) {
    const width = 920;
    const height = 360;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const accentColor = normalizeHexColor(appearance.accentColor || '#5865F2');

    await drawProfileBackground(ctx, width, height, appearance.profileBackgroundUrl, accentColor);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    roundRect(ctx, 26, 26, width - 52, height - 52, 24);
    ctx.fill();

    ctx.strokeStyle = hexToRgba(accentColor, 0.85);
    ctx.lineWidth = 2;
    roundRect(ctx, 26, 26, width - 52, height - 52, 24);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, 38, 38, width - 76, height - 76, 18);
    ctx.stroke();

    const avatarSize = 148;
    const avatarX = 58;
    const avatarY = 78;
    await drawAvatar(ctx, targetUser, avatarX, avatarY, avatarSize, accentColor);

    const displayName = targetUser.globalName || targetUser.username;
    const botDisplayName = appearance.botDisplayName || 'ModBot';

    ctx.textAlign = 'left';

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '700 14px sans-serif';
    ctx.fillText(`PERFIL VISUAL · ${botDisplayName.toUpperCase()}`, 240, 82);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px sans-serif';
    ctx.fillText(displayName, 240, 126);

    ctx.fillStyle = hexToRgba(accentColor, 0.95);
    ctx.font = '600 18px sans-serif';
    ctx.fillText(`@${targetUser.username}`, 240, 154);

    const description = appearance.botDescription || 'Perfil generado desde el panel del bot.';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.74)';
    ctx.font = '16px sans-serif';
    wrapText(ctx, description, 240, 186, 610, 24, 2);

    const infoCards = [
        {
            label: 'Usuario',
            value: profileData.discordUsername || targetUser.username
        },
        {
            label: 'ID',
            value: profileData.discordId || targetUser.id
        },
        {
            label: 'Servidor',
            value: profileData.guildName || guild?.name || 'Desconocido'
        },
        {
            label: 'Registrado',
            value: formatDate(profileData.registeredAt)
        }
    ];

    const cardWidth = 192;
    const cardHeight = 78;
    const gap = 16;
    const startX = 240;
    const startY = 238;

    infoCards.forEach((card, index) => {
        const x = startX + index * (cardWidth + gap);
        drawInfoCard(ctx, x, startY, cardWidth, cardHeight, card.label, card.value, accentColor);
    });

    const buffer = await canvas.encode('png');
    return new AttachmentBuilder(buffer, { name: 'perfil.png' });
}

async function drawProfileBackground(ctx, width, height, backgroundUrl, accentColor) {
    if (backgroundUrl) {
        try {
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, width, height);
            ctx.fillStyle = 'rgba(3, 4, 12, 0.66)';
            ctx.fillRect(0, 0, width, height);
        } catch {
            drawDefaultProfileBackground(ctx, width, height, accentColor);
        }
    } else {
        drawDefaultProfileBackground(ctx, width, height, accentColor);
    }

    const glow = ctx.createRadialGradient(width - 120, 80, 0, width - 120, 80, 240);
    glow.addColorStop(0, hexToRgba(accentColor, 0.30));
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
}

function drawDefaultProfileBackground(ctx, width, height, accentColor) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#06060f');
    gradient.addColorStop(0.45, '#12142b');
    gradient.addColorStop(1, '#090916');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    for (let y = 0; y < height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    const radial = ctx.createRadialGradient(180, 90, 0, 180, 90, 240);
    radial.addColorStop(0, hexToRgba(accentColor, 0.18));
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
}

async function drawAvatar(ctx, user, x, y, size, accentColor) {
    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarUrl);

        ctx.shadowBlur = 28;
        ctx.shadowColor = hexToRgba(accentColor, 0.50);

        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 + 6, 0, Math.PI * 2);
        const ringGradient = ctx.createLinearGradient(x, y, x + size, y + size);
        ringGradient.addColorStop(0, accentColor);
        ringGradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = ringGradient;
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
    } catch {
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '700 54px sans-serif';
        ctx.fillText(user.username.charAt(0).toUpperCase(), x + size / 2, y + size / 2 + 18);
    }
}

function drawInfoCard(ctx, x, y, width, height, label, value, accentColor) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    roundRect(ctx, x, y, width, height, 16);
    ctx.fill();

    ctx.strokeStyle = hexToRgba(accentColor, 0.22);
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, width, height, 16);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.font = '700 12px sans-serif';
    ctx.fillText(label.toUpperCase(), x + 16, y + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px sans-serif';
    const safeValue = truncateText(value, 24);
    ctx.fillText(safeValue, x + 16, y + 52);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
            if (lines.length === maxLines - 1) {
                break;
            }
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
    }

    lines.forEach((line, index) => {
        const finalLine = index === maxLines - 1 ? truncateText(line, 92) : line;
        ctx.fillText(finalLine, x, y + index * lineHeight);
    });
}

function normalizeHexColor(hex) {
    const normalized = String(hex || '').trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '#5865F2';
}

function hexToRgba(hex, alpha) {
    const color = normalizeHexColor(hex).replace('#', '');
    const value = Number.parseInt(color, 16);
    const red = value >> 16;
    const green = (value >> 8) & 0x00ff;
    const blue = value & 0x0000ff;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function truncateText(text, maxLength) {
    const value = String(text || '');
    return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatDate(value) {
    if (!value) return 'No disponible';

    try {
        return new Date(value).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'No disponible';
    }
}
