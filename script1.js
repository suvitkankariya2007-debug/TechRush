/**
 * VaultID - Admin Portal
 * Complete Admin Dashboard with Full Content
 */

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
};

// ===== MOCK DATA =====
function initializeAdminData() {
    AdminState.users = [
        {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            deviceFingerprint: 'fp_a1b2c3d4e5f6g7h8',
            trustScore: 92,
            status: 'Active',
            lastLogin: new Date(Date.now() - 60000),
            riskLevel: 'Low',
            ipAddress: '192.168.1.1',
            location: 'New York, US',
            geolocation: '40.7128° N, 74.0060° W',
        },
        {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            deviceFingerprint: 'fp_i9j0k1l2m3n4o5p6',
            trustScore: 78,
            status: 'Suspicious',
            lastLogin: new Date(Date.now() - 3600000),
            riskLevel: 'Medium',
            ipAddress: '189.12.34.56',
            location: 'São Paulo, BR',
            geolocation: '23.5505° S, 46.6333° W',
        },
        {
            id: 3,
            firstName: 'Robert',
            lastName: 'Johnson',
            email: 'robert.j@example.com',
            deviceFingerprint: 'fp_q7r8s9t0u1v2w3x4',
            trustScore: 45,
            status: 'Blocked',
            lastLogin: new Date(Date.now() - 86400000),
            riskLevel: 'High',
            ipAddress: '45.67.89.10',
            location: 'Unknown',
            geolocation: 'Unknown',
        },
        {
            id: 4,
            firstName: 'Sarah',
            lastName: 'Williams',
            email: 'sarah.w@example.com',
            deviceFingerprint: 'fp_y5z6a7b8c9d0e1f2',
            trustScore: 95,
            status: 'Active',
            lastLogin: new Date(Date.now() - 1800000),
            riskLevel: 'Low',
            ipAddress: '10.0.0.5',
            location: 'San Francisco, US',
            geolocation: '37.7749° N, 122.4194° W',
        },
        {
            id: 5,
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael.b@example.com',
            deviceFingerprint: 'fp_z6a7b8c9d0e1f2g3',
            trustScore: 67,
            status: 'Suspicious',
            lastLogin: new Date(Date.now() - 7200000),
            riskLevel: 'Medium',
            ipAddress: '87.65.43.21',
            location: 'London, UK',
            geolocation: '51.5074° N, 0.1278° W',
        },
        {
            id: 6,
            firstName: 'Emily',
            lastName: 'Davis',
            email: 'emily.d@example.com',
            deviceFingerprint: 'fp_h4i5j6k7l8m9n0o1',
            trustScore: 88,
            status: 'Active',
            lastLogin: new Date(Date.now() - 14400000),
            riskLevel: 'Low',
            ipAddress: '172.16.0.1',
            location: 'Toronto, CA',
            geolocation: '43.6532° N, 79.3832° W',
        },
    ];

    AdminState.devices = [
        {
            id: 1,
            name: 'Chrome on Windows 11',
            type: 'Desktop',
            fingerprint: 'fp_a1b2c3d4e5f6g7h8',
            components: {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                screen: '1920x1080',
                colorDepth: '24-bit',
                canvasHash: '7f3a9b2c4d8e1f5a',
                webgl: 'ANGLE (NVIDIA GeForce RTX 3080)',
                audioContext: '44100Hz',
                timezone: 'America/New_York',
                language: 'en-US',
                platform: 'Win32',
            },
            trustScore: 92,
            firstSeen: '2026-01-15',
            lastSeen: '2026-08-05',
            location: 'New York, US',
            ipAddress: '192.168.1.1',
            geolocation: '40.7128° N, 74.0060° W',
            status: 'Trusted',
        },
        {
            id: 2,
            name: 'Safari on iPhone 15 Pro',
            type: 'Mobile',
            fingerprint: 'fp_i9j0k1l2m3n4o5p6',
            components: {
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                screen: '1179x2556',
                colorDepth: '24-bit',
                canvasHash: 'b8c7d3e2f1a4b5c6',
                webgl: 'Apple GPU',
                audioContext: '48000Hz',
                timezone: 'America/New_York',
                language: 'en-US',
                platform: 'iPhone',
            },
            trustScore: 78,
            firstSeen: '2026-07-20',
            lastSeen: '2026-08-04',
            location: 'New York, US',
            ipAddress: '192.168.1.10',
            geolocation: '40.7128° N, 74.0060° W',
            status: 'Suspicious',
        },
        {
            id: 3,
            name: 'Firefox on MacOS Sonoma',
            type: 'Desktop',
            fingerprint: 'fp_q7r8s9t0u1v2w3x4',
            components: {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/121.0',
                screen: '2560x1440',
                colorDepth: '24-bit',
                canvasHash: 'd4e5f6a7b8c9d0e1',
                webgl: 'AMD Radeon Pro 5700',
                audioContext: '44100Hz',
                timezone: 'America/Los_Angeles',
                language: 'en-US',
                platform: 'MacIntel',
            },
            trustScore: 45,
            firstSeen: '2026-08-01',
            lastSeen: '2026-08-03',
            location: 'San Francisco, US',
            ipAddress: '10.0.0.15',
            geolocation: '37.7749° N, 122.4194° W',
            status: 'Untrusted',
        },
        {
            id: 4,
            name: 'Edge on Windows 10',
            type: 'Desktop',
            fingerprint: 'fp_r5s6t7u8v9w0x1y2',
            components: {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/120.0.0.0',
                screen: '1920x1080',
                colorDepth: '24-bit',
                canvasHash: 'e5f6g7h8i9j0k1l2',
                webgl: 'ANGLE (Intel UHD Graphics 630)',
                audioContext: '48000Hz',
                timezone: 'Europe/London',
                language: 'en-GB',
                platform: 'Win32',
            },
            trustScore: 67,
            firstSeen: '2026-07-28',
            lastSeen: '2026-08-02',
            location: 'London, UK',
            ipAddress: '87.65.43.21',
            geolocation: '51.5074° N, 0.1278° W',
            status: 'Suspicious',
        },
    ];

    AdminState.auditLog = [
        {
            timestamp: new Date(Date.now() - 60000),
            user: 'John Doe',
            email: 'john.doe@example.com',
            method: 'Passkey',
            device: 'Chrome on Windows 11',
            fingerprint: 'fp_a1b2c3d4e5f6g7h8',
            ipAddress: '192.168.1.1',
            location: 'New York, US',
            geolocation: '40.7128° N, 74.0060° W',
            riskScore: 12,
            status: 'Success',
            eventType: 'authentication',
        },
        {
            timestamp: new Date(Date.now() - 1800000),
            user: 'Sarah Williams',
            email: 'sarah.w@example.com',
            method: 'Biometric',
            device: 'iPhone 15 Pro',
            fingerprint: 'fp_i9j0k1l2m3n4o5p6',
            ipAddress: '192.168.1.10',
            location: 'New York, US',
            geolocation: '40.7128° N, 74.0060° W',
            riskScore: 8,
            status: 'Success',
            eventType: 'authentication',
        },
        {
            timestamp: new Date(Date.now() - 3600000),
            user: 'Jane Smith',
            email: 'jane.smith@example.com',
            method: 'OTP',
            device: 'Safari on iPhone',
            fingerprint: 'fp_y5z6a7b8c9d0e1f2',
            ipAddress: '189.12.34.56',
            location: 'São Paulo, BR',
            geolocation: '23.5505° S, 46.6333° W',
            riskScore: 68,
            status: 'Failed',
            eventType: 'authentication',
        },
        {
            timestamp: new Date(Date.now() - 7200000),
            user: 'Robert Johnson',
            email: 'robert.j@example.com',
            method: 'Passkey',
            device: 'Firefox on MacOS',
            fingerprint: 'fp_q7r8s9t0u1v2w3x4',
            ipAddress: '45.67.89.10',
            location: 'Unknown',
            geolocation: 'Unknown',
            riskScore: 89,
            status: 'Failed',
            eventType: 'authentication',
        },
        {
            timestamp: new Date(Date.now() - 14400000),
            user: 'Emily Davis',
            email: 'emily.d@example.com',
            method: 'QR Code',
            device: 'Edge on Windows 10',
            fingerprint: 'fp_r5s6t7u8v9w0x1y2',
            ipAddress: '172.16.0.1',
            location: 'Toronto, CA',
            geolocation: '43.6532° N, 79.3832° W',
            riskScore: 15,
            status: 'Success',
            eventType: 'authentication',
        },
        {
            timestamp: new Date(Date.now() - 86400000),
            user: 'Michael Brown',
            email: 'michael.b@example.com',
            method: 'OTP',
            device: 'Edge on Windows 10',
            fingerprint: 'fp_r5s6t7u8v9w0x1y2',
            ipAddress: '87.65.43.21',
            location: 'London, UK',
            geolocation: '51.5074° N, 0.1278° W',
            riskScore: 45,
            status: 'Success',
            eventType: 'authentication',
        },
    ];

    AdminState.riskAssessments = [
        {
            id: 1,
            user: 'Jane Smith',
            email: 'jane.smith@example.com',
            timestamp: new Date(Date.now() - 120000),
            riskScore: 68,
            level: 'Medium',
            factors: ['Location Anomaly', 'New Device', 'Time Mismatch'],
            recommendation: 'Require additional verification (2FA)',
            modelConfidence: 87,
        },
        {
            id: 2,
            user: 'Robert Johnson',
            email: 'robert.j@example.com',
            timestamp: new Date(Date.now() - 1800000),
            riskScore: 89,
            level: 'High',
            factors: ['Device Fingerprint Mismatch', 'Location Unknown', 'Suspicious Pattern', 'Multiple Failed Attempts'],
            recommendation: 'Block access and notify user immediately',
            modelConfidence: 94,
        },
        {
            id: 3,
            user: 'Sarah Williams',
            email: 'sarah.w@example.com',
            timestamp: new Date(Date.now() - 3600000),
            riskScore: 8,
            level: 'Low',
            factors: ['Trusted Device', 'Familiar Location', 'Normal Pattern'],
            recommendation: 'Allow access without restrictions',
            modelConfidence: 96,
        },
        {
            id: 4,
            user: 'Michael Brown',
            email: 'michael.b@example.com',
            timestamp: new Date(Date.now() - 7200000),
            riskScore: 45,
            level: 'Medium',
            factors: ['New Device', 'Unusual Location', 'Different Browser'],
            recommendation: 'Monitor activity and require periodic verification',
            modelConfidence: 82,
        },
    ];

    AdminState.alerts = [
        {
            id: 1,
            severity: 'High',
            title: 'Suspicious Login Attempt from Unknown Location',
            description: 'User Robert Johnson attempted login from unknown IP address (45.67.89.10)',
            timestamp: new Date(Date.now() - 120000),
            read: false,
            category: 'auth',
            affectedUser: 'Robert Johnson',
            technicalDetails: 'IP Geolocation: Unknown | Device Fingerprint: fp_q7r8s9t0u1v2w3x4 | Risk Score: 89 | Model: Isolation Forest',
            action: 'Blocked access and notified user',
        },
        {
            id: 2,
            severity: 'Medium',
            title: 'Unusual Login Pattern Detected',
            description: 'Jane Smith logged in from Brazil while device was in US',
            timestamp: new Date(Date.now() - 1800000),
            read: false,
            category: 'location',
            affectedUser: 'Jane Smith',
            technicalDetails: 'Expected: US (New York) | Actual: BR (São Paulo) | Timezone Mismatch: -3 hours | Risk Score: 68',
            action: 'Additional verification required',
        },
        {
            id: 3,
            severity: 'Low',
            title: 'New Device Enrolled',
            description: 'New device Firefox on MacOS added to account',
            timestamp: new Date(Date.now() - 3600000),
            read: true,
            category: 'device',
            affectedUser: 'Robert Johnson',
            technicalDetails: 'Device: Firefox 121.0 | OS: MacOS Sonoma | Canvas Hash: d4e5f6a7b8c9d0e1 | Trust Score: 45',
            action: 'Device added to monitoring list',
        },
        {
            id: 4,
            severity: 'High',
            title: 'Multiple Failed Login Attempts',
            description: '6 failed login attempts detected for John Doe account',
            timestamp: new Date(Date.now() - 5400000),
            read: false,
            category: 'auth',
            affectedUser: 'John Doe',
            technicalDetails: 'Attempts: 6 | IPs: 192.168.1.1, 10.0.0.5 | Pattern: Brute Force | Risk Score: 92',
            action: 'Account temporarily locked for 30 minutes',
        },
        {
            id: 5,
            severity: 'Medium',
            title: 'Behavioral Anomaly Detected',
            description: 'Unusual transaction pattern detected for Emily Davis',
            timestamp: new Date(Date.now() - 10800000),
            read: false,
            category: 'behavior',
            affectedUser: 'Emily Davis',
            technicalDetails: 'Transaction Amount: $5,000 | Location: Toronto, CA | Device: Edge on Windows 10 | Risk Score: 65',
            action: 'Transaction flagged for review',
        },
    ];
}

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
        showToast('❌ Invalid credentials', 'error');
    }
}

