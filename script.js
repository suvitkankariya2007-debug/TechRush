/**
 * VaultID - User Portal
 * Complete Frontend Application
 */

// ===== CONFIGURATION =====
const CONFIG = {
    USE_MOCK: true,
    DEMO_EMAIL: 'demo@vaultid.com',
    SESSION_DURATION: 15 * 60 * 1000,
    TOAST_DURATION: 4000,
    OTP_LENGTH: 6,
    OTP_RESEND_TIMEOUT: 60,
    MAX_OTP_ATTEMPTS: 3,
};

// ===== STATE MANAGEMENT =====
const State = {
    user: { 
        email: CONFIG.DEMO_EMAIL, 
        firstName: 'John', 
        lastName: 'Doe',
        accounts: [
            { name: 'Checking Account', balance: 12845.32, number: '4829', type: 'primary' },
            { name: 'Savings Account', balance: 47230.18, number: '7356', type: 'savings' },
            { name: 'Investment Account', balance: 23456.78, number: '9123', type: 'investment' },
        ]
    },
    accessToken: 'mock_jwt_token_' + Date.now(),
    refreshToken: 'mock_refresh_token',
    sessionExpiry: Date.now() + CONFIG.SESSION_DURATION,
    otpAttempts: 0,
    otpCode: '123456',
    otpTimer: null,
    sessionTimer: null,
    alerts: [],
    devices: [],
    activity: [],
    currentTab: 'overview',
};

// ===== MOCK DATA =====
function initializeMockData() {
    State.alerts = [
        {
            id: 1,
            severity: 'High',
            title: 'New Device Detected',
            description: 'A new device was used to access your account. Was this you?',
            timestamp: Date.now() - 120000,
            read: false,
        },
        {
            id: 2,
            severity: 'Medium',
            title: 'Unusual Login Time',
            description: 'We noticed a login outside your normal hours',
            timestamp: Date.now() - 3600000,
            read: false,
        },
        {
            id: 3,
            severity: 'Low',
            title: 'Passkey Added',
            description: 'A new passkey was added to your account',
            timestamp: Date.now() - 7200000,
            read: true,
        },
        {
            id: 4,
            severity: 'High',
            title: 'Suspicious Transaction',
            description: 'A large transaction was attempted from a new location',
            timestamp: Date.now() - 10800000,
            read: false,
        },
    ];

    State.devices = [
        {
            name: 'iPhone 15 Pro',
            type: 'mobile',
            trusted: true,
            current: true,
            lastUsed: Date.now() - 300000,
            location: 'New York, US',
            os: 'iOS 17',
            browser: 'Safari',
        },
        {
            name: 'MacBook Pro',
            type: 'laptop',
            trusted: true,
            current: false,
            lastUsed: Date.now() - 86400000,
            location: 'New York, US',
            os: 'macOS Sonoma',
            browser: 'Chrome',
        },
        {
            name: 'iPad Air',
            type: 'tablet',
            trusted: false,
            current: false,
            lastUsed: Date.now() - 172800000,
            location: 'San Francisco, US',
            os: 'iPadOS 17',
            browser: 'Safari',
        },
        {
            name: 'Samsung Galaxy S24',
            type: 'mobile',
            trusted: false,
            current: false,
            lastUsed: Date.now() - 259200000,
            location: 'London, UK',
            os: 'Android 14',
            browser: 'Chrome',
        },
    ];

    State.activity = [
        {
            date: new Date(Date.now() - 60000),
            action: 'Logged in with Passkey',
            device: 'iPhone 15 Pro',
            status: 'Success',
            amount: null,
        },
        {
            date: new Date(Date.now() - 1800000),
            action: 'Transferred $500.00',
            device: 'MacBook Pro',
            status: 'Success',
            amount: 500.00,
        },
        {
            date: new Date(Date.now() - 7200000),
            action: 'Received $1,200.00',
            device: 'iPhone 15 Pro',
            status: 'Success',
            amount: 1200.00,
        },
        {
            date: new Date(Date.now() - 86400000),
            action: 'Logged in with Passkey',
            device: 'MacBook Pro',
            status: 'Success',
            amount: null,
        },
        {
            date: new Date(Date.now() - 172800000),
            action: 'Paid $2,450.00',
            device: 'iPhone 15 Pro',
            status: 'Success',
            amount: 2450.00,
        },
        {
            date: new Date(Date.now() - 259200000),
            action: 'Logged in with OTP',
            device: 'iPad Air',
            status: 'Failed',
            amount: null,
        },
    ];
}

