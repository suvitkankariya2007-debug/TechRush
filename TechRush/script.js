/**
 * VaultID - User Portal
 * Integrated with Backend API
 */

// ===== CONFIGURATION =====
const CONFIG = {
    API_BASE: 'http://localhost:8000',  // same origin (e.g. 'http://127.0.0.1:8000')
    SESSION_DURATION: 15 * 60 * 1000,
    TOAST_DURATION: 4000,
    OTP_LENGTH: 6,
    OTP_RESEND_TIMEOUT: 60,
    MAX_OTP_ATTEMPTS: 3,
};

// ===== STATE =====
const State = {
    user: { id: null, email: null, firstName: 'John', lastName: 'Doe' },
    accessToken: null,
    userId: null,
    sessionExpiry: null,
    otpAttempts: 1,
    otpTimer: null,
    sessionTimer: null,
    currentTab: 'overview',
    deviceFingerprint: null,
    pendingPasskeySetupUserId: null,
    // UI demo data (static)
    accounts: [
        { name: 'Checking Account', balance: 12845.32, number: '4829', type: 'primary' },
        { name: 'Savings Account', balance: 47230.18, number: '7356', type: 'savings' },
        { name: 'Investment Account', balance: 23456.78, number: '9123', type: 'investment' },
    ],
    alerts: [
        { id: 1, severity: 'High', title: 'New Device Detected', description: 'A new device was used to access your account. Was this you?', timestamp: Date.now() - 120000, read: false },
        { id: 2, severity: 'Medium', title: 'Unusual Login Time', description: 'We noticed a login outside your normal hours', timestamp: Date.now() - 3600000, read: false },
        { id: 3, severity: 'Low', title: 'Passkey Added', description: 'A new passkey was added to your account', timestamp: Date.now() - 7200000, read: true },
        { id: 4, severity: 'High', title: 'Suspicious Transaction', description: 'A large transaction was attempted from a new location', timestamp: Date.now() - 10800000, read: false },
    ],
    devices: [
        { name: 'iPhone 15 Pro', type: 'mobile', trusted: true, current: true, lastUsed: Date.now() - 300000, location: 'New York, US', os: 'iOS 17', browser: 'Safari' },
        { name: 'MacBook Pro', type: 'laptop', trusted: true, current: false, lastUsed: Date.now() - 86400000, location: 'New York, US', os: 'macOS Sonoma', browser: 'Chrome' },
        { name: 'iPad Air', type: 'tablet', trusted: false, current: false, lastUsed: Date.now() - 172800000, location: 'San Francisco, US', os: 'iPadOS 17', browser: 'Safari' },
        { name: 'Samsung Galaxy S24', type: 'mobile', trusted: false, current: false, lastUsed: Date.now() - 259200000, location: 'London, UK', os: 'Android 14', browser: 'Chrome' },
    ],
    activity: [
        { date: new Date(Date.now() - 60000), action: 'Logged in with Passkey', device: 'iPhone 15 Pro', status: 'Success', amount: null },
        { date: new Date(Date.now() - 1800000), action: 'Transferred $500.00', device: 'MacBook Pro', status: 'Success', amount: 500.00 },
        { date: new Date(Date.now() - 7200000), action: 'Received $1,200.00', device: 'iPhone 15 Pro', status: 'Success', amount: 1200.00 },
        { date: new Date(Date.now() - 86400000), action: 'Logged in with Passkey', device: 'MacBook Pro', status: 'Success', amount: null },
        { date: new Date(Date.now() - 172800000), action: 'Paid $2,450.00', device: 'iPhone 15 Pro', status: 'Success', amount: 2450.00 },
        { date: new Date(Date.now() - 259200000), action: 'Logged in with OTP', device: 'iPad Air', status: 'Failed', amount: null },
    ],
};

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
    passkeySetupModal: document.getElementById('passkeySetupModal'),
    passkeySetupConfirm: document.getElementById('passkeySetupConfirm'),
    passkeySetupSkip: document.getElementById('passkeySetupSkip'),
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

// ===== DEVICE FINGERPRINT =====
function generateDeviceFingerprint() {
    const components = [
        navigator.userAgent,
        screen.width,
        screen.height,
        screen.colorDepth,
        navigator.language,
        navigator.platform,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
        navigator.deviceMemory || 0,
    ];
    const str = components.join('::');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'fp_' + Math.abs(hash).toString(16).padStart(8, '0');
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
    DOM.sessionTimer.textContent = `${minutes}:${seconds}`;

    if (left <= 0) {
        showToast('Session expired. Please sign in again.', 'error');
        logout();
    }
}

