// ═══════════════════════════════════════
// ModBot Dashboard — JavaScript
// ═══════════════════════════════════════

let currentUser = null;
let currentGuildId = null;
let currentGuildData = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// ── Auth Check ──
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

    // Set user info
    document.getElementById('userName').textContent = currentUser.globalName || currentUser.username;
    document.getElementById('userAvatar').src = currentUser.avatar;

    loadGuilds();
    initNavigation();
    initSidebar();
}

// ── Load Guilds ──
async function loadGuilds() {
    const serverList = document.getElementById('serverList');
    try {
        const res = await fetch('/api/guilds');
        if (!res.ok) throw new Error('Failed to load guilds');
        const guilds = await res.json();

        if (guilds.length === 0) {
            serverList.innerHTML = `
                <div class="server-loading">No hay servidores mutuos con permisos de admin</div>
            `;
            return;
        }

        serverList.innerHTML = guilds.map(g => `
            <button class="server-item" data-guild-id="${g.id}">
                <div class="server-icon">
                    ${g.icon 
                        ? `<img src="${g.icon}" alt="${g.name}">` 
                        : g.name.charAt(0).toUpperCase()}
                </div>
                <span>${g.name}</span>
            </button>
        `).join('');

        // Add click handlers
        serverList.querySelectorAll('.server-item').forEach(item => {
            item.addEventListener('click', () => selectGuild(item.dataset.guildId));
        });

    } catch (err) {
        serverList.innerHTML = `<div class="server-loading">Error cargando servidores</div>`;
    }
}

// ── Select Guild ──
async function selectGuild(guildId) {
    currentGuildId = guildId;

    // Update active state
    document.querySelectorAll('.server-item').forEach(s => s.classList.remove('active'));
    document.querySelector(`.server-item[data-guild-id="${guildId}"]`)?.classList.add('active');

    // Show navigation
    document.getElementById('navSection').style.display = 'block';

    // Load guild data
    try {
        const res = await fetch(`/api/guilds/${guildId}`);
        if (!res.ok) throw new Error('Failed to load guild');
        currentGuildData = await res.json();

        // Show overview by default
        switchView('overview');
        loadOverview();

    } catch (err) {
        console.error('Error loading guild:', err);
    }
}

// ── Navigation ──
function initNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);

            if (view === 'overview') loadOverview();
            if (view === 'warnings') loadWarnings();
            if (view === 'config') loadConfig();
        });
    });
}

function switchView(viewName) {
    // Update nav active state
    document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

    // Hide all views
    document.getElementById('emptyState').style.display = 'none';
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');

    // Show target
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.style.display = 'block';
}

// ── Sidebar mobile ──
function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    toggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close on click outside
    document.getElementById('mainContent')?.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}

// ── Overview ──
async function loadOverview() {
    if (!currentGuildData) return;

    const g = currentGuildData;
    document.getElementById('guildIcon').src = g.icon || '';
    document.getElementById('guildIcon').style.display = g.icon ? 'block' : 'none';
    document.getElementById('guildName').textContent = g.name;
    document.getElementById('guildSubtitle').textContent = `${g.memberCount} miembros · ${g.channels.length} canales`;

    document.getElementById('overviewMembers').textContent = g.memberCount.toLocaleString();
    document.getElementById('overviewChannels').textContent = g.channels.length;
    document.getElementById('overviewRoles').textContent = g.roles.length;

    // Load warnings count
    try {
        const wRes = await fetch(`/api/guilds/${currentGuildId}/warnings`);
        const warnings = await wRes.json();
        document.getElementById('overviewWarnings').textContent = Array.isArray(warnings) ? warnings.length : 0;
    } catch {
        document.getElementById('overviewWarnings').textContent = '—';
    }

    // Load config for quick config
    try {
        const cRes = await fetch(`/api/guilds/${currentGuildId}/config`);
        const config = await cRes.json();
        document.getElementById('quickLogStatus').textContent = config.logsEnabled ? 'Activados' : 'Desactivados';
        document.getElementById('quickLogChannel').textContent = '#' + config.logChannel;
        
        const checkbox = document.getElementById('quickLogsCheckbox');
        checkbox.checked = config.logsEnabled;
        
        // Quick toggle handler
        checkbox.onchange = async () => {
            await fetch(`/api/guilds/${currentGuildId}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logsEnabled: checkbox.checked })
            });
            document.getElementById('quickLogStatus').textContent = checkbox.checked ? 'Activados' : 'Desactivados';
        };
    } catch {}
}

// ── Warnings ──
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

        tbody.innerHTML = warnings.map(w => `
            <tr>
                <td>
                    <div class="table-user">
                        ${w.avatar ? `<img src="${w.avatar}" class="table-avatar" alt="">` : ''}
                        <span class="table-username">${escapeHtml(w.username)}</span>
                    </div>
                </td>
                <td>${escapeHtml(w.reason)}</td>
                <td>${escapeHtml(w.moderator)}</td>
                <td>${formatDate(w.date)}</td>
                <td>
                    <button class="btn-icon" onclick="confirmDeleteWarning('${w.userId}', ${w.index})" title="Eliminar">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Error cargando advertencias</td></tr>';
    }
}

// ── Delete Warning ──
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
                // Update overview warnings count
                const wRes = await fetch(`/api/guilds/${currentGuildId}/warnings`);
                const w = await wRes.json();
                document.getElementById('overviewWarnings').textContent = Array.isArray(w) ? w.length : 0;
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

// ── Config ──
async function loadConfig() {
    if (!currentGuildId) return;

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/config`);
        const config = await res.json();

        document.getElementById('configLogsEnabled').checked = config.logsEnabled;
        document.getElementById('configLogChannel').value = config.logChannel;
    } catch (err) {
        console.error('Error loading config:', err);
    }

    // Save handler
    document.getElementById('saveConfigBtn').onclick = saveConfig;
}

async function saveConfig() {
    const logsEnabled = document.getElementById('configLogsEnabled').checked;
    const logChannel = document.getElementById('configLogChannel').value.trim();

    const saveStatus = document.getElementById('saveStatus');
    saveStatus.textContent = 'Guardando...';
    saveStatus.classList.add('visible');

    try {
        const res = await fetch(`/api/guilds/${currentGuildId}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logsEnabled, logChannel })
        });

        if (res.ok) {
            saveStatus.textContent = '✅ Guardado correctamente';
            // Update overview
            document.getElementById('quickLogStatus').textContent = logsEnabled ? 'Activados' : 'Desactivados';
            document.getElementById('quickLogChannel').textContent = '#' + logChannel;
            document.getElementById('quickLogsCheckbox').checked = logsEnabled;
        } else {
            saveStatus.textContent = '❌ Error al guardar';
        }
    } catch {
        saveStatus.textContent = '❌ Error de conexión';
    }

    setTimeout(() => {
        saveStatus.classList.remove('visible');
    }, 3000);
}

// ── Utilities ──
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('es-ES', {
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