// ===== DOM REFERENCES =====
const DOM = {
    pageLogin: document.getElementById('page-login'),
    pageRegister: document.getElementById('page-register'),
    pageDashboard: document.getElementById('page-dashboard'),

    loginEmail: document.getElementById('loginEmail'),
    loginPasskeyBtn: document.getElementById('loginPasskeyBtn'),
    switchToOtp: document.getElementById('switchToOtp'),
    goToRegister: document.getElementById('goToRegister'),
    loginError: document.getElementById('loginError'),
    otpFallbackArea: document.getElementById('otpFallbackArea'),
    otpInputs: document.querySelectorAll('#otpInputs input'),
    verifyOtpBtn: document.getElementById('verifyOtpBtn'),
    resendOtp: document.getElementById('resendOtp'),

    regFirstName: document.getElementById('regFirstName'),
    regLastName: document.getElementById('regLastName'),
    regMobile: document.getElementById('regMobile'),
    regEmail: document.getElementById('regEmail'),
    regPassword: document.getElementById('regPassword'),
    regConfirm: document.getElementById('regConfirm'),
    registerBtn: document.getElementById('registerBtn'),
    goToLogin: document.getElementById('goToLogin'),
    regError: document.getElementById('regError'),

    userName: document.getElementById('userName'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    userEmail: document.getElementById('userEmail'),
    userAvatar: document.getElementById('userAvatar'),
    logoutBtn: document.getElementById('logoutBtn'),
    sessionTimer: document.getElementById('sessionTimer'),
    alertBadge: document.getElementById('alertBadge'),
    alertList: document.getElementById('alertList'),
    alertFilter: document.getElementById('alertFilter'),
    deviceList: document.getElementById('deviceList'),
    refreshDevices: document.getElementById('refreshDevices'),
    activityPreview: document.getElementById('activityPreview'),
    activityBody: document.getElementById('activityBody'),
    exportActivity: document.getElementById('exportActivity'),
    pageTitle: document.getElementById('pageTitle'),
    tabButtons: document.querySelectorAll('.sidebar-nav-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),

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
    [DOM.pageLogin, DOM.pageRegister, DOM.pageDashboard].forEach(p => {
        p.classList.add('hidden');
    });
    pageElement.classList.remove('hidden');
}

// ===== SESSION MANAGEMENT =====
function updateSessionTimer() {
    const left = Math.max(0, Math.floor((State.sessionExpiry - Date.now()) / 1000));
    const minutes = String(Math.floor(left / 60)).padStart(2, '0');
    const seconds = String(left % 60).padStart(2, '0');
    const timeString = `${minutes}:${seconds}`;

    DOM.sessionTimer.textContent = timeString;

    if (left <= 0) {
        handleSessionExpired();
    }
}

function handleSessionExpired() {
    showToast('Session expired. Please sign in again.', 'error');
    logout();
}

function startSessionTimer() {
    if (State.sessionTimer) {
        clearInterval(State.sessionTimer);
    }
    updateSessionTimer();
    State.sessionTimer = setInterval(updateSessionTimer, 1000);
}

// ===== AUTHENTICATION =====

function handlePasskeyLogin() {
    const email = DOM.loginEmail.value.trim() || CONFIG.DEMO_EMAIL;
    if (!email) {
        DOM.loginError.textContent = 'Please enter your email';
        DOM.loginError.classList.remove('hidden');
        return;
    }

    if (!email.includes('@')) {
        DOM.loginError.textContent = 'Please enter a valid email address';
        DOM.loginError.classList.remove('hidden');
        return;
    }

    DOM.loginError.classList.add('hidden');
    showToast('🔐 Authenticating with your passkey...', 'info');

    setTimeout(() => {
        handleLoginSuccess(email);
        showToast('✅ Signed in successfully!', 'success');
    }, 1200);
}

function handleOTPLogin() {
    let code = '';
    DOM.otpInputs.forEach(input => {
        code += input.value;
    });

    if (code.length !== CONFIG.OTP_LENGTH) {
        showToast('Please enter all 6 digits', 'error');
        return;
    }

    if (code === State.otpCode) {
        showToast('✅ Code verified successfully!', 'success');
        handleLoginSuccess(DOM.loginEmail.value.trim() || CONFIG.DEMO_EMAIL);
    } else {
        State.otpAttempts++;
        const remaining = CONFIG.MAX_OTP_ATTEMPTS - State.otpAttempts;
        if (remaining <= 0) {
            showToast('Too many failed attempts. Please try again later.', 'error');
            DOM.otpInputs.forEach(input => (input.value = ''));
            State.otpAttempts = 0;
            return;
        }
        showToast(`Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`, 'error');
        DOM.otpInputs.forEach(input => (input.value = ''));
        DOM.otpInputs[0].focus();
    }
}

function handleLoginSuccess(email) {
    State.user.email = email;
    State.accessToken = 'mock_jwt_token_' + Date.now();
    State.sessionExpiry = Date.now() + CONFIG.SESSION_DURATION;

    showPage(DOM.pageDashboard);
    renderDashboard();
    showToast(`Welcome back, ${State.user.firstName}!`, 'success');
}

function startOTPResendTimer() {
    let countdown = CONFIG.OTP_RESEND_TIMEOUT;
    DOM.resendOtp.textContent = `Resend code (${countdown}s)`;
    DOM.resendOtp.style.pointerEvents = 'none';
    DOM.resendOtp.style.opacity = '0.5';

    if (State.otpTimer) {
        clearInterval(State.otpTimer);
    }

    State.otpTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
            clearInterval(State.otpTimer);
            DOM.resendOtp.textContent = 'Resend code';
            DOM.resendOtp.style.pointerEvents = 'auto';
            DOM.resendOtp.style.opacity = '1';
        } else {
            DOM.resendOtp.textContent = `Resend code (${countdown}s)`;
        }
    }, 1000);
}

