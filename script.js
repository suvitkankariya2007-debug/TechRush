/**
 * VaultID - User Portal
 * TEMPLATE VERSION – No Synthetic Data
 * All data arrays are empty – ready for real data
 */

console.log('🚀 VaultID Loading... (Template Mode)');

// ===== STATE =====
const State = {
    user: { email: '', firstName: '', lastName: '' },
    accessToken: null,
    alerts: [],
    devices: [],
    activity: [],
    transactionHistory: [],
    pendingTransactions: [],
    securityEvents: [],
    currentTab: 'overview'
};

// ===== NO MOCK DATA – ALL ARRAYS EMPTY =====
// Your friends can populate these arrays with real data.

// ===== RENDER FUNCTIONS =====
function renderDevices() {
    const container = document.getElementById('deviceList');
    if (!container) return;
    if (State.devices.length === 0) {
        container.innerHTML = '<p class="text-muted">No devices connected</p>';
        return;
    }
    container.innerHTML = State.devices.map(d => `
        <div class="device-card">
            <div class="device-info">
                <div class="device-icon"><i class="fas fa-${d.type === 'mobile' ? 'mobile-alt' : d.type === 'tablet' ? 'tablet' : 'laptop'}"></i></div>
                <div>
                    <div class="device-name">${d.name}</div>
                    <div class="device-location">${d.location} · ${d.os} · ${d.browser}</div>
                    <div class="device-location" style="font-size:0.7rem;color:#94a3b8;">IP: ${d.ip}</div>
                </div>
            </div>
            <div class="device-status">
                ${d.current ? '<span class="badge badge-success">Current</span>' : ''}
                ${d.trusted ? '<span class="badge badge-success">✓ Trusted</span>' : '<span class="badge badge-warning">⚠ Untrusted</span>'}
                <span style="font-size:0.7rem;color:#94a3b8;">${getRelativeTime(d.lastUsed)}</span>
            </div>
        </div>
    `).join('');
}

function renderAlerts() {
    const container = document.getElementById('alertList');
    if (!container) return;
    const filter = document.getElementById('alertFilter')?.value || 'all';
    let filtered = State.alerts.filter(a => filter === 'all' || a.severity === filter);
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-muted">No security alerts</p>';
        return;
    }
    container.innerHTML = filtered.map(a => `
        <div class="alert-item ${!a.read ? 'unread' : ''}">
            <div class="alert-header">
                <span class="alert-title">
                    <span class="badge ${a.severity === 'High' ? 'badge-danger' : a.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">${a.severity}</span>
                    ${a.title} ${!a.read ? '<span class="badge badge-primary">New</span>' : ''}
                </span>
                <span class="alert-time">${getRelativeTime(a.timestamp)}</span>
            </div>
            <div class="alert-description">${a.description}</div>
            <div style="margin-top:0.3rem;font-size:0.75rem;color:#64748b;">
                <span class="badge badge-secondary">${a.category}</span>
                <span>Action: ${a.action}</span>
            </div>
        </div>
    `).join('');
    // Update badge
    const badge = document.getElementById('alertBadge');
    const unread = State.alerts.filter(a => !a.read).length;
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline-flex' : 'none'; }
}

function renderActivity() {
    const container = document.getElementById('activityBody');
    if (!container) return;
    const activities = State.activity.sort((a, b) => b.date - a.date);
    if (activities.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="padding:1rem;text-align:center;color:#94a3b8;">No activity yet</td></tr>';
        return;
    }
    container.innerHTML = activities.map(e => `
        <tr>
            <td style="font-size:0.75rem;">${e.date.toLocaleString()}</td>
            <td>${e.action}${e.amount ? ` <span style="color:${e.amount > 0 ? '#22c55e' : '#ef4444'};font-weight:600;">${e.amount > 0 ? '+' : ''}$${Math.abs(e.amount).toFixed(2)}</span>` : ''}</td>
            <td style="font-size:0.75rem;color:#64748b;">${e.device}</td>
            <td><span class="badge ${e.status === 'Success' ? 'badge-success' : 'badge-danger'}">${e.status}</span></td>
        </tr>
    `).join('');
}

