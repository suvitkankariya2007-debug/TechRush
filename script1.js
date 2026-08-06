/**
 * VaultID - Admin Portal
 * TEMPLATE VERSION – No Synthetic Data
 * All data arrays are empty – ready for real data
 */

console.log('🚀 VaultID Admin Portal (Template Mode)');

// ===== CONFIGURATION =====
const CONFIG = {
    ADMIN_EMAIL: 'admin@vaultid.com',
    ADMIN_PASSWORD: 'Admin@2026',
    SESSION_DURATION: 15 * 60 * 1000,
    TOAST_DURATION: 4000,
};

// ===== STATE MANAGEMENT =====
const AdminState = {
    isAuthenticated: false,
    sessionExpiry: Date.now() + CONFIG.SESSION_DURATION,
    sessionTimer: null,
    alerts: [],
    users: [],
    devices: [],
    auditLog: [],
    riskAssessments: [],
    currentTab: 'overview',
    blockedAttempts: []
};

// ===== NO MOCK DATA – ALL ARRAYS EMPTY =====
// Your friends can populate these arrays with real data.

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
    blockedIPs: document.getElementById('blockedIPs'),
    toastContainer: document.getElementById('toastContainer'),
};

// ===== TOAST SYSTEM =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
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
    [DOM.adminLogin, DOM.adminDashboard].forEach(p => p.classList.add('hidden'));
    pageElement.classList.remove('hidden');
}

// ===== AUTHENTICATION =====
function handleAdminLogin() {
    const email = DOM.adminEmail.value.trim();
    const password = DOM.adminPassword.value.trim();
    if (!email) {
        DOM.adminLoginError.textContent = 'Please enter admin email';
        DOM.adminLoginError.classList.remove('hidden');
        return;
    }
    if (!password) {
        DOM.adminLoginError.textContent = 'Please enter password';
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
    } else {
        DOM.adminLoginError.textContent = 'Invalid admin credentials';
        DOM.adminLoginError.classList.remove('hidden');
        showToast('Invalid credentials', 'error');
    }
}

// ===== SESSION MANAGEMENT =====
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

// ===== RENDER ADMIN DASHBOARD =====
function renderAdminDashboard() {
    renderRecentIncidents();
    renderUserTable();
    renderAdminDevices();
    renderAdminAlerts();
    renderAuditLog();
    renderRiskResults();
    renderBlockedIPs();
    updateAdminAlertBadge();
    initializeCharts();
    updateSystemMetrics();
}

// ===== SYSTEM METRICS =====
function updateSystemMetrics() {
    const activeUsers = AdminState.users.filter(u => u.status === 'Active').length;
    const statTotalUsers = document.getElementById('statTotalUsers');
    const statActiveSessions = document.getElementById('statActiveSessions');
    const statSecurityAlerts = document.getElementById('statSecurityAlerts');
    const statRiskScore = document.getElementById('statRiskScore');
    if (statTotalUsers) statTotalUsers.textContent = AdminState.users.length || '0';
    if (statActiveSessions) statActiveSessions.textContent = activeUsers || '0';
    if (statSecurityAlerts) statSecurityAlerts.textContent = AdminState.alerts.filter(a => a.severity === 'High').length || '0';
    if (statRiskScore) statRiskScore.textContent = '0%';
}

// ===== RECENT INCIDENTS =====
function renderRecentIncidents() {
    if (!DOM.recentIncidents) return;
    const incidents = AdminState.alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    const newCount = incidents.filter(i => !i.read).length;
    const badge = document.getElementById('incidentBadge');
    if (badge) {
        badge.textContent = newCount + ' New';
        badge.style.display = newCount > 0 ? 'inline-flex' : 'none';
    }
    if (incidents.length === 0) {
        DOM.recentIncidents.innerHTML = '<p class="text-muted">No security incidents</p>';
        return;
    }
    DOM.recentIncidents.innerHTML = incidents.map(incident => `
        <div class="incident-item" onclick="viewIncidentDetail(${incident.id})">
            <div class="incident-info">
                <div class="incident-title">
                    <span class="badge ${incident.severity === 'High' ? 'badge-danger' : incident.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">${incident.severity}</span>
                    ${incident.title}
                    ${!incident.read ? '<span class="badge badge-primary" style="font-size:0.55rem;">New</span>' : ''}
                </div>
                <div class="incident-description">${incident.description}</div>
                <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.15rem;">User: ${incident.affectedUser} · ${incident.action}</div>
            </div>
            <div class="incident-time">${getRelativeTime(incident.timestamp)}</div>
        </div>
    `).join('');
}

