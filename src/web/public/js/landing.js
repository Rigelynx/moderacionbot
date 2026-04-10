// ═══════════════════════════════════════
// ModBot Landing Page — JavaScript
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initNavbar();
    initCommandTabs();
    fetchStats();
    // Refresh stats every 30 seconds
    setInterval(fetchStats, 30000);
});

// ── Scroll Animations (Intersection Observer) ──
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// ── Navbar ──
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(6, 6, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(6, 6, 15, 0.7)';
        }
    });

    // Mobile menu
    menuBtn?.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        menuBtn.classList.toggle('active');
    });

    // Close mobile menu on link click
    mobileMenu?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        });
    });
}

// ── Command Tabs ──
function initCommandTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const lists = document.querySelectorAll('.commands-list');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show target list
            lists.forEach(list => {
                list.classList.remove('active');
                if (list.id === `tab-${target}`) {
                    list.classList.add('active');
                    // Re-trigger fade-in animations
                    list.querySelectorAll('.fade-in').forEach(el => {
                        el.classList.remove('visible');
                        requestAnimationFrame(() => {
                            el.classList.add('visible');
                        });
                    });
                }
            });
        });
    });
}

// ── Fetch & Animate Stats ──
async function fetchStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        const data = await res.json();

        // Animate hero stats
        animateCounter('stat-servers', data.servers);
        animateCounter('stat-users', data.users);
        animateCounter('stat-commands', data.commands);

        // Update live stats section
        document.getElementById('live-servers').textContent = data.servers.toLocaleString();
        document.getElementById('live-users').textContent = data.users.toLocaleString();
        document.getElementById('live-ping').textContent = data.ping + 'ms';
        document.getElementById('live-uptime').textContent = formatUptime(data.uptime);
    } catch (err) {
        console.warn('Could not fetch stats:', err);
    }
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;

    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 1500;
    const start = performance.now();

    function update(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(current + (target - current) * eased).toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 24) {
        const d = Math.floor(h / 24);
        return `${d}d ${h % 24}h`;
    }
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