function handleResendOTP() {
    State.otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    showToast(`📧 Verification code sent to your email`, 'info');
    startOTPResendTimer();
    DOM.otpInputs.forEach(input => (input.value = ''));
    DOM.otpInputs[0].focus();
}

// ===== REGISTRATION =====
function handleRegistration() {
    const firstName = DOM.regFirstName.value.trim();
    const lastName = DOM.regLastName.value.trim();
    const mobile = DOM.regMobile.value.trim();
    const email = DOM.regEmail.value.trim();
    const password = DOM.regPassword.value;
    const confirmPassword = DOM.regConfirm.value;

    if (!firstName || !lastName) {
        DOM.regError.textContent = 'Please enter your full name';
        DOM.regError.classList.remove('hidden');
        return;
    }

    if (!mobile) {
        DOM.regError.textContent = 'Please enter your phone number';
        DOM.regError.classList.remove('hidden');
        return;
    }

    if (!email || !email.includes('@')) {
        DOM.regError.textContent = 'Please enter a valid email address';
        DOM.regError.classList.remove('hidden');
        return;
    }

    if (password.length < 8) {
        DOM.regError.textContent = 'Password must be at least 8 characters';
        DOM.regError.classList.remove('hidden');
        return;
    }

    if (password !== confirmPassword) {
        DOM.regError.textContent = 'Passwords do not match';
        DOM.regError.classList.remove('hidden');
        return;
    }

    DOM.regError.classList.add('hidden');
    showToast('📱 Creating your account...', 'info');

    setTimeout(() => {
        State.user = { ...State.user, email, firstName, lastName };
        State.otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        showToast(`✅ Account created! We sent a code to ${email}`, 'success');

        showPage(DOM.pageLogin);
        DOM.loginEmail.value = email;
        DOM.otpFallbackArea.classList.remove('hidden');
        DOM.switchToOtp.textContent = 'Enter verification code';
        startOTPResendTimer();

        DOM.otpInputs.forEach((input, index) => {
            input.value = State.otpCode[index] || '';
        });

        showToast('Check your email for the verification code', 'info');
    }, 1200);
}

