import { getCommandPermission } from './config.js';

function memberHasRole(member, roleId) {
    if (!member || !roleId) return false;

    if (member.roles?.cache?.has) {
        return member.roles.cache.has(roleId);
    }

    if (Array.isArray(member.roles)) {
        return member.roles.includes(roleId);
    }

    if (Array.isArray(member._roles)) {
        return member._roles.includes(roleId);
    }

    return false;
}

function memberHasAnyRole(member, roleIds = []) {
    return roleIds.some(roleId => memberHasRole(member, roleId));
}

export function checkCommandAccess(interaction, commandName) {
    if (!interaction.guildId || !commandName) {
        return { allowed: true };
    }

    const rule = getCommandPermission(interaction.guildId, commandName);
    if (!rule) {
        return { allowed: true };
    }

    if (rule.enabled === false) {
        return {
            allowed: false,
            reason: '⛔ Este comando está desactivado en este servidor.'
        };
    }

    if (rule.blockedChannelIds.includes(interaction.channelId)) {
        return {
            allowed: false,
            reason: '⛔ Este comando está bloqueado en este canal.'
        };
    }

    if (memberHasAnyRole(interaction.member, rule.blockedRoleIds)) {
        return {
            allowed: false,
            reason: '⛔ Uno de tus roles tiene bloqueado este comando.'
        };
    }

    if (rule.allowedChannelIds.length > 0 && !rule.allowedChannelIds.includes(interaction.channelId)) {
        return {
            allowed: false,
            reason: '⛔ Este comando solo puede usarse en canales permitidos.'
        };
    }

    if (rule.allowedRoleIds.length > 0 && !memberHasAnyRole(interaction.member, rule.allowedRoleIds)) {
        return {
            allowed: false,
            reason: '⛔ No tienes un rol autorizado para usar este comando.'
        };
    }

    return { allowed: true };
}