function startSessionTimer() {
    if (State.sessionTimer) clearInterval(State.sessionTimer);
    updateSessionTimer();
    State.sessionTimer = setInterval(updateSessionTimer, 1000);
}

function setSession(jwt, userId, email, firstName, lastName) {
    State.accessToken = jwt;
    State.userId = userId;
    State.user.email = email;
    State.user.firstName = firstName || 'User';
    State.user.lastName = lastName || '';
    State.sessionExpiry = Date.now() + CONFIG.SESSION_DURATION;
    localStorage.setItem('vaultid_session', JSON.stringify({
        token: jwt,
        userId,
        email,
        firstName: State.user.firstName,
        lastName: State.user.lastName,
        expiry: State.sessionExpiry,
    }));
    showPage(DOM.pageDashboard);
    renderDashboard();
    startSessionTimer();
    showToast(`Welcome, ${State.user.firstName}!`, 'success');
}

function clearSession() {
    State.accessToken = null;
    State.userId = null;
    State.sessionExpiry = null;
    localStorage.removeItem('vaultid_session');
    if (State.sessionTimer) clearInterval(State.sessionTimer);
}

function restoreSession() {
    const data = JSON.parse(localStorage.getItem('vaultid_session'));
    if (data && data.expiry > Date.now()) {
        State.accessToken = data.token;
        State.userId = data.userId;
        State.user.email = data.email;
        State.user.firstName = data.firstName;
        State.user.lastName = data.lastName;
        State.sessionExpiry = data.expiry;
        showPage(DOM.pageDashboard);
        renderDashboard();
        startSessionTimer();
        return true;
    }
    return false;
}

// ===== API HELPERS =====
async function apiCall(method, path, body) {
    const url = CONFIG.API_BASE + path;
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (State.accessToken) {
        headers['Authorization'] = `Bearer ${State.accessToken}`;
    }
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || data.message || 'API error');
    }
    return data;
}

// ============================================================
// AUTHENTICATION
// ============================================================

// ---- Passkey Setup Prompt ----
function promptPasskeySetup(userId) {
    State.pendingPasskeySetupUserId = userId;
    DOM.passkeySetupModal.classList.remove('hidden');
}

function closePasskeySetupModal() {
    DOM.passkeySetupModal.classList.add('hidden');
    State.pendingPasskeySetupUserId = null;
}

async function handlePasskeySetup() {
    const userId = State.pendingPasskeySetupUserId;
    if (!userId) {
        showToast('No user ID found for Passkey setup', 'error');
        return;
    }

    // Resolve WebAuthn helper from global scope safely
    const webAuthn = window.SimpleWebAuthnBrowser || window.SimpleWebAuthn;

    if (!webAuthn || typeof webAuthn.startRegistration !== 'function') {
        showToast('WebAuthn library not loaded. Check browser console.', 'error');
        console.error('SimpleWebAuthnBrowser missing or startRegistration is not a function:', webAuthn);
        return;
    }

    try {
        showToast('🔐 Initializing Passkey registration...', 'info');

        // 1. Request registration options from backend
        const beginData = await apiCall('POST', '/api/v1/auth/webauthn/register/begin', {
            user_id: userId,
            device_name: navigator.platform || 'My Device',
        });

        console.log('WebAuthn Registration Options:', beginData);

        if (!beginData || !beginData.options) {
            throw new Error('Server returned invalid WebAuthn options');
        }

        // 2. Trigger browser native biometric/PIN prompt
        showToast('Touch sensor or enter device PIN now...', 'info');
        const attestationResponse = await webAuthn.startRegistration(beginData.options);

        console.log('WebAuthn Attestation Response:', attestationResponse);

        // 3. Send credential back to complete registration
        const completeData = await apiCall('POST', '/api/v1/auth/webauthn/register/complete', {
            user_id: userId,
            credential: attestationResponse,
            device_name: navigator.platform || 'My Device',
        });

        if (completeData.success) {
            showToast('✅ Passkey successfully registered!', 'success');
            closePasskeySetupModal();
        } else {
            throw new Error(completeData.message || 'Passkey completion failed');
        }
    } catch (error) {
        console.error('Passkey Setup Full Error:', error);
        
        // Print exact error message and name for precise debugging
        const errorMsg = error.message || error.toString();
        showToast(`Passkey error (${error.name || 'Error'}): ${errorMsg}`, 'error')
    }
}

