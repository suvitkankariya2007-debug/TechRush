/**
 * VaultID - Admin Portal
 * UI with mock data (admin endpoints not yet implemented)
 * Health check verifies backend connection.
 */

// ===== CONFIGURATION =====
const CONFIG = {
    API_BASE: window.location.origin,  // same origin
    SESSION_DURATION: 15 * 60 * 1000,
    TOAST_DURATION: 4000,
    ADMIN_EMAIL: 'admin@vaultid.com',
    ADMIN_PASSWORD: 'Admin@2026',
};

// ===== STATE =====
const AdminState = {
    isAuthenticated: false,
    sessionExpiry: null,
    sessionTimer: null,
    currentTab: 'overview',
    // Mock data for UI
    users: [
        { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', deviceFingerprint: 'fp_a1b2c3d4e5', trustScore: 92, status: 'Active', lastLogin: new Date(Date.now() - 60000) },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', deviceFingerprint: 'fp_i9j0k1l2m3', trustScore: 78, status: 'Suspicious', lastLogin: new Date(Date.now() - 3600000) },
        { firstName: 'Robert', lastName: 'Johnson', email: 'robert.j@example.com', deviceFingerprint: 'fp_q7r8s9t0u1', trustScore: 45, status: 'Blocked', lastLogin: new Date(Date.now() - 86400000) },
    ],
    alerts: [
        { id: 1, severity: 'High', title: 'Suspicious Login Attempt', description: 'User Robert Johnson attempted login from unknown IP', timestamp: Date.now() - 120000, read: false, affectedUser: 'Robert Johnson', action: 'Blocked access' },
        { id: 2, severity: 'Medium', title: 'Unusual Login Pattern', description: 'Jane Smith logged in from Brazil while device in US', timestamp: Date.now() - 1800000, read: false, affectedUser: 'Jane Smith', action: 'Additional verification required' },
        { id: 3, severity: 'Low', title: 'New Device Enrolled', description: 'New device Firefox on MacOS added to account', timestamp: Date.now() - 3600000, read: true, affectedUser: 'Robert Johnson', action: 'Device added to monitoring' },
    ],
    auditLog: [
        { timestamp: new Date(Date.now() - 60000), user: 'John Doe', email: 'john.doe@example.com', method: 'Passkey', device: 'Chrome on Windows', ipAddress: '192.168.1.1', location: 'New York, US', riskScore: 12, status: 'Success' },
        { timestamp: new Date(Date.now() - 1800000), user: 'Jane Smith', email: 'jane.smith@example.com', method: 'OTP', device: 'Safari on iPhone', ipAddress: '189.12.34.56', location: 'São Paulo, BR', riskScore: 68, status: 'Failed' },
        { timestamp: new Date(Date.now() - 7200000), user: 'Robert Johnson', email: 'robert.j@example.com', method: 'Passkey', device: 'Firefox on MacOS', ipAddress: '45.67.89.10', location: 'Unknown', riskScore: 89, status: 'Failed' },
    ],
    riskAssessments: [
        { user: 'Jane Smith', timestamp: new Date(Date.now() - 120000), riskScore: 68, level: 'Medium', factors: ['Location Anomaly', 'New Device'], recommendation: 'Require 2FA' },
        { user: 'Robert Johnson', timestamp: new Date(Date.now() - 1800000), riskScore: 89, level: 'High', factors: ['Device Fingerprint Mismatch', 'Location Unknown'], recommendation: 'Block access' },
    ],
};