// ===== LOGOUT =====
function logout() {
    if (State.sessionTimer) {
        clearInterval(State.sessionTimer);
    }
    if (State.otpTimer) {
        clearInterval(State.otpTimer);
    }

    State.accessToken = null;
    State.sessionExpiry = null;

    showPage(DOM.pageLogin);
    DOM.otpFallbackArea.classList.add('hidden');
    DOM.switchToOtp.textContent = 'Use verification code instead';
    showToast('Signed out successfully', 'info');
}

// ===== DASHBOARD RENDER =====
function renderDashboard() {
    DOM.userName.textContent = `${State.user.firstName} ${State.user.lastName}`;
    DOM.userNameDisplay.textContent = State.user.firstName;
    DOM.userEmail.textContent = State.user.email;
    DOM.userAvatar.textContent = `${State.user.firstName[0]}${State.user.lastName[0]}`;
    
    startSessionTimer();
    renderDevices();
    renderAlerts();
    renderActivity();
    updateAlertBadge();
}

function renderDevices() {
    if (!DOM.deviceList) return;
    
    DOM.deviceList.innerHTML = State.devices.map(device => `
        <div class="device-card">
            <div class="device-info">
                <div class="device-icon">
                    <i class="fas fa-${device.type === 'mobile' ? 'mobile-alt' : device.type === 'tablet' ? 'tablet' : 'laptop'}"></i>
                </div>
                <div>
                    <div class="device-name">${device.name}</div>
                    <div class="device-location">${device.location} · ${device.os} · ${device.browser}</div>
                </div>
            </div>
            <div class="device-status">
                ${device.current ? '<span class="badge badge-success">Current</span>' : ''}
                ${device.trusted ? '<span class="badge badge-success">✓ Trusted</span>' : '<span class="badge badge-secondary">Untrusted</span>'}
                <span style="font-size:0.7rem; color:#94a3b8;">${getRelativeTime(device.lastUsed)}</span>
            </div>
        </div>
    `).join('') || '<p class="text-muted">No devices connected</p>';
}

function renderAlerts() {
    const filter = DOM.alertFilter ? DOM.alertFilter.value : 'all';
    let filteredAlerts = State.alerts;

    if (filter !== 'all') {
        filteredAlerts = State.alerts.filter(a => a.severity === filter);
    }

    filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);

    if (DOM.alertList) {
        DOM.alertList.innerHTML = filteredAlerts.map(alert => `
            <div class="alert-item ${!alert.read ? 'unread' : ''}" onclick="viewAlertDetail(${alert.id})">
                <div class="alert-header">
                    <span class="alert-title">
                        <span class="badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">
                            ${alert.severity}
                        </span>
                        ${alert.title}
                        ${!alert.read ? '<span class="badge badge-primary">New</span>' : ''}
                    </span>
                    <span class="alert-time">${getRelativeTime(alert.timestamp)}</span>
                </div>
                <div class="alert-description">${alert.description}</div>
            </div>
        `).join('') || '<p class="text-muted">No security alerts</p>';
    }

    // Activity preview
    if (DOM.activityPreview) {
        const recentAlerts = State.alerts
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 3);

        DOM.activityPreview.innerHTML = recentAlerts.map(alert => `
            <div class="activity-item" style="border-left-color: ${alert.severity === 'High' ? '#ef4444' : alert.severity === 'Medium' ? '#f59e0b' : '#22c55e'};">
                <div class="activity-info">
                    <div class="activity-action">${alert.title}</div>
                    <div class="activity-time">${getRelativeTime(alert.timestamp)}</div>
                </div>
                <span class="badge ${alert.severity === 'High' ? 'badge-danger' : alert.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">
                    ${alert.severity}
                </span>
            </div>
        `).join('') || '<p class="text-muted">No recent alerts</p>';
    }

    updateAlertBadge();
}