// ---- Passkey Login ----
async function handlePasskeyLogin() {
    const email = DOM.loginEmail.value.trim();
    if (!email || !email.includes('@')) {
        DOM.loginError.textContent = 'Please enter a valid email';
        DOM.loginError.classList.remove('hidden');
        return;
    }
    DOM.loginError.classList.add('hidden');
    showToast('🔐 Authenticating with passkey...', 'info');

    const deviceFingerprint = State.deviceFingerprint || generateDeviceFingerprint();
    State.deviceFingerprint = deviceFingerprint;

    try {
        // 1. Begin authentication
        const beginData = await apiCall('POST', '/api/v1/auth/webauthn/login/begin', {
            email,
            ip_address: '127.0.0.1',
            device_fingerprint: deviceFingerprint,
            user_agent: navigator.userAgent,
        });

        if (beginData.status === 'NO_PASSKEY') {
            showToast('No passkey registered. Sending verification code...', 'warning');
            DOM.otpFallbackArea.classList.remove('hidden');
            DOM.switchToOtp.textContent = 'Back to passkey';
            
            // ✨ FIX 1: Auto-trigger OTP generation when passkey is missing ✨
            await handleResendOTP();
            return;
        }

        if (beginData.status !== 'PASSKEY_REQUIRED') {
            throw new Error('Unexpected server response');
        }

        // 2. Start WebAuthn assertion
        const options = beginData.webauthn_options;
        const assertionResponse = await SimpleWebAuthnBrowser.startAuthentication(options);

        // 3. Complete authentication
        const completeData = await apiCall('POST', '/api/v1/auth/webauthn/login/complete', {
            user_id: beginData.user_id,
            credential: assertionResponse,
            device_fingerprint: deviceFingerprint,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
        });

        if (completeData.success) {
            setSession(completeData.jwt_token, beginData.user_id, email, 'User');
        } else {
            throw new Error(completeData.message || 'Authentication failed');
        }
    } catch (error) {
        showToast('Authentication error: ' + error.message, 'error');
        console.error(error);
    }
}

// ---- OTP Login ----
async function handleOTPLogin() {
    let code = '';
    DOM.otpInputs.forEach(input => { code += input.value; });
    if (code.length !== CONFIG.OTP_LENGTH) {
        showToast('Please enter all 6 digits', 'error');
        return;
    }

    const email = DOM.loginEmail.value.trim();
    if (!email) {
        showToast('Please enter your email first', 'error');
        return;
    }

    const deviceFingerprint = State.deviceFingerprint || generateDeviceFingerprint();
    State.deviceFingerprint = deviceFingerprint;

    try {
        const data = await apiCall('POST', '/api/v1/auth/otp/verify', {
            email,
            code,
            device_fingerprint: deviceFingerprint,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
        });
        if (data.status === 'SUCCESS') {
            setSession(data.jwt_token, data.user_id, email, 'User');
            if (!data.has_passkey) {
                promptPasskeySetup(data.user_id);
            }
        } else {
            throw new Error(data.message || 'OTP verification failed');
        }
    } catch (error) {
        State.otpAttempts++;
        const remaining = CONFIG.MAX_OTP_ATTEMPTS - State.otpAttempts;
        if (remaining <= 0) {
            showToast('Too many failed attempts. Please try again later.', 'error');
            DOM.otpInputs.forEach(inp => inp.value = '');
            State.otpAttempts = 0;
            return;
        }
        showToast(`Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`, 'error');
        DOM.otpInputs.forEach(inp => inp.value = '');
        DOM.otpInputs[0].focus();
    }
}

// ---- Resend OTP ----
async function handleResendOTP() {
    const email = DOM.loginEmail.value.trim();
    if (!email) {
        showToast('Please enter your email', 'error');
        return;
    }
    try {
        await apiCall('POST', '/api/v1/auth/otp/request', { email });
        showToast('📧 Verification code sent to email', 'info');
        startOTPResendTimer();
        DOM.otpInputs.forEach(inp => inp.value = '');
        DOM.otpInputs[0].focus();
    } catch (error) {
        showToast('Failed to resend OTP: ' + error.message, 'error');
    }
}

