let currentUser = null;
let currentBotProfile = null;
let currentGuildId = null;
let currentGuildData = null;
let currentGuildCommands = [];
let currentCommandPermissions = {};
let currentAppearance = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

async function checkAuth() {
    try {
        const res = await fetch('/auth/me');
        if (!res.ok) {
            showLogin();
            return;
        }

        currentUser = await res.json();
        showDashboard();
    } catch {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

function showDashboard() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';

    document.getElementById('userName').textContent = currentUser.globalName || currentUser.username;
    document.getElementById('userAvatar').src = currentUser.avatar;

    bindStaticEventHandlers();
    loadBotProfile();
    loadGuilds();
    initNavigation();
    initSidebar();
}

function bindStaticEventHandlers() {
    document.getElementById('saveConfigBtn').onclick = saveConfig;
    document.getElementById('saveAppearanceBtn').onclick = saveAppearance;
    document.getElementById('savePermissionBtn').onclick = saveCommandPermission;
    document.getElementById('resetPermissionBtn').onclick = resetCommandPermission;
    document.getElementById('permCommandSelect').onchange = renderSelectedCommandPermission;

    const accentInput = document.getElementById('appearanceAccentColor');
    const accentPicker = document.getElementById('appearanceAccentColorPicker');
    const previewInputs = [
        'appearanceBotName',
        'appearanceBotDescription',
        'appearanceDashboardBackground',
        'appearanceProfileBackground',
        'appearanceWelcomeBackground',
        'appearanceGoodbyeBackground'
    ];

    accentInput.addEventListener('input', () => {
        const normalized = normalizeHexColor(accentInput.value, null);
        if (normalized) {
            accentPicker.value = normalized;
        }
        updateAppearancePreviewFromInputs();
    });

    accentPicker.addEventListener('input', () => {
        accentInput.value = accentPicker.value.toUpperCase();
        updateAppearancePreviewFromInputs();
    });

    previewInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateAppearancePreviewFromInputs);
    });
}

async function loadBotProfile() {
    try {
        const res = await fetch('/api/bot');
        if (!res.ok) return;

        currentBotProfile = await res.json();
        updateAppearancePreviewFromInputs();
    } catch {
        // Ignorar si falla el perfil del bot
    }
}

async function loadGuilds() {
    const serverList = document.getElementById('serverList');

    try {
        const res = await fetch('/api/guilds');
        if (!res.ok) throw new Error('Failed to load guilds');
        const guilds = await res.json();

        if (guilds.length === 0) {
            serverList.innerHTML = '<div class="server-loading">No hay servidores mutuos con permisos de admin</div>';
            return;
        }

        serverList.innerHTML = guilds.map(guild => `
            <button class="server-item" data-guild-id="${guild.id}">
                <div class="server-icon">
                    ${guild.icon
                        ? `<img src="${guild.icon}" alt="${escapeHtml(guild.name)}">`
                        : escapeHtml(guild.name.charAt(0).toUpperCase())}
                </div>
                <span>${escapeHtml(guild.name)}</span>
            </button>
        `).join('');

        serverList.querySelectorAll('.server-item').forEach(item => {
            item.addEventListener('click', () => selectGuild(item.dataset.guildId));
        });
    } catch {
        serverList.innerHTML = '<div class="server-loading">Error cargando servidores</div>';
    }
}

async function selectGuild(guildId) {
    currentGuildId = guildId;
    currentGuildCommands = [];
    currentCommandPermissions = {};

    document.querySelectorAll('.server-item').forEach(serverItem => serverItem.classList.remove('active'));
    document.querySelector(`.server-item[data-guild-id="${guildId}"]`)?.classList.add('active');

    document.getElementById('navSection').style.display = 'block';

    try {
        const res = await fetch(`/api/guilds/${guildId}`);
        if (!res.ok) throw new Error('Failed to load guild');

        currentGuildData = await res.json();
        await loadAppearance(true);
        switchView('overview');
        loadOverview();
    } catch (err) {
        console.error('Error loading guild:', err);
    }
}

function initNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);

            if (view === 'overview') loadOverview();
            if (view === 'warnings') loadWarnings();
            if (view === 'users') loadUsers();
            if (view === 'config') loadConfig();
            if (view === 'permissions') loadPermissions();
            if (view === 'appearance') loadAppearance();
        });
    });
}