function viewIncidentDetail(incidentId) {
    const incident = AdminState.alerts.find(a => a.id === incidentId);
    if (!incident) return;
    incident.read = true;
    renderAdminAlerts();
    renderRecentIncidents();
    updateAdminAlertBadge();
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:9998; display:flex; align-items:center; justify-content:center; padding:1.5rem; animation:fadeIn 0.3s ease;`;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
        <div style="background:white; border-radius:16px; padding:2rem; max-width:560px; width:100%; max-height:80vh; overflow-y:auto; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem;">
                <h3 style="display:flex; align-items:center; gap:0.5rem; font-size:1.1rem;">
                    <i class="fas fa-${incident.severity === 'High' ? 'exclamation-circle' : 'exclamation-triangle'}" style="color:${getSeverityColor(incident.severity)}"></i>
                    ${incident.title}
                </h3>
                <button onclick="this.closest('[role=dialog]').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#94a3b8; padding:0.25rem 0.5rem; border-radius:8px;">&times;</button>
            </div>
            <p style="margin:1rem 0; color:#475569;">${incident.description}</p>
            <div style="background:#f8fafc; padding:1rem; border-radius:12px; margin-bottom:1rem;">
                <p style="font-size:0.85rem; color:#64748b;"><strong>Affected User:</strong> ${incident.affectedUser}</p>
                <p style="font-size:0.85rem; color:#64748b; margin-top:0.3rem;"><strong>Action Taken:</strong> ${incident.action}</p>
                <p style="font-size:0.75rem; color:#64748b; margin-top:0.3rem; font-family:monospace;"><strong>Technical Details:</strong> ${incident.technicalDetails}</p>
                <p style="font-size:0.75rem; color:#94a3b8; margin-top:0.3rem;">${new Date(incident.timestamp).toLocaleString()}</p>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button onclick="this.closest('[role=dialog]').remove()" class="btn btn-secondary" style="flex:1;">Close</button>
                <button class="btn btn-primary" style="flex:1;" onclick="handleIncidentAction(${incident.id})">${incident.recommendedAction || 'Take Action'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.parentNode) overlay.remove(); });
}

function handleIncidentAction(incidentId) {
    const incident = AdminState.alerts.find(a => a.id === incidentId);
    if (!incident) return;
    showToast(`✅ Action taken: ${incident.recommendedAction || 'Resolved'}`, 'success');
    incident.read = true;
    renderAdminAlerts();
    renderRecentIncidents();
    updateAdminAlertBadge();
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) dialog.remove();
}

// ===== USER TABLE =====
function renderUserTable() {
    if (!DOM.userTableBody) return;
    const searchTerm = DOM.userSearch ? DOM.userSearch.value.toLowerCase() : '';
    const filter = DOM.userFilter ? DOM.userFilter.value : 'all';
    let filteredUsers = AdminState.users;
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(u =>
            u.firstName.toLowerCase().includes(searchTerm) ||
            u.lastName.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm)
        );
    }
    if (filter !== 'all') {
        filteredUsers = filteredUsers.filter(u => u.status.toLowerCase() === filter.toLowerCase());
    }
    if (filteredUsers.length === 0) {
        DOM.userTableBody.innerHTML = '<tr><td colspan="6" style="padding:1.5rem; text-align:center; color:#94a3b8;">No users found</td></tr>';
        return;
    }
    DOM.userTableBody.innerHTML = filteredUsers.map(user => `
        <tr onclick="viewUserDetail(${user.id})">
            <td><strong>${user.firstName} ${user.lastName}</strong></td>
            <td style="font-size:0.8rem;">${user.email}</td>
            <td style="font-family:monospace; font-size:0.7rem; color:#64748b;">${user.deviceFingerprint}</td>
            <td><span class="badge ${user.trustScore >= 80 ? 'badge-success' : user.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}">${user.trustScore}%</span></td>
            <td><span class="badge ${user.status === 'Active' ? 'badge-success' : user.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">${user.status}</span></td>
            <td style="font-size:0.75rem; color:#64748b;">${user.lastLogin.toLocaleString()}</td>
        </tr>
    `).join('');
}

function viewUserDetail(userId) {
    const user = AdminState.users.find(u => u.id === userId);
    if (!user) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); z-index:9998; display:flex; align-items:center; justify-content:center; padding:1.5rem; animation:fadeIn 0.3s ease;`;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const userDevices = AdminState.devices.filter(d => d.userId === userId);
    const userLogs = AdminState.auditLog.filter(l => l.email === user.email);
    overlay.innerHTML = `
        <div style="background:white; border-radius:16px; padding:2rem; max-width:640px; width:100%; max-height:80vh; overflow-y:auto; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem;">
                <h3 style="font-size:1.1rem; display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-user" style="color:#1a237e;"></i> ${user.firstName} ${user.lastName}</h3>
                <button onclick="this.closest('[role=dialog]').remove()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#94a3b8; padding:0.25rem 0.5rem; border-radius:8px;">&times;</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:1rem;">
                <div style="background:#f8fafc; padding:0.75rem; border-radius:8px;"><div style="font-size:0.7rem; color:#94a3b8;">Email</div><div style="font-size:0.85rem;">${user.email}</div></div>
                <div style="background:#f8fafc; padding:0.75rem; border-radius:8px;"><div style="font-size:0.7rem; color:#94a3b8;">Status</div><div><span class="badge ${user.status === 'Active' ? 'badge-success' : user.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">${user.status}</span></div></div>
                <div style="background:#f8fafc; padding:0.75rem; border-radius:8px;"><div style="font-size:0.7rem; color:#94a3b8;">Risk Level</div><div><span class="badge ${user.riskLevel === 'Low' ? 'badge-success' : user.riskLevel === 'Medium' ? 'badge-warning' : 'badge-danger'}">${user.riskLevel}</span></div></div>
                <div style="background:#f8fafc; padding:0.75rem; border-radius:8px;"><div style="font-size:0.7rem; color:#94a3b8;">Trust Score</div><div style="font-weight:600; color:${user.trustScore >= 80 ? '#22c55e' : user.trustScore >= 50 ? '#f59e0b' : '#ef4444'};">${user.trustScore}%</div></div>
            </div>
            <div style="margin-bottom:1rem;"><h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Devices (${userDevices.length})</h4>
                ${userDevices.map(d => `<div style="background:#f8fafc; padding:0.5rem 0.75rem; border-radius:8px; margin-bottom:0.25rem; display:flex; justify-content:space-between; align-items:center;"><span style="font-size:0.8rem;">${d.name}</span><span class="badge ${d.status === 'Trusted' ? 'badge-success' : d.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">${d.status}</span></div>`).join('') || '<p style="font-size:0.8rem; color:#94a3b8;">No devices</p>'}
            </div>
            <div style="margin-bottom:1rem;"><h4 style="font-size:0.85rem; margin-bottom:0.5rem;">Recent Activity</h4>
                ${userLogs.slice(0,3).map(log => `<div style="background:#f8fafc; padding:0.5rem 0.75rem; border-radius:8px; margin-bottom:0.25rem; display:flex; justify-content:space-between; align-items:center;"><span style="font-size:0.8rem;">${log.method} · ${log.status}</span><span style="font-size:0.7rem; color:#94a3b8;">${getRelativeTime(log.timestamp)}</span></div>`).join('') || '<p style="font-size:0.8rem; color:#94a3b8;">No activity</p>'}
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button onclick="this.closest('[role=dialog]').remove()" class="btn btn-secondary" style="flex:1;">Close</button>
                ${user.status === 'Suspicious' ? `<button class="btn btn-warning" style="flex:1; color:white;" onclick="userAction(${user.id}, 'investigate')">Investigate</button>` : ''}
                ${user.status === 'Blocked' ? `<button class="btn btn-success" style="flex:1;" onclick="userAction(${user.id}, 'unblock')">Unblock</button>` : ''}
                ${user.status === 'Active' ? `<button class="btn btn-danger" style="flex:1;" onclick="userAction(${user.id}, 'block')">Block</button>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.parentNode) overlay.remove(); });
}