// ===== SESSION MANAGEMENT =====
function startAdminSessionTimer() {
    if (AdminState.sessionTimer) {
        clearInterval(AdminState.sessionTimer);
    }
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
    if (AdminState.sessionTimer) {
        clearInterval(AdminState.sessionTimer);
    }
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
    updateAdminAlertBadge();
    initializeCharts();
}

// ===== RECENT INCIDENTS =====
function renderRecentIncidents() {
    if (!DOM.recentIncidents) return;
    
    const incidents = AdminState.alerts
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

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
        filteredUsers = filteredUsers.filter(u => 
            u.status.toLowerCase() === filter.toLowerCase()
        );
    }

    DOM.userTableBody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td><strong>${user.firstName} ${user.lastName}</strong></td>
            <td style="font-size:0.8rem;">${user.email}</td>
            <td style="font-family:monospace; font-size:0.7rem; color:#64748b;">${user.deviceFingerprint}</td>
            <td>
                <span class="badge ${user.trustScore >= 80 ? 'badge-success' : user.trustScore >= 50 ? 'badge-warning' : 'badge-danger'}">
                    ${user.trustScore}%
                </span>
            </td>
            <td>
                <span class="badge ${user.status === 'Active' ? 'badge-success' : user.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">
                    ${user.status}
                </span>
            </td>
            <td style="font-size:0.75rem; color:#64748b;">${user.lastLogin.toLocaleString()}</td>
        </tr>
    `).join('');
}

// ===== ADMIN DEVICES =====
function renderAdminDevices() {
    if (!DOM.adminDeviceList) return;

    DOM.adminDeviceList.innerHTML = AdminState.devices.map(device => `
        <div class="admin-device-item">
            <div class="admin-device-header">
                <div>
                    <span class="admin-device-name">
                        <i class="fas fa-${device.type === 'Mobile' ? 'mobile-alt' : 'laptop'}" style="color:#1a237e; margin-right:0.5rem;"></i>
                        ${device.name}
                    </span>
                    <span style="margin-left:0.5rem;">
                        <span class="badge ${device.status === 'Trusted' ? 'badge-success' : device.status === 'Suspicious' ? 'badge-warning' : 'badge-danger'}">
                            ${device.status}
                        </span>
                        Trust Score: ${device.trustScore}%
                    </span>
                </div>
                <div style="font-size:0.7rem; color:#64748b; font-family:monospace;">
                    ${device.fingerprint}
                </div>
            </div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem; display:flex; gap:1rem; flex-wrap:wrap;">
                <span>IP: ${device.ipAddress}</span>
                <span>Location: ${device.location}</span>
                <span>${device.geolocation}</span>
                <span>First Seen: ${device.firstSeen}</span>
                <span>Last Seen: ${device.lastSeen}</span>
            </div>
            <div class="admin-device-components">
                ${Object.entries(device.components).map(([key, value]) => 
                    `<span style="margin-right:0.8rem;"><strong>${key}:</strong> ${value}</span>`
                ).join('')}
            </div>
        </div>
    `).join('');
}

// ===== ADMIN ALERTS =====
function renderAdminAlerts() {
    if (!DOM.adminAlertList) return;

    const filter = DOM.adminAlertFilter ? DOM.adminAlertFilter.value : 'all';
    const type = DOM.adminAlertType ? DOM.adminAlertType.value : 'all';

    let filteredAlerts = AdminState.alerts;

    if (filter !== 'all') {
        filteredAlerts = filteredAlerts.filter(a => a.severity === filter);
    }

    if (type !== 'all') {
        filteredAlerts = filteredAlerts.filter(a => a.category === type);
    }

    filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);

    DOM.adminAlertList.innerHTML = filteredAlerts.map(alert => `
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
                <span class="badge badge-primary">${alert.category}</span>
                <span style="font-size:0.75rem; color:#64748b;">User: ${alert.affectedUser}</span>
                <span style="font-size:0.75rem; color:#64748b;">ID: #${alert.id}</span>
            </div>
            <div class="admin-alert-tech">${alert.technicalDetails}</div>
        </div>
    `).join('');
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
        to.setHours(23, 59, 59);
        filteredLog = filteredLog.filter(entry => entry.timestamp <= to);
    }

    if (DOM.auditMethod && DOM.auditMethod.value !== 'all') {
        filteredLog = filteredLog.filter(entry => entry.method === DOM.auditMethod.value);
    }

    if (DOM.auditStatus && DOM.auditStatus.value !== 'all') {
        filteredLog = filteredLog.filter(entry => entry.status === DOM.auditStatus.value);
    }

    filteredLog.sort((a, b) => b.timestamp - a.timestamp);

    DOM.auditTableBody.innerHTML = filteredLog.map(entry => `
        <tr>
            <td style="font-size:0.75rem;">${entry.timestamp.toLocaleString()}</td>
            <td style="font-size:0.8rem;">${entry.user}</td>
            <td><span class="badge badge-primary">${entry.method}</span></td>
            <td style="font-size:0.75rem; color:#64748b;">${entry.device}</td>
            <td style="font-family:monospace; font-size:0.7rem; color:#64748b;">${entry.ipAddress}</td>
            <td style="font-size:0.75rem; color:#64748b;">${entry.location}</td>
            <td>
                <span class="badge ${entry.riskScore < 30 ? 'badge-success' : entry.riskScore < 60 ? 'badge-warning' : 'badge-danger'}">
                    ${entry.riskScore}%
                </span>
            </td>
            <td>
                <span class="badge ${entry.status === 'Success' ? 'badge-success' : 'badge-danger'}">
                    ${entry.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// ===== RISK RESULTS =====
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
                <div class="risk-result-score">Risk Score: ${risk.riskScore}% · Model Confidence: ${risk.modelConfidence}%</div>
            </div>
            <div class="risk-result-factors"><strong>Factors:</strong> ${risk.factors.join(', ')}</div>
            <div class="risk-result-recommendation"><strong>Recommendation:</strong> ${risk.recommendation}</div>
            <div style="font-size:0.7rem; color:#94a3b8; margin-top:0.15rem;">${getRelativeTime(risk.timestamp)}</div>
        </div>
    `).join('');
}

// ===== CHARTS =====
function initializeCharts() {
    // Authentication Methods Chart
    const authCtx = document.getElementById('authMethodChart');
    if (authCtx) {
        new Chart(authCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passkey', 'OTP', 'Biometric', 'QR Code'],
                datasets: [{
                    data: [120, 45, 30, 15],
                    backgroundColor: ['#1a237e', '#f59e0b', '#22c55e', '#8b5cf6'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 6,
                            font: { size: 9 },
                            boxWidth: 10,
                            usePointStyle: true,
                        }
                    }
                },
                cutout: '65%',
            }
        });
    }

    // Risk Distribution Chart
    const riskCtx = document.getElementById('riskDistributionChart');
    if (riskCtx) {
        new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [180, 45, 15],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 6,
                            font: { size: 9 },
                            boxWidth: 10,
                            usePointStyle: true,
                        }
                    }
                },
                cutout: '65%',
            }
        });
    }

    // Authentication Trends Chart
    const trendCtx = document.getElementById('authTrendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Passkey',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26, 35, 126, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2,
                }, {
                    label: 'OTP',
                    data: [28, 48, 40, 19, 86, 27, 90],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 8 },
                            boxWidth: 10,
                            padding: 4,
                            usePointStyle: true,
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { font: { size: 8 }, maxTicksLimit: 5 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 8 } }
                    }
                }
            }
        });
    }

    // Geolocation Chart
    const geoCtx = document.getElementById('geoChart');
    if (geoCtx) {
        new Chart(geoCtx, {
            type: 'bar',
            data: {
                labels: ['US', 'UK', 'BR', 'CA', 'AU'],
                datasets: [{
                    label: 'Logins',
                    data: [450, 120, 80, 65, 40],
                    backgroundColor: ['#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb'],
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false },
                        ticks: { font: { size: 8 }, maxTicksLimit: 4 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 8 } }
                    }
                },
                barPercentage: 0.6,
            }
        });
    }
}

// ===== HELPER FUNCTIONS =====
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

// ===== EXPORT AUDIT LOG =====
function exportAuditLog() {
    if (AdminState.auditLog.length === 0) {
        showToast('No audit data to export', 'warning');
        return;
    }

    const headers = ['Timestamp', 'User', 'Email', 'Method', 'Device', 'Fingerprint', 'IP Address', 'Location', 'Geolocation', 'Risk Score', 'Status'];
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
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

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

// ===== TAB MANAGEMENT =====
function switchTab(tabId) {
    DOM.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    DOM.tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === tabId);
    });

    const tabNames = {
        tabOverview: 'Overview',
        tabUsers: 'Users',
        tabDevices: 'Devices',
        tabSecurity: 'Security',
        tabAudit: 'Audit Log',
        tabRisk: 'Risk Engine',
        tabAnalytics: 'Analytics'
    };
    DOM.adminPageTitle.textContent = tabNames[tabId] || 'Overview';

    AdminState.currentTab = tabId;

    switch (tabId) {
        case 'tabUsers':
            renderUserTable();
            break;
        case 'tabDevices':
            renderAdminDevices();
            break;
        case 'tabSecurity':
            renderAdminAlerts();
            break;
        case 'tabAudit':
            renderAuditLog();
            break;
        case 'tabRisk':
            renderRiskResults();
            break;
    }
}

// ===== EVENT LISTENERS =====

// Admin Login
DOM.adminLoginBtn.addEventListener('click', handleAdminLogin);
DOM.adminEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
});
DOM.adminPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
});

// Admin Logout
DOM.adminLogoutBtn.addEventListener('click', adminLogout);

// User filters
if (DOM.userSearch) {
    DOM.userSearch.addEventListener('input', renderUserTable);
}
if (DOM.userFilter) {
    DOM.userFilter.addEventListener('change', renderUserTable);
}

// Alert filters
if (DOM.adminAlertFilter) {
    DOM.adminAlertFilter.addEventListener('change', renderAdminAlerts);
}
if (DOM.adminAlertType) {
    DOM.adminAlertType.addEventListener('change', renderAdminAlerts);
}

// Audit filters
['auditDateFrom', 'auditDateTo', 'auditMethod', 'auditStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', renderAuditLog);
    }
});

// Export audit log
if (DOM.exportAuditLog) {
    DOM.exportAuditLog.addEventListener('click', exportAuditLog);
}

// Tab switching
DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// ===== WEBSOCKET SIMULATION =====
function startAdminWebSocketSimulation() {
    setInterval(() => {
        if (!AdminState.isAuthenticated) return;

        if (Math.random() < 0.12) {
            const severities = ['High', 'Medium', 'Low'];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const categories = ['auth', 'device', 'location', 'behavior'];
            const users = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 'Michael Brown', 'Emily Davis'];
            const titles = {
                High: 'Critical Security Breach Attempt',
                Medium: 'Suspicious Activity Detected',
                Low: 'New Device Registration'
            };
            
            const newAlert = {
                id: AdminState.alerts.length + 1,
                severity: severity,
                title: titles[severity],
                description: `Security alert generated by AI risk engine at ${new Date().toLocaleTimeString()}`,
                timestamp: new Date(),
                read: false,
                category: categories[Math.floor(Math.random() * categories.length)],
                affectedUser: users[Math.floor(Math.random() * users.length)],
                technicalDetails: `Risk Score: ${Math.floor(60 + Math.random() * 35)}% · Model: Isolation Forest · Anomaly Score: ${(Math.random() * 0.5 + 0.5).toFixed(2)} · Confidence: ${Math.floor(80 + Math.random() * 15)}%`,
                action: severity === 'High' ? 'Immediate block required' : 'Monitor and investigate',
            };

            AdminState.alerts.unshift(newAlert);
            
            if (AdminState.currentTab === 'tabSecurity' || AdminState.currentTab === 'tabOverview') {
                renderAdminAlerts();
                renderRecentIncidents();
            }
            updateAdminAlertBadge();
            
            const icon = severity === 'High' ? 'error' : severity === 'Medium' ? 'warning' : 'info';
            showToast(`🔔 ${severity.toLowerCase()} priority security alert`, icon);
        }

        if (Math.random() < 0.08) {
            const methods = ['Passkey', 'OTP', 'Biometric', 'QR Code'];
            const statuses = ['Success', 'Failed'];
            const users = AdminState.users;
            const user = users[Math.floor(Math.random() * users.length)];
            const devices = ['Chrome on Windows', 'Safari on iPhone', 'Firefox on MacOS', 'Edge on Windows 10', 'Brave on Linux'];
            
            const newEntry = {
                timestamp: new Date(),
                user: `${user.firstName} ${user.lastName}`,
                email: user.email,
                method: methods[Math.floor(Math.random() * methods.length)],
                device: devices[Math.floor(Math.random() * devices.length)],
                fingerprint: user.deviceFingerprint,
                ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                location: ['New York, US', 'San Francisco, US', 'London, UK', 'Tokyo, JP', 'Toronto, CA', 'Sydney, AU'][Math.floor(Math.random() * 6)],
                geolocation: ['40.7128° N, 74.0060° W', '37.7749° N, 122.4194° W', '51.5074° N, 0.1278° W', '35.6762° N, 139.6503° E', '43.6532° N, 79.3832° W', '33.8688° S, 151.2093° E'][Math.floor(Math.random() * 6)],
                riskScore: Math.floor(Math.random() * 40) + 10,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                eventType: 'authentication',
            };

            AdminState.auditLog.unshift(newEntry);
            
            if (AdminState.currentTab === 'tabAudit') {
                renderAuditLog();
            }
        }
    }, 15000);
}

// ===== INITIALIZATION =====
function init() {
    initializeAdminData();
    showPage(DOM.adminLogin);
    showToast('🔐 Welcome to VaultID Admin Portal', 'info');
    
    setTimeout(() => {
        showToast('💡 Use admin@vaultid.com / Admin@2026 to login', 'info');
    }, 1000);

    startAdminWebSocketSimulation();

    console.log('VaultID Admin Portal initialized');
}

// Start application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===== EXPOSE FUNCTIONS =====
window.showToast = showToast;
window.adminLogout = adminLogout;