function switchView(viewName) {
    document.querySelectorAll('.nav-item[data-view]').forEach(nav => nav.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

    document.getElementById('emptyState').style.display = 'none';
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.style.display = 'block';
    }
}

function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    toggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.getElementById('mainContent')?.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}

async function loadOverview() {
    if (!currentGuildData) return;

    const guild = currentGuildData;
    document.getElementById('guildIcon').src = guild.icon || '';
    document.getElementById('guildIcon').style.display = guild.icon ? 'block' : 'none';
    document.getElementById('guildName').textContent = guild.name;
    document.getElementById('guildSubtitle').textContent = `${guild.memberCount} miembros · ${guild.channels.length} canales`;

    document.getElementById('overviewMembers').textContent = guild.memberCount.toLocaleString();
    document.getElementById('overviewChannels').textContent = guild.channels.length;
    document.getElementById('overviewRoles').textContent = guild.roles.length;

    try {
        const warningsRes = await fetch(`/api/guilds/${currentGuildId}/warnings`);
        const warnings = await warningsRes.json();
        document.getElementById('overviewWarnings').textContent = Array.isArray(warnings) ? warnings.length : 0;
    } catch {
        document.getElementById('overviewWarnings').textContent = '—';
    }

    try {
        const configRes = await fetch(`/api/guilds/${currentGuildId}/config`);
        const config = await configRes.json();

        document.getElementById('quickLogStatus').textContent = config.logsEnabled ? 'Activados' : 'Desactivados';
        document.getElementById('quickLogChannel').textContent = formatChannelName(config.logChannel);

        const checkbox = document.getElementById('quickLogsCheckbox');
        checkbox.checked = config.logsEnabled;
        checkbox.onchange = async () => {
            try {
                await fetch(`/api/guilds/${currentGuildId}/config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ logsEnabled: checkbox.checked })
                });

                document.getElementById('quickLogStatus').textContent = checkbox.checked ? 'Activados' : 'Desactivados';
            } catch {
                checkbox.checked = !checkbox.checked;
            }
        };
    } catch {
        // Ignorar errores del resumen rápido
    }
}

async function loadWarnings() {
    if (!currentGuildId) return;

    const tbody = document.getElementById('warningsBody');
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Cargando...</td></tr>';

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/warnings`);
        const warnings = await res.json();

        if (!Array.isArray(warnings) || warnings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No hay advertencias 🎉</td></tr>';
            return;
        }

        tbody.innerHTML = warnings.map(warning => `
            <tr>
                <td>
                    <div class="table-user">
                        ${warning.avatar ? `<img src="${warning.avatar}" class="table-avatar" alt="">` : ''}
                        <span class="table-username">${escapeHtml(warning.username)}</span>
                    </div>
                </td>
                <td>${escapeHtml(warning.reason)}</td>
                <td>${escapeHtml(warning.moderator)}</td>
                <td>${formatDate(warning.date)}</td>
                <td>
                    <button class="btn-icon" onclick="confirmDeleteWarning('${warning.userId}', ${warning.index})" title="Eliminar">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Error cargando advertencias</td></tr>';
    }
}

function confirmDeleteWarning(userId, index) {
    const modal = document.getElementById('confirmModal');
    const confirm = document.getElementById('modalConfirm');
    const cancel = document.getElementById('modalCancel');

    modal.style.display = 'flex';

    const onConfirm = async () => {
        modal.style.display = 'none';
        cleanup();

        try {
            const res = await fetch(`/api/guilds/${currentGuildId}/warnings/${userId}/${index}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                loadWarnings();
                const warningsRes = await fetch(`/api/guilds/${currentGuildId}/warnings`);
                const warnings = await warningsRes.json();
                document.getElementById('overviewWarnings').textContent = Array.isArray(warnings) ? warnings.length : 0;
            }
        } catch (err) {
            console.error('Error deleting warning:', err);
        }
    };

    const onCancel = () => {
        modal.style.display = 'none';
        cleanup();
    };

    function cleanup() {
        confirm.removeEventListener('click', onConfirm);
        cancel.removeEventListener('click', onCancel);
    }

    confirm.addEventListener('click', onConfirm);
    cancel.addEventListener('click', onCancel);
}

async function loadUsers() {
    if (!currentGuildId) return;

    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Cargando usuarios...</td></tr>';

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/users`);
        const users = await res.json();

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="table-user">
                        ${user.avatar ? `<img src="${user.avatar}" class="table-avatar" alt="">` : ''}
                        <span class="table-username">${escapeHtml(user.username)}</span>
                    </div>
                </td>
                <td><span class="user-tag" style="padding: 2px 6px;">${user.id}</span></td>
                <td>${formatDate(user.registeredAt)}</td>
                <td>
                    <button class="btn-icon" onclick="confirmDeleteUser('${user.id}')" title="Eliminar registro">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="4" class="table-empty">Error cargando usuarios</td></tr>';
    }
}

function confirmDeleteUser(userId) {
    const modal = document.getElementById('confirmModal');
    const confirm = document.getElementById('modalConfirm');
    const cancel = document.getElementById('modalCancel');

    document.getElementById('modalTitle').textContent = '¿Eliminar registro?';
    document.getElementById('modalDesc').textContent = 'Esta acción eliminará al usuario de la base de datos del bot.';
    modal.style.display = 'flex';

    const onConfirm = async () => {
        modal.style.display = 'none';
        cleanup();

        try {
            const res = await fetch(`/api/guilds/${currentGuildId}/users/${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                loadUsers();
            }
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const onCancel = () => {
        modal.style.display = 'none';
        cleanup();
    };

    function cleanup() {
        confirm.removeEventListener('click', onConfirm);
        cancel.removeEventListener('click', onCancel);
        document.getElementById('modalTitle').textContent = '¿Estás seguro?';
        document.getElementById('modalDesc').textContent = 'Esta acción no se puede deshacer.';
    }

    confirm.addEventListener('click', onConfirm);
    cancel.addEventListener('click', onCancel);
}

async function loadConfig() {
    if (!currentGuildId) return;

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/config`);
        const config = await res.json();

        document.getElementById('configLogsEnabled').checked = config.logsEnabled;
        document.getElementById('configLogChannel').value = config.logChannel || '';
    } catch (err) {
        console.error('Error loading config:', err);
    }
}

async function saveConfig() {
    const logsEnabled = document.getElementById('configLogsEnabled').checked;
    const logChannel = document.getElementById('configLogChannel').value.trim();
    const saveStatus = document.getElementById('saveStatus');

    showStatus(saveStatus, 'Guardando...');

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logsEnabled, logChannel })
        });

        if (!res.ok) {
            throw new Error('save-config-failed');
        }

        document.getElementById('quickLogStatus').textContent = logsEnabled ? 'Activados' : 'Desactivados';
        document.getElementById('quickLogChannel').textContent = formatChannelName(logChannel);
        document.getElementById('quickLogsCheckbox').checked = logsEnabled;

        showStatus(saveStatus, '✅ Guardado correctamente');
    } catch {
        showStatus(saveStatus, '❌ Error al guardar', true);
    }
}

async function loadPermissions() {
    if (!currentGuildId) return;

    try {
        const [commandsRes, permissionsRes] = await Promise.all([
            fetch(`/api/guilds/${currentGuildId}/commands`),
            fetch(`/api/guilds/${currentGuildId}/command-permissions`)
        ]);

        if (!commandsRes.ok || !permissionsRes.ok) {
            throw new Error('permissions-load-failed');
        }

        currentGuildCommands = await commandsRes.json();
        currentCommandPermissions = await permissionsRes.json();

        populateCommandSelect();
        updatePermissionStats();
        renderSelectedCommandPermission();
    } catch (err) {
        console.error('Error loading permissions:', err);
        showStatus(document.getElementById('permissionSaveStatus'), '❌ Error cargando permisos', true);
    }
}

function populateCommandSelect() {
    const select = document.getElementById('permCommandSelect');
    const previousSelection = select.value;

    if (!currentGuildCommands.length) {
        select.innerHTML = '<option value="">No hay comandos disponibles</option>';
        return;
    }

    const groupedCommands = currentGuildCommands.reduce((acc, command) => {
        const category = command.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(command);
        return acc;
    }, {});

    const html = Object.entries(groupedCommands).map(([category, commands]) => `
        <optgroup label="${escapeHtml(formatCategoryLabel(category))}">
            ${commands.map(command => `
                <option value="${command.name}">
                    /${command.name}
                </option>
            `).join('')}
        </optgroup>
    `).join('');

    select.innerHTML = html;
    select.value = currentGuildCommands.some(command => command.name === previousSelection)
        ? previousSelection
        : currentGuildCommands[0].name;
}

function renderSelectedCommandPermission() {
    const commandName = document.getElementById('permCommandSelect').value;
    const command = currentGuildCommands.find(item => item.name === commandName);

    if (!command || !currentGuildData) {
        return;
    }

    const rule = currentCommandPermissions[commandName] || getEmptyPermissionRule();

    document.getElementById('permSelectedCategory').textContent = formatCategoryLabel(command.category);
    document.getElementById('permCommandDescription').textContent = command.description || 'Sin descripción.';
    document.getElementById('permDiscordRequirement').textContent = formatDefaultPermission(command.defaultMemberPermissions);
    document.getElementById('permEnabledCheckbox').checked = rule.enabled !== false;

    populateMultiSelect('permAllowedRoles', currentGuildData.roles, rule.allowedRoleIds, role => role.name);
    populateMultiSelect('permBlockedRoles', currentGuildData.roles, rule.blockedRoleIds, role => role.name);
    populateMultiSelect('permAllowedChannels', currentGuildData.channels, rule.allowedChannelIds, channel => `#${channel.name}`);
    populateMultiSelect('permBlockedChannels', currentGuildData.channels, rule.blockedChannelIds, channel => `#${channel.name}`);
}

async function saveCommandPermission() {
    if (!currentGuildId) return;

    const commandName = document.getElementById('permCommandSelect').value;
    if (!commandName) return;

    const saveStatus = document.getElementById('permissionSaveStatus');
    showStatus(saveStatus, 'Guardando...');

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/command-permissions/${commandName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enabled: document.getElementById('permEnabledCheckbox').checked,
                allowedRoleIds: getMultiSelectValues('permAllowedRoles'),
                blockedRoleIds: getMultiSelectValues('permBlockedRoles'),
                allowedChannelIds: getMultiSelectValues('permAllowedChannels'),
                blockedChannelIds: getMultiSelectValues('permBlockedChannels')
            })
        });

        if (!res.ok) {
            throw new Error('save-command-permission-failed');
        }

        const data = await res.json();
        if (data.hasCustomSettings) {
            currentCommandPermissions[commandName] = data.rule;
        } else {
            delete currentCommandPermissions[commandName];
        }

        updatePermissionStats();
        showStatus(saveStatus, '✅ Regla guardada');
    } catch (err) {
        console.error('Error saving permission rule:', err);
        showStatus(saveStatus, '❌ Error al guardar', true);
    }
}