function renderActivity() {
    if (!DOM.activityBody) return;

    const activities = State.activity.sort((a, b) => b.date - a.date);

    DOM.activityBody.innerHTML = activities.map(entry => `
        <tr>
            <td>${entry.date.toLocaleString()}</td>
            <td>
                ${entry.action}
                ${entry.amount ? `<span style="color: #22c55e; font-weight: 600;"> $${entry.amount.toFixed(2)}</span>` : ''}
            </td>
            <td>${entry.device}</td>
            <td>
                <span class="badge ${entry.status === 'Success' ? 'badge-success' : 'badge-danger'}">
                    ${entry.status}
                </span>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: #94a3b8;">No activity yet</td></tr>';
}

function updateAlertBadge() {
    if (!DOM.alertBadge) return;
    const unreadCount = State.alerts.filter(a => !a.read).length;
    DOM.alertBadge.textContent = unreadCount;
    DOM.alertBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
}

// ===== HELPER FUNCTIONS =====
function getSeverityColor(severity) {
    const colors = {
        High: '#ef4444',
        Medium: '#f59e0b',
        Low: '#22c55e',
    };
    return colors[severity] || '#64748b';
}

function getRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

// ===== VIEW ALERT DETAIL =====
function viewAlertDetail(alertId) {
    const alert = State.alerts.find(a => a.id === alertId);
    if (!alert) return;

    alert.read = true;
    renderAlerts();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        z-index: 9998; display: flex; align-items: center; justify-content: center;
        padding: 1.5rem; animation: fadeIn 0.3s ease;
    `;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
        <div style="
            background: white; border-radius: 16px; padding: 2rem;
            max-width: 480px; width: 100%; max-height: 80vh; overflow-y: auto;
            animation: fadeInUp 0.3s ease; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                <h3 style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem;">
                    <i class="fas fa-${alert.severity === 'High' ? 'exclamation-circle' : 'exclamation-triangle'}" 
                       style="color: ${getSeverityColor(alert.severity)}"></i>
                    ${alert.title}
                </h3>
                <button onclick="this.closest('[role=dialog]').remove()" style="
                    background: none; border: none; font-size: 1.5rem;
                    cursor: pointer; color: #94a3b8; padding: 0.25rem 0.5rem;
                    border-radius: 8px; transition: all 0.2s ease;
                ">&times;</button>
            </div>
            <p style="margin: 1rem 0; color: #475569;">${alert.description}</p>
            <div style="background: #f8fafc; padding: 1rem; border-radius: 12px;">
                <p style="font-size: 0.85rem; color: #64748b;">
                    <i class="fas fa-clock" aria-hidden="true"></i>
                    ${new Date(alert.timestamp).toLocaleString()}
                </p>
                <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.3rem;">
                    <span class="badge" style="background: ${getSeverityColor(alert.severity)}20; color: ${getSeverityColor(alert.severity)};">
                        ${alert.severity} Priority
                    </span>
                </p>
            </div>
            <button onclick="this.closest('[role=dialog]').remove()" class="btn btn-secondary" style="width: auto; margin-top: 1rem;">
                Close
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.parentNode) overlay.remove();
    });
}

// ===== EXPORT ACTIVITY =====
function exportActivity() {
    if (State.activity.length === 0) {
        showToast('No activity data to export', 'warning');
        return;
    }

    const headers = ['Date', 'Action', 'Device', 'Status', 'Amount'];
    const rows = State.activity.map(entry => [
        entry.date.toISOString(),
        entry.action,
        entry.device,
        entry.status,
        entry.amount || '',
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Activity history downloaded', 'success');
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
        tabAccounts: 'Accounts',
        tabDevices: 'Devices',
        tabSecurity: 'Security',
        tabActivity: 'Activity'
    };
    DOM.pageTitle.textContent = tabNames[tabId] || 'Overview';

    State.currentTab = tabId;

    switch (tabId) {
        case 'tabDevices':
            renderDevices();
            break;
        case 'tabSecurity':
            renderAlerts();
            break;
        case 'tabActivity':
            renderActivity();
            break;
    }
}

// ===== OTP INPUT HANDLING =====
function setupOTPInputs() {
    DOM.otpInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 1 && index < CONFIG.OTP_LENGTH - 1) {
                DOM.otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                DOM.otpInputs[index - 1].focus();
                DOM.otpInputs[index - 1].value = '';
            }
            if (e.key === 'Enter') {
                handleOTPLogin();
            }
        });

        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/[^0-9]/g, '').slice(0, CONFIG.OTP_LENGTH);
            digits.split('').forEach((digit, i) => {
                if (DOM.otpInputs[i]) {
                    DOM.otpInputs[i].value = digit;
                }
            });
            const lastIndex = Math.min(digits.length, CONFIG.OTP_LENGTH) - 1;
            if (DOM.otpInputs[lastIndex]) {
                DOM.otpInputs[lastIndex].focus();
            }
        });
    });
}