// ---- Registration ----
async function handleRegistration() {
    const firstName = DOM.regFirstName.value.trim();
    const lastName = DOM.regLastName.value.trim();
    const mobile = DOM.regMobile.value.trim();
    const email = DOM.regEmail.value.trim();
    const password = DOM.regPassword.value;
    const confirm = DOM.regConfirm.value;

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
        DOM.regError.textContent = 'Please enter a valid email';
        DOM.regError.classList.remove('hidden');
        return;
    }
    if (password.length < 8) {
        DOM.regError.textContent = 'Password must be at least 8 characters';
        DOM.regError.classList.remove('hidden');
        return;
    }
    if (password !== confirm) {
        DOM.regError.textContent = 'Passwords do not match';
        DOM.regError.classList.remove('hidden');
        return;
    }
    DOM.regError.classList.add('hidden');
    showToast('📱 Creating your account...', 'info');

    const deviceFingerprint = State.deviceFingerprint || generateDeviceFingerprint();
    State.deviceFingerprint = deviceFingerprint;

    try {
        const data = await apiCall('POST', '/api/v1/auth/register', {
            username: firstName + ' ' + lastName,
            email,
            phone: mobile,
            device_fingerprint: deviceFingerprint,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
        });

        showToast(`✅ Account created successfully!`, 'success');

        // 1. Move to Login Page and preset email
        showPage(DOM.pageLogin);
        DOM.loginEmail.value = email;

        // ✨ FIX 2: Prompt passkey setup modal immediately upon successful registration ✨
        if (data.id) {
            promptPasskeySetup(data.id);
        }

    } catch (error) {
        DOM.regError.textContent = error.message;
        DOM.regError.classList.remove('hidden');
    }
}

// ---- Logout ----
async function logout() {
    if (State.userId) {
        try {
            await apiCall('POST', '/api/v1/auth/logout/all', { user_id: State.userId });
        } catch (e) { /* ignore */ }
    }
    clearSession();
    showPage(DOM.pageLogin);
    DOM.otpFallbackArea.classList.add('hidden');
    DOM.switchToOtp.textContent = 'Use verification code instead';
    showToast('Signed out successfully', 'info');
}

// ---- OTP Timer ----
function startOTPResendTimer() {
    let countdown = CONFIG.OTP_RESEND_TIMEOUT;
    DOM.resendOtp.textContent = `Resend code (${countdown}s)`;
    DOM.resendOtp.style.pointerEvents = 'none';
    DOM.resendOtp.style.opacity = '0.5';

    if (State.otpTimer) clearInterval(State.otpTimer);
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

// ============================================================
// DASHBOARD RENDER (static demo data)
// ============================================================
function renderDashboard() {
    DOM.userName.textContent = `${State.user.firstName} ${State.user.lastName}`;
    DOM.userNameDisplay.textContent = State.user.firstName;
    DOM.userEmail.textContent = State.user.email;
    DOM.userAvatar.textContent = `${State.user.firstName[0]}${State.user.lastName[0]}`;
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
    let filtered = State.alerts;
    if (filter !== 'all') filtered = filtered.filter(a => a.severity === filter);
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    if (DOM.alertList) {
        DOM.alertList.innerHTML = filtered.map(alert => `
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

    if (DOM.activityPreview) {
        const recent = State.alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
        DOM.activityPreview.innerHTML = recent.map(alert => `
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
            <td>${entry.action} ${entry.amount ? `<span style="color:#22c55e; font-weight:600;"> $${entry.amount.toFixed(2)}</span>` : ''}</td>
            <td>${entry.device}</td>
            <td><span class="badge ${entry.status === 'Success' ? 'badge-success' : 'badge-danger'}">${entry.status}</span></td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="padding:1rem; text-align:center; color:#94a3b8;">No activity yet</td></tr>';
}

function updateAlertBadge() {
    if (!DOM.alertBadge) return;
    const unread = State.alerts.filter(a => !a.read).length;
    DOM.alertBadge.textContent = unread;
    DOM.alertBadge.style.display = unread > 0 ? 'inline-flex' : 'none';
}

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

window.viewAlertDetail = function(id) {
    const alert = State.alerts.find(a => a.id === id);
    if (!alert) return;
    alert.read = true;
    renderAlerts();
    showToast(`Alert: ${alert.title} - ${alert.description}`, 'info');
};

function exportActivity() {
    if (State.activity.length === 0) {
        showToast('No activity data to export', 'warning');
        return;
    }
    const headers = ['Date', 'Action', 'Device', 'Status', 'Amount'];
    const rows = State.activity.map(e => [
        e.date.toISOString(),
        e.action,
        e.device,
        e.status,
        e.amount || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Activity exported', 'success');
}

// ===== TAB MANAGEMENT =====
function switchTab(tabId) {
    DOM.tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    DOM.tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabId));
    const titles = { tabOverview: 'Overview', tabAccounts: 'Accounts', tabDevices: 'Devices', tabSecurity: 'Security', tabActivity: 'Activity' };
    DOM.pageTitle.textContent = titles[tabId] || 'Overview';
    State.currentTab = tabId;
    if (tabId === 'tabDevices') renderDevices();
    if (tabId === 'tabSecurity') renderAlerts();
    if (tabId === 'tabActivity') renderActivity();
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
            if (e.key === 'Enter') handleOTPLogin();
        });
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = paste.replace(/[^0-9]/g, '').slice(0, CONFIG.OTP_LENGTH);
            digits.split('').forEach((digit, i) => {
                if (DOM.otpInputs[i]) DOM.otpInputs[i].value = digit;
            });
            const last = Math.min(digits.length, CONFIG.OTP_LENGTH) - 1;
            if (DOM.otpInputs[last]) DOM.otpInputs[last].focus();
        });
    });
}