async function resetCommandPermission() {
    if (!currentGuildId) return;

    const commandName = document.getElementById('permCommandSelect').value;
    if (!commandName) return;

    const saveStatus = document.getElementById('permissionSaveStatus');
    showStatus(saveStatus, 'Restableciendo...');

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/command-permissions/${commandName}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            throw new Error('reset-command-permission-failed');
        }

        delete currentCommandPermissions[commandName];
        updatePermissionStats();
        renderSelectedCommandPermission();
        showStatus(saveStatus, '✅ Regla restablecida');
    } catch (err) {
        console.error('Error resetting permission rule:', err);
        showStatus(saveStatus, '❌ Error al restablecer', true);
    }
}

function updatePermissionStats() {
    const rules = Object.values(currentCommandPermissions);
    const restrictedCommands = rules.filter(rule =>
        rule.enabled === false ||
        rule.allowedRoleIds.length > 0 ||
        rule.blockedRoleIds.length > 0 ||
        rule.allowedChannelIds.length > 0 ||
        rule.blockedChannelIds.length > 0
    );

    document.getElementById('permTotalCommands').textContent = currentGuildCommands.length;
    document.getElementById('permCustomRules').textContent = rules.length;
    document.getElementById('permRestrictedCommands').textContent = restrictedCommands.length;
}