function userAction(userId, action) {
    const user = AdminState.users.find(u => u.id === userId);
    if (!user) return;
    if (action === 'investigate') {
        showToast(`🔍 Investigating ${user.firstName} ${user.lastName}...`, 'info');
        setTimeout(() => {
            user.status = 'Active';
            user.trustScore = Math.min(user.trustScore + 10, 100);
            renderUserTable();
            showToast(`✅ ${user.firstName} ${user.lastName} cleared`, 'success');
        }, 2000);
    } else if (action === 'block') {
        user.status = 'Blocked';
        renderUserTable();
        showToast(`🚫 ${user.firstName} ${user.lastName} blocked`, 'error');
        AdminState.auditLog.unshift({
            timestamp: new Date(),
            user: 'Admin',
            email: 'admin@vaultid.com',
            method: 'Admin Action',
            device: 'Admin Portal',
            fingerprint: 'admin_action',
            ipAddress: '127.0.0.1',
            location: 'Admin Console',
            geolocation: 'Internal',
            riskScore: 0,
            status: 'Success',
            eventType: 'admin',
            details: `User ${user.firstName} ${user.lastName} blocked`
        });
    } else if (action === 'unblock') {
        user.status = 'Active';
        renderUserTable();
        showToast(`✅ ${user.firstName} ${user.lastName} unblocked`, 'success');
    }
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) dialog.remove();
}