// ===== EVENT LISTENERS =====

// Login
DOM.loginPasskeyBtn.addEventListener('click', handlePasskeyLogin);
DOM.switchToOtp.addEventListener('click', () => {
    DOM.otpFallbackArea.classList.toggle('hidden');
    if (!DOM.otpFallbackArea.classList.contains('hidden')) {
        DOM.switchToOtp.textContent = 'Back to passkey';
        startOTPResendTimer();
        showToast('📧 Enter the verification code sent to your email', 'info');
        DOM.otpInputs[0].focus();
    } else {
        DOM.switchToOtp.textContent = 'Use verification code instead';
        if (State.otpTimer) {
            clearInterval(State.otpTimer);
        }
    }
});
DOM.verifyOtpBtn.addEventListener('click', handleOTPLogin);
DOM.resendOtp.addEventListener('click', handleResendOTP);

// Register
DOM.registerBtn.addEventListener('click', handleRegistration);
DOM.goToRegister.addEventListener('click', () => {
    showPage(DOM.pageRegister);
    DOM.regError.classList.add('hidden');
});
DOM.goToLogin.addEventListener('click', () => {
    showPage(DOM.pageLogin);
    DOM.regError.classList.add('hidden');
    DOM.loginError.classList.add('hidden');
});

// Dashboard
DOM.logoutBtn.addEventListener('click', logout);
DOM.refreshDevices.addEventListener('click', () => {
    showToast('🔄 Refreshing devices...', 'info');
    setTimeout(() => {
        renderDevices();
        showToast('Devices updated', 'success');
    }, 800);
});
DOM.exportActivity.addEventListener('click', exportActivity);

// Tab switching
DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});

// Alert filter
if (DOM.alertFilter) {
    DOM.alertFilter.addEventListener('change', renderAlerts);
}

// Login email Enter key
DOM.loginEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (DOM.otpFallbackArea.classList.contains('hidden')) {
            handlePasskeyLogin();
        } else {
            handleOTPLogin();
        }
    }
});

// ===== WEBSOCKET SIMULATION =====
function startWebSocketSimulation() {
    let alertCounter = 4;

    setInterval(() => {
        if (Math.random() < 0.15) {
            alertCounter++;
            const severities = ['High', 'Medium', 'Low'];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const titles = {
                High: 'Suspicious Activity Detected',
                Medium: 'Unusual Login Attempt',
                Low: 'New Device Registered'
            };
            const descriptions = {
                High: 'Unusual activity pattern detected on your account',
                Medium: 'Login attempt from an unrecognized location',
                Low: 'A new device was added to your trusted devices'
            };

            const newAlert = {
                id: alertCounter,
                severity: severity,
                title: titles[severity],
                description: descriptions[severity],
                timestamp: Date.now(),
                read: false,
            };

            State.alerts.unshift(newAlert);
            
            if (State.currentTab === 'tabSecurity' || State.currentTab === 'tabOverview') {
                renderAlerts();
            }
            updateAlertBadge();

            const icon = severity === 'High' ? 'error' : severity === 'Medium' ? 'warning' : 'info';
            showToast(`🔔 ${severity.toLowerCase()} priority alert: ${newAlert.title}`, icon);
        }
    }, 20000);
}

// ===== INITIALIZATION =====
function init() {
    initializeMockData();
    setupOTPInputs();
    showPage(DOM.pageLogin);
    DOM.loginEmail.value = CONFIG.DEMO_EMAIL;
    startWebSocketSimulation();
    showToast('🔐 Welcome to VaultID - Secure Banking', 'info');

    console.log('VaultID initialized successfully');
}

// Start application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ===== EXPOSE FUNCTIONS =====
window.viewAlertDetail = viewAlertDetail;
window.showToast = showToast;
window.logout = logout;