// ===== DOM REFERENCES =====
const DOM = {
    adminLogin: document.getElementById('page-admin-login'),
    adminDashboard: document.getElementById('page-admin-dashboard'),
    adminEmail: document.getElementById('adminEmail'),
    adminPassword: document.getElementById('adminPassword'),
    adminLoginBtn: document.getElementById('adminLoginBtn'),
    adminLoginError: document.getElementById('adminLoginError'),
    adminLogoutBtn: document.getElementById('adminLogoutBtn'),
    adminSessionTimer: document.getElementById('adminSessionTimer'),
    adminPageTitle: document.getElementById('adminPageTitle'),

    tabButtons: document.querySelectorAll('.sidebar-nav-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    recentIncidents: document.getElementById('recentIncidents'),
    userSearch: document.getElementById('userSearch'),
    userFilter: document.getElementById('userFilter'),
    userTableBody: document.getElementById('userTableBody'),
    adminDeviceList: document.getElementById('adminDeviceList'),
    adminAlertFilter: document.getElementById('adminAlertFilter'),
    adminAlertType: document.getElementById('adminAlertType'),
    adminAlertList: document.getElementById('adminAlertList'),
    adminAlertBadge: document.getElementById('adminAlertBadge'),
    auditDateFrom: document.getElementById('auditDateFrom'),
    auditDateTo: document.getElementById('auditDateTo'),
    auditMethod: document.getElementById('auditMethod'),
    auditStatus: document.getElementById('auditStatus'),
    auditTableBody: document.getElementById('auditTableBody'),
    exportAuditLog: document.getElementById('exportAuditLog'),
    riskResults: document.getElementById('riskResults'),
    toastContainer: document.getElementById('toastContainer'),
};

// ===== TOAST SYSTEM =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
}

// ===== NAVIGATION =====
function showPage(pageElement) {
    [DOM.adminLogin, DOM.adminDashboard].forEach(p => {
        p.classList.add('hidden');
    });
    pageElement.classList.remove('hidden');
}

// ===== SESSION =====
function startAdminSessionTimer() {
    if (AdminState.sessionTimer) clearInterval(AdminState.sessionTimer);
    updateAdminSessionTimer();
    AdminState.sessionTimer = setInterval(updateAdminSessionTimer, 1000);
}

function updateAdminSessionTimer() {
    const left = Math.max(0, Math.floor((AdminState.sessionExpiry - Date.now()) / 1000));
    const minutes = String(Math.floor(left / 60)).padStart(2, '0');
    const seconds = String(left % 60).padStart(2, '0');
    DOM.adminSessionTimer.textContent = `${minutes}:${seconds}`;
    if (left <= 0) {
        showToast('Admin session expired', 'error');
        adminLogout();
    }
}

function adminLogout() {
    if (AdminState.sessionTimer) clearInterval(AdminState.sessionTimer);
    AdminState.isAuthenticated = false;
    showPage(DOM.adminLogin);
    showToast('Signed out of admin portal', 'info');
}

// ===== ADMIN LOGIN (hardcoded) =====
async function handleAdminLogin() {
    const email = DOM.adminEmail.value.trim();
    const password = DOM.adminPassword.value.trim();

    if (!email || !password) {
        DOM.adminLoginError.textContent = 'Please enter email and password';
        DOM.adminLoginError.classList.remove('hidden');
        return;
    }

    if (email === CONFIG.ADMIN_EMAIL && password === CONFIG.ADMIN_PASSWORD) {
        DOM.adminLoginError.classList.add('hidden');
        AdminState.isAuthenticated = true;
        AdminState.sessionExpiry = Date.now() + CONFIG.SESSION_DURATION;
        showToast('✅ Admin access granted', 'success');
        showPage(DOM.adminDashboard);
        renderAdminDashboard();
        startAdminSessionTimer();
        // Optionally test backend health
        try {
            const health = await fetch(CONFIG.API_BASE + '/api/health').then(r => r.json());
            console.log('Backend health:', health);
        } catch (e) {
            console.warn('Backend not reachable for health check');
        }
    } else {
        DOM.adminLoginError.textContent = 'Invalid admin credentials';
        DOM.adminLoginError.classList.remove('hidden');
        showToast('❌ Invalid credentials', 'error');
    }
}

// ===== RENDER ADMIN DASHBOARD (mock data) =====
function renderAdminDashboard() {
    renderRecentIncidents();
    renderUserTable();
    renderAdminDevices();
    renderAdminAlerts();
    renderAuditLog();
    renderRiskResults();
    updateAdminAlertBadge();
    initializeCharts();
}