// ===== ADMIN DEVICES =====
function renderAdminDevices() {
    if (!DOM.adminDeviceList) return;
    if (AdminState.devices.length === 0) {
        DOM.adminDeviceList.innerHTML = '<p class="text-muted">No devices connected</p>';
        return;
    }
    DOM.adminDeviceList.innerHTML = AdminState.devices.map(device => `
        <div class="admin-device-item">
            <div class="admin-device-header">
                <div>
                    <span class="admin-device-name">
                        <i class="fas fa-${device.type === 'Mobile' ? 'mobile-alt' : 'laptop'}" style="color:#1a237e; margin-right:0.5rem;"></i>
                        ${device.name}
                    </span>
                    <span style="margin-left:0.5rem;">
                        <span class="badge ${device.status === 'Trusted' ? 'badge-success' : device.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">${device.status}</span>
                        <span style="font-size:0.7rem; color:#64748b;">Trust Score: ${device.trustScore}%</span>
                    </span>
                </div>
                <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">${device.fingerprint}</div>
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem; display:flex; gap:1rem; flex-wrap:wrap;">
                <span>IP: ${device.ipAddress}</span>
                <span>Location: ${device.location}</span>
                <span>${device.geolocation}</span>
                <span>First Seen: ${device.firstSeen}</span>
                <span>Last Seen: ${device.lastSeen}</span>
            </div>
            <div class="admin-device-components">
                ${Object.entries(device.components).map(([key, value]) => `<span style="margin-right:0.8rem;"><strong>${key}:</strong> ${value}</span>`).join('')}
            </div>
            <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                ${device.status !== 'Trusted' ? `<button class="btn btn-sm btn-success" onclick="adminTrustDevice(${device.id})">Trust</button>` : ''}
                ${device.status === 'Suspicious' ? `<button class="btn btn-sm btn-warning" style="color:white;" onclick="adminInvestigateDevice(${device.id})">Investigate</button>` : ''}
                <button class="btn btn-sm btn-danger" onclick="adminRemoveDevice(${device.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function adminTrustDevice(deviceId) {
    const device = AdminState.devices.find(d => d.id === deviceId);
    if (device) {
        device.status = 'Trusted';
        device.trustScore = Math.min(device.trustScore + 20, 100);
        renderAdminDevices();
        showToast(`✅ ${device.name} trusted`, 'success');
    }
}

function adminInvestigateDevice(deviceId) {
    const device = AdminState.devices.find(d => d.id === deviceId);
    if (device) {
        showToast(`🔍 Investigating ${device.name}...`, 'info');
        setTimeout(() => {
            if (device.trustScore > 60) device.status = 'Trusted';
            else device.status = 'Untrusted';
            renderAdminDevices();
            showToast(`✅ Investigation complete for ${device.name}`, 'success');
        }, 2000);
    }
}

function adminRemoveDevice(deviceId) {
    const device = AdminState.devices.find(d => d.id === deviceId);
    if (device && confirm(`Are you sure you want to remove ${device.name}?`)) {
        AdminState.devices = AdminState.devices.filter(d => d.id !== deviceId);
        renderAdminDevices();
        showToast(`🚫 ${device.name} removed`, 'warning');
    }
}

// ===== ADMIN ALERTS =====
function renderAdminAlerts() {
    if (!DOM.adminAlertList) return;
    const filter = DOM.adminAlertFilter ? DOM.adminAlertFilter.value : 'all';
    const type = DOM.adminAlertType ? DOM.adminAlertType.value : 'all';
    let filteredAlerts = AdminState.alerts;
    if (filter !== 'all') filteredAlerts = filteredAlerts.filter(a => a.severity === filter);
    if (type !== 'all') filteredAlerts = filteredAlerts.filter(a => a.category === type);
    filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
    const criticalCount = document.getElementById('criticalCount');
    const mediumCount = document.getElementById('mediumCount');
    const lowCount = document.getElementById('lowCount');
    if (criticalCount) criticalCount.textContent = AdminState.alerts.filter(a => a.severity === 'High').length || '0';
    if (mediumCount) mediumCount.textContent = AdminState.alerts.filter(a => a.severity === 'Medium').length || '0';
    if (lowCount) lowCount.textContent = AdminState.alerts.filter(a => a.severity === 'Low').length || '0';
    if (filteredAlerts.length === 0) {
        DOM.adminAlertList.innerHTML = '<p class="text-muted">No alerts found</p>';
        return;
    }
    DOM.adminAlertList.innerHTML = filteredAlerts.map(alert => `
        <div class="admin-alert-item ${!alert.read ? 'unread' : ''}" onclick="viewIncidentDetail(${alert.id})">
            <div class="admin-alert-header">
                <div>
                    <div class="admin-alert-title">
                        <span class="badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">${alert.severity}</span>
                        ${alert.title} ${!alert.read ? '<span class="badge badge-primary">New</span>' : ''}
                    </div>
                    <div class="admin-alert-description">${alert.description}</div>
                </div>
                <div style="font-size:0.75rem; color:#94a3b8; text-align:right;">
                    <div>${getRelativeTime(alert.timestamp)}</div>
                    <div style="font-weight:500; color:#1a237e; margin-top:0.15rem;">${alert.action}</div>
                </div>
            </div>
            <div class="admin-alert-meta">
                <span class="badge badge-primary">${alert.category}</span>
                <span style="font-size:0.75rem; color:#64748b;">User: ${alert.affectedUser}</span>
                <span style="font-size:0.75rem; color:#64748b;">ID: #${alert.id}</span>
            </div>
            <div class="admin-alert-tech">${alert.technicalDetails}</div>
            <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                ${!alert.read ? `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); markAlertRead(${alert.id})">Mark as Read</button>` : ''}
                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); viewIncidentDetail(${alert.id})">View Details</button>
                ${alert.severity === 'High' ? `<button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); escalateAlert(${alert.id})">Escalate</button>` : ''}
            </div>
        </div>
    `).join('');
}

function markAlertRead(alertId) {
    const alert = AdminState.alerts.find(a => a.id === alertId);
    if (alert) { alert.read = true; renderAdminAlerts(); updateAdminAlertBadge(); showToast('Alert marked as read', 'info'); }
}

function escalateAlert(alertId) {
    const alert = AdminState.alerts.find(a => a.id === alertId);
    if (alert) { showToast(`🚨 Alert escalated: ${alert.title}`, 'warning'); alert.read = true; renderAdminAlerts(); updateAdminAlertBadge(); }
}

function updateAdminAlertBadge() {
    if (!DOM.adminAlertBadge) return;
    const unreadCount = AdminState.alerts.filter(a => !a.read).length;
    DOM.adminAlertBadge.textContent = unreadCount;
    DOM.adminAlertBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
}

// ===== AUDIT LOG =====
function renderAuditLog() {
    if (!DOM.auditTableBody) return;
    let filteredLog = [...AdminState.auditLog];
    if (DOM.auditDateFrom && DOM.auditDateFrom.value) {
        const from = new Date(DOM.auditDateFrom.value);
        filteredLog = filteredLog.filter(entry => entry.timestamp >= from);
    }
    if (DOM.auditDateTo && DOM.auditDateTo.value) {
        const to = new Date(DOM.auditDateTo.value);
        to.setHours(23,59,59);
        filteredLog = filteredLog.filter(entry => entry.timestamp <= to);
    }
    if (DOM.auditMethod && DOM.auditMethod.value !== 'all') {
        filteredLog = filteredLog.filter(entry => entry.method === DOM.auditMethod.value);
    }
    if (DOM.auditStatus && DOM.auditStatus.value !== 'all') {
        filteredLog = filteredLog.filter(entry => entry.status === DOM.auditStatus.value);
    }
    filteredLog.sort((a, b) => b.timestamp - a.timestamp);
    if (filteredLog.length === 0) {
        DOM.auditTableBody.innerHTML = '<tr><td colspan="8" style="padding:1.5rem; text-align:center; color:#94a3b8;">No audit records found</td></tr>';
        return;
    }
    DOM.auditTableBody.innerHTML = filteredLog.map(entry => `
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

function exportAuditLog() {
    if (AdminState.auditLog.length === 0) { showToast('No audit data to export', 'warning'); return; }
    const headers = ['Timestamp', 'User', 'Email', 'Method', 'Device', 'Fingerprint', 'IP Address', 'Location', 'Geolocation', 'Risk Score', 'Status', 'Details'];
    const rows = AdminState.auditLog.map(entry => [
        entry.timestamp.toISOString(),
        entry.user,
        entry.email,
        entry.method,
        entry.device,
        entry.fingerprint,
        entry.ipAddress,
        entry.location,
        entry.geolocation,
        entry.riskScore,
        entry.status,
        entry.details || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Audit log exported successfully', 'success');
}

// ===== RISK RESULTS =====
function renderRiskResults() {
    if (!DOM.riskResults) return;
    if (AdminState.riskAssessments.length === 0) {
        DOM.riskResults.innerHTML = '<p class="text-muted">No risk assessments available</p>';
        return;
    }
    DOM.riskResults.innerHTML = AdminState.riskAssessments.map(risk => `
        <div class="risk-result-item ${risk.level.toLowerCase()}">
            <div class="risk-result-header">
                <div>
                    <span class="risk-result-user">${risk.user}</span>
                    <span class="badge ${risk.level === 'High' ? 'badge-danger' : risk.level === 'Medium' ? 'badge-warning' : 'badge-success'}">${risk.level}</span>
                </div>
                <div class="risk-result-score">Risk Score: ${risk.riskScore}% · Model Confidence: ${risk.modelConfidence}%</div>
            </div>
            <div class="risk-result-factors"><strong>Factors:</strong> ${risk.factors.join(', ')}</div>
            <div class="risk-result-recommendation"><strong>Recommendation:</strong> ${risk.recommendation}</div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:0.15rem;">${risk.details}</div>
            <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.15rem;">${getRelativeTime(risk.timestamp)}</div>
            <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                <button class="btn btn-sm btn-primary" onclick="investigateRisk(${risk.id})">Investigate</button>
                <button class="btn btn-sm btn-outline" onclick="dismissRisk(${risk.id})">Dismiss</button>
            </div>
        </div>
    `).join('');
}

function investigateRisk(riskId) {
    const risk = AdminState.riskAssessments.find(r => r.id === riskId);
    if (risk) {
        showToast(`🔍 Investigating ${risk.user}...`, 'info');
        setTimeout(() => showToast(`✅ Risk assessment for ${risk.user} reviewed`, 'success'), 2000);
    }
}

function dismissRisk(riskId) {
    AdminState.riskAssessments = AdminState.riskAssessments.filter(r => r.id !== riskId);
    renderRiskResults();
    showToast('Risk assessment dismissed', 'info');
}

// ===== BLOCKED IPS =====
function renderBlockedIPs() {
    const container = DOM.blockedIPs;
    if (!container) return;
    if (AdminState.blockedAttempts.length === 0) {
        container.innerHTML = '<p class="text-muted">No blocked IPs</p>';
        return;
    }
    container.innerHTML = AdminState.blockedAttempts.map(block => `
        <div class="blocked-ip-item">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <div>
                    <span style="font-family:monospace; font-weight:600;">${block.ip}</span>
                    <span style="font-size:0.75rem; color:#64748b; margin-left:0.5rem;">${block.reason}</span>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                    <span style="font-size:0.75rem; color:#94a3b8;">${block.attempts} attempts</span>
                    <span style="font-size:0.7rem; color:#94a3b8;">${getRelativeTime(block.timestamp)}</span>
                    <button class="btn btn-sm btn-success" onclick="unblockIP('${block.ip}')">Unblock</button>
                </div>
            </div>
        </div>
    `).join('');
}

function unblockIP(ip) {
    AdminState.blockedAttempts = AdminState.blockedAttempts.filter(b => b.ip !== ip);
    renderBlockedIPs();
    showToast(`✅ IP ${ip} unblocked`, 'success');
}

// ===== CHARTS =====
function initializeCharts() {
    // Authentication Methods Chart – all zeros
    const authCtx = document.getElementById('authMethodChart');
    if (authCtx) {
        new Chart(authCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passkey', 'OTP', 'Biometric', 'QR Code'],
                datasets: [{ data: [0,0,0,0], backgroundColor: ['#1a237e', '#f59e0b', '#22c55e', '#8b5cf6'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { padding: 6, font: { size: 9 }, boxWidth: 10, usePointStyle: true } } },
                cutout: '65%'
            }
        });
    }
    // Risk Distribution Chart – all zeros
    const riskCtx = document.getElementById('riskDistributionChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{ data: [0,0,0], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { padding: 6, font: { size: 9 }, boxWidth: 10, usePointStyle: true } } },
                cutout: '65%'
            }
        });
    }
    // Authentication Trends – all zeros
    const trendCtx = document.getElementById('authTrendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    { label: 'Passkey', data: [0,0,0,0,0,0,0], borderColor: '#1a237e', backgroundColor: 'rgba(26,35,126,0.1)', tension: 0.4, fill: true, pointRadius: 2 },
                    { label: 'OTP', data: [0,0,0,0,0,0,0], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: true, pointRadius: 2 },
                    { label: 'Biometric', data: [0,0,0,0,0,0,0], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', tension: 0.4, fill: true, pointRadius: 2 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 8 }, boxWidth: 10, padding: 4, usePointStyle: true } } },
                scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 8 }, maxTicksLimit: 5 } }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } }
            }
        });
    }
    // Geolocation – all zeros
    const geoCtx = document.getElementById('geoChart');
    if (geoCtx) {
        new Chart(geoCtx, {
            type: 'bar',
            data: {
                labels: ['US', 'UK', 'BR', 'CA', 'AU'],
                datasets: [{ label: 'Logins', data: [0,0,0,0,0], backgroundColor: ['#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb'], borderRadius: 4 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 8 }, maxTicksLimit: 4 } }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } },
                barPercentage: 0.6
            }
        });
    }
}