async function loadAppearance(silent = false) {
    if (!currentGuildId) return;

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/appearance`);
        if (!res.ok) {
            throw new Error('appearance-load-failed');
        }

        currentAppearance = await res.json();
        fillAppearanceForm(currentAppearance);
        updateAppearancePreviewFromInputs();
    } catch (err) {
        console.error('Error loading appearance:', err);
        if (!silent) {
            showStatus(document.getElementById('appearanceSaveStatus'), '❌ Error cargando apariencia', true);
        }
    }
}

function fillAppearanceForm(appearance) {
    document.getElementById('appearanceBotName').value = appearance.botDisplayName || '';
    document.getElementById('appearanceBotDescription').value = appearance.botDescription || '';

    const accentColor = normalizeHexColor(appearance.accentColor);
    document.getElementById('appearanceAccentColor').value = accentColor;
    document.getElementById('appearanceAccentColorPicker').value = accentColor;

    document.getElementById('appearanceDashboardBackground').value = appearance.dashboardBackgroundUrl || '';
    document.getElementById('appearanceProfileBackground').value = appearance.profileBackgroundUrl || '';
    document.getElementById('appearanceWelcomeBackground').value = appearance.welcomeBackgroundUrl || '';
    document.getElementById('appearanceGoodbyeBackground').value = appearance.goodbyeBackgroundUrl || '';
}

function getAppearanceFromInputs() {
    return {
        botDisplayName: document.getElementById('appearanceBotName').value.trim(),
        botDescription: document.getElementById('appearanceBotDescription').value.trim(),
        accentColor: normalizeHexColor(document.getElementById('appearanceAccentColor').value),
        dashboardBackgroundUrl: document.getElementById('appearanceDashboardBackground').value.trim(),
        profileBackgroundUrl: document.getElementById('appearanceProfileBackground').value.trim(),
        welcomeBackgroundUrl: document.getElementById('appearanceWelcomeBackground').value.trim(),
        goodbyeBackgroundUrl: document.getElementById('appearanceGoodbyeBackground').value.trim()
    };
}

function updateAppearancePreviewFromInputs() {
    const appearance = getAppearanceFromInputs();
    renderAppearancePreview(appearance);
    applyAppearanceTheme(appearance);
}

function renderAppearancePreview(appearance) {
    const preview = document.getElementById('appearancePreview');
    const displayName = appearance.botDisplayName || currentBotProfile?.username || 'ModBot';
    const description = appearance.botDescription || 'Panel personalizable para gestionar tu bot y tu servidor.';
    const accentColor = normalizeHexColor(appearance.accentColor);

    document.getElementById('appearancePreviewName').textContent = displayName;
    document.getElementById('appearancePreviewDescription').textContent = description;
    document.getElementById('appearancePreviewAvatar').src = currentBotProfile?.avatar || '';
    document.getElementById('appearancePreviewAvatar').style.display = currentBotProfile?.avatar ? 'block' : 'none';

    const safeBackground = safeCssUrl(appearance.dashboardBackgroundUrl);
    preview.style.backgroundImage = safeBackground
        ? `linear-gradient(135deg, ${hexToRgba(accentColor, 0.24)}, rgba(6, 6, 15, 0.92)), url('${safeBackground}')`
        : `linear-gradient(135deg, ${hexToRgba(accentColor, 0.30)}, rgba(10, 10, 25, 0.95))`;
}

async function saveAppearance() {
    if (!currentGuildId) return;

    const appearance = getAppearanceFromInputs();
    const saveStatus = document.getElementById('appearanceSaveStatus');
    showStatus(saveStatus, 'Guardando...');

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/appearance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appearance)
        });

        if (!res.ok) {
            throw new Error('save-appearance-failed');
        }

        currentAppearance = await res.json();
        fillAppearanceForm(currentAppearance);
        updateAppearancePreviewFromInputs();
        showStatus(saveStatus, '✅ Apariencia guardada');
    } catch (err) {
        console.error('Error saving appearance:', err);
        showStatus(saveStatus, '❌ Error al guardar', true);
    }
}

function applyAppearanceTheme(appearance) {
    const accentColor = normalizeHexColor(appearance.accentColor);
    const accentHover = adjustHexColor(accentColor, 20);
    const accentGlow = hexToRgba(accentColor, 0.32);
    const accentGradientEnd = adjustHexColor(accentColor, 38);

    document.documentElement.style.setProperty('--accent', accentColor);
    document.documentElement.style.setProperty('--accent-hover', accentHover);
    document.documentElement.style.setProperty('--accent-glow', accentGlow);
    document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accentColor}, ${accentGradientEnd})`);

    const displayName = appearance.botDisplayName || currentBotProfile?.username || 'ModBot';
    document.querySelectorAll('.logo-text').forEach(label => {
        label.textContent = displayName;
    });

    const safeBackground = safeCssUrl(appearance.dashboardBackgroundUrl);
    if (safeBackground) {
        document.body.style.backgroundImage = `linear-gradient(rgba(6, 6, 15, 0.86), rgba(6, 6, 15, 0.95)), url('${safeBackground}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundAttachment = '';
    }
}

function populateMultiSelect(elementId, items, selectedIds, labelGetter) {
    const element = document.getElementById(elementId);
    element.innerHTML = items.map(item => `
        <option value="${item.id}" ${selectedIds.includes(item.id) ? 'selected' : ''}>
            ${escapeHtml(labelGetter(item))}
        </option>
    `).join('');
}

function getMultiSelectValues(elementId) {
    return [...document.getElementById(elementId).selectedOptions].map(option => option.value);
}

function getEmptyPermissionRule() {
    return {
        enabled: true,
        allowedRoleIds: [],
        blockedRoleIds: [],
        allowedChannelIds: [],
        blockedChannelIds: []
    };
}

function formatChannelName(channelName) {
    return channelName ? `#${channelName}` : 'No configurado';
}

