import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

/**
 * Generate a premium welcome/goodbye card image
 * @param {GuildMember} member - The guild member
 * @param {'welcome'|'goodbye'} type - Card type
 * @param {Object} config - Welcome/goodbye config
 * @returns {Promise<AttachmentBuilder>}
 */
export async function generateCard(member, type, config = {}) {
    const canvas = createCanvas(900, 320);
    const ctx = canvas.getContext('2d');

    // ── Background ──
    if (config.backgroundUrl) {
        try {
            const bg = await loadImage(config.backgroundUrl);
            ctx.drawImage(bg, 0, 0, 900, 320);
            // Dark overlay for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(0, 0, 900, 320);
        } catch {
            drawDefaultBackground(ctx, type);
        }
    } else {
        drawDefaultBackground(ctx, type);
    }

    // ── Decorative border ──
    const borderGrad = ctx.createLinearGradient(0, 0, 900, 320);
    if (type === 'welcome') {
        borderGrad.addColorStop(0, 'rgba(88, 101, 242, 0.8)');
        borderGrad.addColorStop(0.5, 'rgba(114, 137, 218, 0.8)');
        borderGrad.addColorStop(1, 'rgba(88, 101, 242, 0.8)');
    } else {
        borderGrad.addColorStop(0, 'rgba(240, 71, 71, 0.8)');
        borderGrad.addColorStop(0.5, 'rgba(255, 120, 120, 0.8)');
        borderGrad.addColorStop(1, 'rgba(240, 71, 71, 0.8)');
    }
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    roundRect(ctx, 2, 2, 896, 316, 20);
    ctx.stroke();

    // ── Inner glow line ──
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    roundRect(ctx, 8, 8, 884, 304, 16);
    ctx.stroke();

    // ── Decorative circles (background elements) ──
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(780, 60, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(100, 280, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Avatar ──
    const avatarSize = 128;
    const avatarX = 900 / 2 - avatarSize / 2;
    const avatarY = 30;

    try {
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarUrl);

        // Avatar glow
        const glowColor = type === 'welcome'
            ? 'rgba(88, 101, 242, 0.5)'
            : 'rgba(240, 71, 71, 0.5)';

        ctx.shadowBlur = 25;
        ctx.shadowColor = glowColor;

        // Avatar border ring
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
        const ringGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
        if (type === 'welcome') {
            ringGrad.addColorStop(0, '#5865F2');
            ringGrad.addColorStop(1, '#7289DA');
        } else {
            ringGrad.addColorStop(0, '#f04747');
            ringGrad.addColorStop(1, '#ff7878');
        }
        ctx.fillStyle = ringGrad;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Clip to circle and draw avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch {
        // Draw placeholder if avatar fails
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#5865F2';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(member.user.username.charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 16);
    }

    // ── Title text ──
    const titleY = avatarY + avatarSize + 40;
    const titleText = type === 'welcome' ? '¡BIENVENIDO/A!' : 'HASTA PRONTO';

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px sans-serif';

    // Title gradient effect (simulated with shadow)
    ctx.shadowBlur = 10;
    ctx.shadowColor = type === 'welcome'
        ? 'rgba(88, 101, 242, 0.6)'
        : 'rgba(240, 71, 71, 0.6)';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(titleText, 450, titleY);
    ctx.shadowBlur = 0;

    // ── Username ──
    const username = member.user.globalName || member.user.username;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = type === 'welcome' ? '#a8b3f5' : '#f5a8a8';
    ctx.fillText(username, 450, titleY + 35);

    // ── Custom message ──
    const defaultMsg = type === 'welcome'
        ? `¡Bienvenido/a a ${member.guild.name}!`
        : `${username} ha abandonado el servidor`;

    let message = config.message || defaultMsg;
    message = message
        .replace(/{user}/gi, username)
        .replace(/{server}/gi, member.guild.name)
        .replace(/{count}/gi, member.guild.memberCount.toString());

    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(truncateText(message, 70), 450, titleY + 65);

    // ── Member count ──
    const countText = `Miembro #${member.guild.memberCount}`;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText(countText, 450, titleY + 90);

    // ── Encode and return ──
    const buffer = await canvas.encode('png');
    const filename = type === 'welcome' ? 'bienvenida.png' : 'despedida.png';
    return new AttachmentBuilder(buffer, { name: filename });
}

function drawDefaultBackground(ctx, type) {
    // Premium dark gradient
    const grad = ctx.createLinearGradient(0, 0, 900, 320);
    if (type === 'welcome') {
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(0.3, '#0d1232');
        grad.addColorStop(0.7, '#151547');
        grad.addColorStop(1, '#0a0a1a');
    } else {
        grad.addColorStop(0, '#1a0a0a');
        grad.addColorStop(0.3, '#2d0d0d');
        grad.addColorStop(0.7, '#3d1515');
        grad.addColorStop(1, '#1a0a0a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 320);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 900; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 320);
        ctx.stroke();
    }
    for (let y = 0; y < 320; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(900, y);
        ctx.stroke();
    }

    // Accent light spots
    const spotColor = type === 'welcome'
        ? 'rgba(88, 101, 242, 0.08)'
        : 'rgba(240, 71, 71, 0.08)';

    const spotGrad1 = ctx.createRadialGradient(200, 160, 0, 200, 160, 200);
    spotGrad1.addColorStop(0, spotColor);
    spotGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad1;
    ctx.fillRect(0, 0, 900, 320);

    const spotGrad2 = ctx.createRadialGradient(700, 160, 0, 700, 160, 200);
    spotGrad2.addColorStop(0, spotColor);
    spotGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad2;
    ctx.fillRect(0, 0, 900, 320);
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

function truncateText(text, maxLen) {
    return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
}