// ===== HELPER FUNCTIONS =====
function getSeverityColor(severity) {
    const colors = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };
    return colors[severity] || '#64748b';
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

// ===== TAB MANAGEMENT =====
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    const titles = {
        tabOverview: 'Overview',
        tabUsers: 'Users',
        tabDevices: 'Devices',
        tabSecurity: 'Security',
        tabAudit: 'Audit Log',
        tabRisk: 'Risk Engine',
        tabAnalytics: 'Analytics'
    };
    document.getElementById('adminPageTitle').textContent = titles[tabId] || 'Overview';
    AdminState.currentTab = tabId;
    switch(tabId) {
        case 'tabUsers': renderUserTable(); break;
        case 'tabDevices': renderAdminDevices(); break;
        case 'tabSecurity': renderAdminAlerts(); break;
        case 'tabAudit': renderAuditLog(); break;
        case 'tabRisk': renderRiskResults(); renderBlockedIPs(); break;
        case 'tabAnalytics': break;
        case 'tabOverview': break;
        default: break;
    }
}

// ===== WEBSOCKET SIMULATION (disabled) =====
function startAdminWebSocketSimulation() {
    // No automatic data generation – template mode
}

// ===== EVENT LISTENERS =====
function setupAdminEventListeners() {
    DOM.adminLoginBtn.addEventListener('click', handleAdminLogin);
    DOM.adminEmail.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdminLogin(); });
    DOM.adminPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdminLogin(); });
    DOM.adminLogoutBtn.addEventListener('click', adminLogout);
    if (DOM.userSearch) DOM.userSearch.addEventListener('input', renderUserTable);
    if (DOM.userFilter) DOM.userFilter.addEventListener('change', renderUserTable);
    if (DOM.adminAlertFilter) DOM.adminAlertFilter.addEventListener('change', renderAdminAlerts);
    if (DOM.adminAlertType) DOM.adminAlertType.addEventListener('change', renderAdminAlerts);
    ['auditDateFrom', 'auditDateTo', 'auditMethod', 'auditStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', renderAuditLog);
    });
    if (DOM.exportAuditLog) DOM.exportAuditLog.addEventListener('click', exportAuditLog);
    DOM.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
}

// ===== INITIALIZATION =====
function init() {
    setupAdminEventListeners();
    showPage(DOM.adminLogin);
    showToast('🔐 Welcome to VaultID Admin Portal', 'info');
    setTimeout(() => {
        showToast('💡 Use admin@vaultid.com / Admin@2026 to login', 'info');
    }, 1000);
    startAdminWebSocketSimulation();
    console.log('VaultID Admin Portal initialized (Template Mode)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===== EXPOSE FUNCTIONS =====
window.showToast = showToast;
window.adminLogout = adminLogout;
window.viewIncidentDetail = viewIncidentDetail;
window.handleIncidentAction = handleIncidentAction;
window.viewUserDetail = viewUserDetail;
window.userAction = userAction;
window.adminTrustDevice = adminTrustDevice;
window.adminInvestigateDevice = adminInvestigateDevice;
window.adminRemoveDevice = adminRemoveDevice;
window.markAlertRead = markAlertRead;
window.escalateAlert = escalateAlert;
window.investigateRisk = investigateRisk;
window.dismissRisk = dismissRisk;
window.unblockIP = unblockIP;
window.switchTab = switchTab;