// ===== EVENT LISTENERS =====
DOM.loginPasskeyBtn.addEventListener('click', handlePasskeyLogin);
DOM.passkeySetupConfirm.addEventListener('click', handlePasskeySetup);
DOM.passkeySetupSkip.addEventListener('click', closePasskeySetupModal);

DOM.switchToOtp.addEventListener('click', async () => {
    DOM.otpFallbackArea.classList.toggle('hidden');
    if (!DOM.otpFallbackArea.classList.contains('hidden')) {
        DOM.switchToOtp.textContent = 'Back to passkey';
        DOM.otpInputs[0].focus();
        
        // ✨ FIX 3: Trigger OTP generation when clicking 'Verification Code' manually ✨
        await handleResendOTP();
    } else {
        DOM.switchToOtp.textContent = 'Use verification code instead';
        if (State.otpTimer) clearInterval(State.otpTimer);
    }
});

DOM.verifyOtpBtn.addEventListener('click', handleOTPLogin);
DOM.resendOtp.addEventListener('click', handleResendOTP);

DOM.registerBtn.addEventListener('click', handleRegistration);
DOM.goToRegister.addEventListener('click', () => { showPage(DOM.pageRegister); DOM.regError.classList.add('hidden'); });
DOM.goToLogin.addEventListener('click', () => { showPage(DOM.pageLogin); DOM.regError.classList.add('hidden'); DOM.loginError.classList.add('hidden'); });

DOM.logoutBtn.addEventListener('click', logout);
DOM.refreshDevices.addEventListener('click', () => {
    showToast('🔄 Refreshing devices...', 'info');
    setTimeout(() => { renderDevices(); showToast('Devices updated', 'success'); }, 800);
});
DOM.exportActivity.addEventListener('click', exportActivity);

DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
if (DOM.alertFilter) DOM.alertFilter.addEventListener('change', renderAlerts);

DOM.loginEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (DOM.otpFallbackArea.classList.contains('hidden')) handlePasskeyLogin();
        else handleOTPLogin();
    }
});

// ===== WEBSOCKET SIMULATION (for demo alerts) =====
function startWebSocketSimulation() {
    let counter = 4;
    setInterval(() => {
        if (!State.accessToken) return;
        if (Math.random() < 0.15) {
            counter++;
            const severities = ['High', 'Medium', 'Low'];
            const s = severities[Math.floor(Math.random() * severities.length)];
            const newAlert = {
                id: counter,
                severity: s,
                title: s === 'High' ? 'Suspicious Activity Detected' : s === 'Medium' ? 'Unusual Login Attempt' : 'New Device Registered',
                description: 'Generated by AI risk engine',
                timestamp: Date.now(),
                read: false,
            };
            State.alerts.unshift(newAlert);
            if (State.currentTab === 'tabSecurity' || State.currentTab === 'tabOverview') renderAlerts();
            updateAlertBadge();
            showToast(`🔔 ${s.toLowerCase()} priority alert`, s === 'High' ? 'error' : s === 'Medium' ? 'warning' : 'info');
        }
    }, 20000);
}

// ===== INIT =====
function init() {
    State.deviceFingerprint = generateDeviceFingerprint();
    setupOTPInputs();

    if (!restoreSession()) {
        showPage(DOM.pageLogin);
        DOM.loginEmail.value = '';
    }

    startWebSocketSimulation();
    console.log('VaultID frontend initialized (integrated mode)');
}

// Start
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

// Expose for inline onclick
window.showToast = showToast;
window.logout = logout;