function renderRecentIncidents() {
    if (!DOM.recentIncidents) return;
    const incidents = AdminState.alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    DOM.recentIncidents.innerHTML = incidents.map(incident => `
        <div class="incident-item">
            <div class="incident-info">
                <div class="incident-title">
                    <span class="badge ${incident.severity === 'High' ? 'badge-danger' : incident.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">
                        ${incident.severity}
                    </span>
                    ${incident.title}
                </div>
                <div class="incident-description">${incident.description}</div>
                <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.15rem;">
                    User: ${incident.affectedUser} · ${incident.action}
                </div>
            </div>
            <div class="incident-time">${getRelativeTime(incident.timestamp)}</div>
        </div>
    `).join('');
}

function renderUserTable() {
    if (!DOM.userTableBody) return;
    const search = DOM.userSearch ? DOM.userSearch.value.toLowerCase() : '';
    const filter = DOM.userFilter ? DOM.userFilter.value : 'all';
    let filtered = AdminState.users;
    if (search) filtered = filtered.filter(u => u.email.toLowerCase().includes(search) || u.firstName.toLowerCase().includes(search) || u.lastName.toLowerCase().includes(search));
    if (filter !== 'all') filtered = filtered.filter(u => u.status.toLowerCase() === filter.toLowerCase());
    DOM.userTableBody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.firstName} ${user.lastName}</strong></td>
            <td style="font-size:0.8rem;">${user.email}</td>
            <td style="font-family:monospace; font-size:0.7rem; color:#64748b;">${user.deviceFingerprint}</td>
            <td><span class="badge ${user.trustScore >= 80 ? 'badge-success' : user.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}">${user.trustScore}%</span></td>
            <td><span class="badge ${user.status === 'Active' ? 'badge-success' : user.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">${user.status}</span></td>
            <td style="font-size:0.75rem; color:#64748b;">${user.lastLogin.toLocaleString()}</td>
        </tr>
    `).join('');
}

function renderAdminDevices() {
    if (!DOM.adminDeviceList) return;
    // Simplified device list (mock)
    DOM.adminDeviceList.innerHTML = `
        <div class="admin-device-item">
            <div class="admin-device-header">
                <div>
                    <span class="admin-device-name"><i class="fas fa-laptop" style="color:#1a237e; margin-right:0.5rem;"></i>Chrome on Windows 11</span>
                    <span style="margin-left:0.5rem;"><span class="badge badge-success">Trusted</span> Trust Score: 92%</span>
                </div>
                <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">fp_a1b2c3d4e5f6g7h8</div>
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem; display:flex; gap:1rem; flex-wrap:wrap;">
                <span>IP: 192.168.1.1</span><span>Location: New York, US</span><span>First Seen: 2026-01-15</span><span>Last Seen: 2026-08-05</span>
            </div>
        </div>
        <div class="admin-device-item">
            <div class="admin-device-header">
                <div>
                    <span class="admin-device-name"><i class="fas fa-mobile-alt" style="color:#1a237e; margin-right:0.5rem;"></i>Safari on iPhone 15 Pro</span>
                    <span style="margin-left:0.5rem;"><span class="badge badge-warning">Suspicious</span> Trust Score: 78%</span>
                </div>
                <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">fp_i9j0k1l2m3n4o5p6</div>
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem; display:flex; gap:1rem; flex-wrap:wrap;">
                <span>IP: 192.168.1.10</span><span>Location: New York, US</span><span>First Seen: 2026-07-20</span><span>Last Seen: 2026-08-04</span>
            </div>
        </div>
    `;
}

function renderAdminAlerts() {
    if (!DOM.adminAlertList) return;
    const filter = DOM.adminAlertFilter ? DOM.adminAlertFilter.value : 'all';
    const type = DOM.adminAlertType ? DOM.adminAlertType.value : 'all';
    let filtered = AdminState.alerts;
    if (filter !== 'all') filtered = filtered.filter(a => a.severity === filter);
    if (type !== 'all') filtered = filtered.filter(a => a.category === type);
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    DOM.adminAlertList.innerHTML = filtered.map(alert => `
        <div class="admin-alert-item ${!alert.read ? 'unread' : ''}">
            <div class="admin-alert-header">
                <div>
                    <div class="admin-alert-title">
                        <span class="badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">
                            ${alert.severity}
                        </span>
                        ${alert.title}
                        ${!alert.read ? '<span class="badge badge-primary">New</span>' : ''}
                    </div>
                    <div class="admin-alert-description">${alert.description}</div>
                </div>
                <div style="font-size:0.75rem; color:#94a3b8; text-align:right;">
                    <div>${getRelativeTime(alert.timestamp)}</div>
                    <div style="font-weight:500; color:#1a237e; margin-top:0.15rem;">${alert.action}</div>
                </div>
            </div>
            <div class="admin-alert-meta">
                <span class="badge badge-primary">${alert.category || 'auth'}</span>
                <span style="font-size:0.75rem; color:#64748b;">User: ${alert.affectedUser}</span>
                <span style="font-size:0.75rem; color:#64748b;">ID: #${alert.id}</span>
            </div>
            <div class="admin-alert-tech">${alert.technicalDetails || 'No technical details'}</div>
        </div>
    `).join('') || '<p class="text-muted">No alerts</p>';
}

function updateAdminAlertBadge() {
    if (!DOM.adminAlertBadge) return;
    const unread = AdminState.alerts.filter(a => !a.read).length;
    DOM.adminAlertBadge.textContent = unread;
    DOM.adminAlertBadge.style.display = unread > 0 ? 'inline-flex' : 'none';
}

function renderAuditLog() {
    if (!DOM.auditTableBody) return;
    DOM.auditTableBody.innerHTML = AdminState.auditLog.map(entry => `
        <tr>
            <td style="font-size:0.75rem;">${entry.timestamp.toLocaleString()}</td>
            <td style="font-size:0.8rem;">${entry.user}</td>
            <td><span class="badge badge-primary">${entry.method}</span></td>
            <td style="font-size:0.75rem; color:#64748b;">${entry.device}</td>
            <td style="font-family:monospace; font-size:0.7rem; color:#64748b;">${entry.ipAddress}</td>
            <td style="font-size:0.75rem; color:#64748b;">${entry.location}</td>
            <td><span class="badge ${entry.riskScore < 30 ? 'badge-success' : entry.riskScore < 60 ? 'badge-warning' : 'badge-danger'}">${entry.riskScore}%</span></td>
            <td><span class="badge ${entry.status === 'Success' ? 'badge-success' : 'badge-danger'}">${entry.status}</span></td>
        </tr>
    `).join('');
}

function renderRiskResults() {
    if (!DOM.riskResults) return;
    DOM.riskResults.innerHTML = AdminState.riskAssessments.map(risk => `
        <div class="risk-result-item ${risk.level.toLowerCase()}">
            <div class="risk-result-header">
                <div>
                    <span class="risk-result-user">${risk.user}</span>
                    <span class="badge ${risk.level === 'High' ? 'badge-danger' : risk.level === 'Medium' ? 'badge-warning' : 'badge-success'}">
                        ${risk.level}
                    </span>
                </div>
                <div class="risk-result-score">Risk Score: ${risk.riskScore}% · Model Confidence: 87%</div>
            </div>
            <div class="risk-result-factors"><strong>Factors:</strong> ${risk.factors.join(', ')}</div>
            <div class="risk-result-recommendation"><strong>Recommendation:</strong> ${risk.recommendation}</div>
            <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.15rem;">${getRelativeTime(risk.timestamp)}</div>
        </div>
    `).join('');
}

function getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

function initializeCharts() {
    // Minimal chart init – if you have canvases, you can keep the logic.
    // For brevity, we'll skip actual chart rendering.
    console.log('Charts would be rendered here if canvases exist.');
}

// ===== TAB MANAGEMENT =====
function switchTab(tabId) {
    DOM.tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    DOM.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabId));
    const titles = {
        tabOverview: 'Overview',
        tabUsers: 'Users',
        tabDevices: 'Devices',
        tabSecurity: 'Security',
        tabAudit: 'Audit Log',
        tabRisk: 'Risk Engine',
        tabAnalytics: 'Analytics'
    };
    DOM.adminPageTitle.textContent = titles[tabId] || 'Overview';
    AdminState.currentTab = tabId;
    // Refresh content for each tab
    switch (tabId) {
        case 'tabUsers': renderUserTable(); break;
        case 'tabDevices': renderAdminDevices(); break;
        case 'tabSecurity': renderAdminAlerts(); break;
        case 'tabAudit': renderAuditLog(); break;
        case 'tabRisk': renderRiskResults(); break;
    }
}

// ===== EVENT LISTENERS =====
DOM.adminLoginBtn.addEventListener('click', handleAdmin Login);
DOM.adminEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
});
DOM.adminPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
});
DOM.adminLogoutBtn.addEventListener('click', adminLogout);

if (DOM.userSearch) DOM.userSearch.addEventListener('input', renderUserTable);
if (DOM.userFilter) DOM.userFilter.addEventListener('change', renderUserTable);
if (DOM.adminAlertFilter) DOM.adminAlertFilter.addEventListener('change', renderAdminAlerts);
if (DOM.adminAlertType) DOM.adminAlertType.addEventListener('change', renderAdminAlerts);

['auditDateFrom', 'auditDateTo', 'auditMethod', 'auditStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderAuditLog);
});
if (DOM.exportAuditLog) DOM.exportAuditLog.addEventListener('click', function() {
    if (AdminState.auditLog.length === 0) {
        showToast('No audit data to export', 'warning');
        return;
    }
    const headers = ['Timestamp', 'User', 'Email', 'Method', 'Device', 'IP Address', 'Location', 'Risk Score', 'Status'];
    const rows = AdminState.auditLog.map(e => [
        e.timestamp.toISOString(),
        e.user,
        e.email,
        e.method,
        e.device,
        e.ipAddress,
        e.location,
        e.riskScore,
        e.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Audit log exported', 'success');
});

DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ===== WEBSOCKET SIMULATION =====
function startAdminWebSocketSimulation() {
    setInterval(() => {
        if (!AdminState.isAuthenticated) return;
        if (Math.random() < 0.12) {
            const severities = ['High', 'Medium', 'Low'];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const users = ['John Doe', 'Jane Smith', 'Robert Johnson'];
            const newAlert = {
                id: AdminState.alerts.length + 1,
                severity: severity,
                title: severity === 'High' ? 'Critical Security Breach Attempt' : severity === 'Medium' ? 'Suspicious Activity Detected' : 'New Device Registration',
                description: `Generated at ${new Date().toLocaleTimeString()}`,
                timestamp: new Date(),
                read: false,
                category: 'auth',
                affectedUser: users[Math.floor(Math.random() * users.length)],
                action: severity === 'High' ? 'Immediate block required' : 'Monitor and investigate',
                technicalDetails: `Risk Score: ${Math.floor(60 + Math.random() * 35)}% · Confidence: ${Math.floor(80 + Math.random() * 15)}%`,
            };
            AdminState.alerts.unshift(newAlert);
            if (AdminState.currentTab === 'tabSecurity' || AdminState.currentTab === 'tabOverview') {
                renderAdminAlerts();
                renderRecentIncidents();
            }
            updateAdminAlertBadge();
            showToast(`🔔 ${severity.toLowerCase()} priority alert`, severity === 'High' ? 'error' : severity === 'Medium' ? 'warning' : 'info');
        }
    }, 20000);
}

// ===== INIT =====
function init() {
    // Ensure alerts have category for filtering
    AdminState.alerts.forEach(a => { if (!a.category) a.category = 'auth'; if (!a.technicalDetails) a.technicalDetails = 'N/A'; });
    showPage(DOM.adminLogin);
    showToast('🔐 Welcome to VaultID Admin Portal', 'info');
    setTimeout(() => {
        showToast('💡 Use admin@vaultid.com / Admin@2026', 'info');
    }, 1000);
    startAdminWebSocketSimulation();
    console.log('VaultID Admin Portal initialized');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// Expose for console
window.showToast = showToast;
window.adminLogout = adminLogout;