function formatCategoryLabel(category) {
    const labels = {
        moderation: 'Moderación',
        utilities: 'Utilidades',
        info: 'Información',
        fun: 'Diversión',
        general: 'General'
    };

    return labels[category] || category;
}

function formatDefaultPermission(permissionString) {
    if (!permissionString) {
        return 'Sin requisito adicional';
    }

    try {
        const permissionBits = BigInt(permissionString);
        const labels = [];

        if (permissionBits & 0x8n) labels.push('Administrador');
        if (permissionBits & 0x20n) labels.push('Gestionar servidor');
        if (permissionBits & 0x10n) labels.push('Gestionar canales');
        if (permissionBits & 0x4n) labels.push('Banear miembros');
        if (permissionBits & 0x2n) labels.push('Expulsar miembros');
        if (permissionBits & 0x20000000n) labels.push('Gestionar roles');
        if (permissionBits & 0x10000000n) labels.push('Gestionar webhooks');
        if (permissionBits & 0x2000n) labels.push('Gestionar mensajes');

        return labels.length ? labels.join(' · ') : `Bitfield ${permissionString}`;
    } catch {
        return `Bitfield ${permissionString}`;
    }
}

function normalizeHexColor(value, fallback = '#5865F2') {
    const normalized = String(value || '').trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/.test(normalized)) {
        return normalized;
    }

    return fallback;
}

function adjustHexColor(hex, amount) {
    const color = normalizeHexColor(hex).replace('#', '');
    const value = Number.parseInt(color, 16);

    const red = Math.max(0, Math.min(255, (value >> 16) + amount));
    const green = Math.max(0, Math.min(255, ((value >> 8) & 0x00ff) + amount));
    const blue = Math.max(0, Math.min(255, (value & 0x0000ff) + amount));

    return `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function hexToRgba(hex, alpha) {
    const color = normalizeHexColor(hex).replace('#', '');
    const value = Number.parseInt(color, 16);
    const red = value >> 16;
    const green = (value >> 8) & 0x00ff;
    const blue = value & 0x0000ff;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function safeCssUrl(url) {
    if (!url) return '';
    return String(url).replace(/'/g, "\\'");
}

function showStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.add('visible');
    element.classList.toggle('is-error', isError);

    clearTimeout(element._statusTimeout);
    element._statusTimeout = setTimeout(() => {
        element.classList.remove('visible');
        element.classList.remove('is-error');
    }, 3200);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(iso) {
    try {
        const date = new Date(iso);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return iso;
    }
}