function renderTransactions() {
    const historyContainer = document.getElementById('transactionHistory');
    if (historyContainer) {
        if (State.transactionHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-muted">No transactions</p>';
        } else {
            historyContainer.innerHTML = State.transactionHistory.map(tx => `
                <div class="activity-item" style="border-left-color:${tx.amount > 0 ? '#22c55e' : '#ef4444'};">
                    <div class="activity-info">
                        <div class="activity-action"><span style="color:${tx.amount > 0 ? '#22c55e' : '#ef4444'};">${tx.type} ${tx.amount > 0 ? '↓' : '↑'}</span> ${tx.description}</div>
                        <div class="activity-time">${tx.counterparty} · ${tx.date.toLocaleString()}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <span style="font-weight:600;color:${tx.amount > 0 ? '#22c55e' : '#ef4444'};">${tx.amount > 0 ? '+' : ''}$${Math.abs(tx.amount).toFixed(2)}</span>
                        <span class="badge ${tx.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${tx.status}</span>
                    </div>
                </div>
            `).join('');
        }
    }
    const pendingContainer = document.getElementById('pendingTransactions');
    if (pendingContainer) {
        if (State.pendingTransactions.length === 0) {
            pendingContainer.innerHTML = '<p class="text-muted">No pending transactions</p>';
        } else {
            pendingContainer.innerHTML = State.pendingTransactions.map(tx => `
                <div class="alert-item" style="border-left:3px solid #f59e0b;">
                    <div class="alert-header">
                        <span class="alert-title"><span class="badge badge-warning">Pending</span> ${tx.description}</span>
                        <span style="font-weight:600;">$${tx.amount.toFixed(2)}</span>
                    </div>
                    <div class="alert-description">To: ${tx.counterparty} · Risk Score: ${tx.riskScore}% · ${tx.date.toLocaleString()}</div>
                    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
                        <button class="btn btn-sm btn-success" onclick="approveTransaction(${tx.id})">Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="declineTransaction(${tx.id})">Decline</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

function renderSecurityEvents() {
    const container = document.getElementById('securityEventsList');
    if (!container) return;
    if (State.securityEvents.length === 0) {
        container.innerHTML = '<p class="text-muted">No security events</p>';
        return;
    }
    container.innerHTML = State.securityEvents.map(e => `
        <div class="activity-item" style="border-left-color:${e.riskLevel === 'High' ? '#ef4444' : e.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'};">
            <div class="activity-info">
                <div class="activity-action">${e.event}</div>
                <div class="activity-time">${e.method} · ${e.device} · ${e.location}</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
                <span class="badge ${e.status === 'Success' ? 'badge-success' : 'badge-danger'}">${e.status}</span>
                <span class="badge ${e.riskLevel === 'High' ? 'badge-danger' : e.riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}">${e.riskLevel}</span>
                <span style="font-size:0.7rem;color:#94a3b8;">${getRelativeTime(e.date)}</span>
            </div>
        </div>
    `).join('');
}

function renderActivityPreview() {
    const container = document.getElementById('activityPreview');
    if (!container) return;
    const recent = State.alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }
    container.innerHTML = recent.map(a => `
        <div class="activity-item" style="border-left-color:${a.severity === 'High' ? '#ef4444' : a.severity === 'Medium' ? '#f59e0b' : '#22c55e'};">
            <div class="activity-info">
                <div class="activity-action">${a.title}</div>
                <div class="activity-time">${getRelativeTime(a.timestamp)}</div>
            </div>
            <span class="badge ${a.severity === 'High' ? 'badge-danger' : a.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">${a.severity}</span>
        </div>
    `).join('');
}

// ===== HELPER FUNCTIONS =====
function getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function handleQuickAction(action) { showToast(`${action} feature coming soon!`, 'info'); }
function approveTransaction(id) {
    const tx = State.pendingTransactions.find(t => t.id === id);
    if (tx) { State.pendingTransactions = State.pendingTransactions.filter(t => t.id !== id); renderTransactions(); showToast('✅ Transaction approved', 'success'); }
}
function declineTransaction(id) {
    State.pendingTransactions = State.pendingTransactions.filter(t => t.id !== id);
    renderTransactions();
    showToast('Transaction declined', 'warning');
}

// ===== TAB SWITCHING =====
function switchTab(tabId) {
    console.log('🔄 Switching to:', tabId);
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    const titles = { tabOverview: 'Overview', tabAccounts: 'Accounts', tabDevices: 'Devices', tabSecurity: 'Security', tabActivity: 'Activity' };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[tabId] || 'Overview';
    switch(tabId) {
        case 'tabDevices': renderDevices(); break;
        case 'tabSecurity': renderSecurityEvents(); renderAlerts(); break;
        case 'tabActivity': renderActivity(); break;
        case 'tabAccounts': renderTransactions(); break;
        case 'tabOverview': renderActivityPreview(); break;
    }
}

// ===== LOGIN =====
function handleLogin() {
    console.log('🔐 Logging in...');
    State.accessToken = 'mock_token_' + Date.now();
    document.getElementById('page-login').classList.add('hidden');
    document.getElementById('page-dashboard').classList.remove('hidden');
    renderDashboard();
    showToast('✅ Welcome back!', 'success');
}

function renderDashboard() {
    console.log('📊 Rendering dashboard...');
    document.getElementById('userName').textContent = State.user.firstName + ' ' + State.user.lastName || 'User Name';
    document.getElementById('userNameDisplay').textContent = State.user.firstName || 'User';
    document.getElementById('userEmail').textContent = State.user.email || 'user@example.com';
    document.getElementById('userAvatar').textContent = (State.user.firstName?.[0] || 'U') + (State.user.lastName?.[0] || '');
    renderDevices();
    renderAlerts();
    renderActivity();
    renderTransactions();
    renderSecurityEvents();
    renderActivityPreview();
    // Session timer
    let seconds = 900;
    const timer = document.getElementById('sessionTimer');
    if (timer) {
        setInterval(() => {
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            timer.textContent = `${mins}:${secs}`;
            seconds--;
            if (seconds < 0) seconds = 900;
        }, 1000);
    }
    console.log('✅ Dashboard rendered (template mode)');
}

function logout() {
    document.getElementById('page-dashboard').classList.add('hidden');
    document.getElementById('page-login').classList.remove('hidden');
    showToast('Signed out successfully', 'info');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded');
    // Login
    document.getElementById('loginPasskeyBtn').addEventListener('click', handleLogin);
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    // Tab switching
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.addEventListener('click', function() { switchTab(this.dataset.tab); });
    });
    // Alert filter
    document.getElementById('alertFilter').addEventListener('change', renderAlerts);
    // Refresh devices
    document.getElementById('refreshDevices').addEventListener('click', function() {
        showToast('🔄 Refreshing devices...', 'info');
        setTimeout(() => { renderDevices(); showToast('Devices updated', 'success'); }, 800);
    });
    // Export activity
    document.getElementById('exportActivity').addEventListener('click', function() {
        showToast('📄 Activity exported!', 'success');
    });
    // OTP toggle
    document.getElementById('switchToOtp').addEventListener('click', function() {
        const area = document.getElementById('otpFallbackArea');
        area.classList.toggle('hidden');
        this.textContent = area.classList.contains('hidden') ? 'Verification Code' : 'Back to passkey';
    });
    document.getElementById('verifyOtpBtn').addEventListener('click', function() {
        showToast('✅ Code verified!', 'success');
        handleLogin();
    });
    document.getElementById('resendOtp').addEventListener('click', function() {
        showToast('📧 New code sent to your email', 'info');
    });
    document.getElementById('goToRegister').addEventListener('click', function() {
        document.getElementById('page-login').classList.add('hidden');
        document.getElementById('page-register').classList.remove('hidden');
    });
    document.getElementById('goToLogin').addEventListener('click', function() {
        document.getElementById('page-register').classList.add('hidden');
        document.getElementById('page-login').classList.remove('hidden');
    });
    document.getElementById('registerBtn').addEventListener('click', function() {
        showToast('✅ Account created!', 'success');
        document.getElementById('page-register').classList.add('hidden');
        document.getElementById('page-login').classList.remove('hidden');
    });
    console.log('✅ VaultID ready (template mode)');
    showToast('🔐 Click "Sign in with Passkey" to access your dashboard', 'info');
});

// Expose to global
window.switchTab = switchTab;
window.showToast = showToast;
window.handleQuickAction = handleQuickAction;
window.approveTransaction = approveTransaction;
window.declineTransaction = declineTransaction;
window.logout = logout;
window.handleLogin = handleLogin;