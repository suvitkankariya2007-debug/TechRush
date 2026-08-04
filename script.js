/* ========================================================= */
/* VAULTID - Microsoft Authenticator Inspired Script */
/* ========================================================= */

(function() {
    'use strict';

    // =========================================================
    // PART 1: DOM REFERENCES & STATE
    // =========================================================

    const Elements = {
        // Navigation
        navTabs: document.querySelectorAll('.nav-tab'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Modal
        modal: document.getElementById('detailsModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalBody: document.getElementById('modalBody'),
        closeModal: document.getElementById('closeModal'),

        // Toast
        toastContainer: document.getElementById('toastContainer'),

        // Time display
        currentTime: document.getElementById('currentTime'),

        // Logout
        logoutBtn: document.querySelector('.logout-btn'),
    };

    const AppState = {
        currentTab: 'main',
        alerts: [
            { title: 'Suspicious Login Attempt', desc: 'Unknown IP address detected', time: '10 min ago', risk: 85, severity: 'high' },
            { title: 'New Device Added', desc: 'Chrome on Windows', time: '30 min ago', risk: 45, severity: 'medium' },
            { title: 'Successful Login', desc: 'Trusted device', time: '2 hours ago', risk: 12, severity: 'low' }
        ]
    };

    // =========================================================
    // PART 2: TIME UPDATER
    // =========================================================

    function updateTime() {
        if (!Elements.currentTime) return;
        const now = new Date();
        const options = { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        };
        Elements.currentTime.textContent = now.toLocaleDateString('en-US', options);
    }

    // =========================================================
    // PART 3: TAB SWITCHING
    // =========================================================

    function switchTab(tabId) {
        // Update nav tabs
        Elements.navTabs.forEach(tab => {
            const tabName = tab.dataset.tab;
            if (tabName === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content
        Elements.tabContents.forEach(content => {
            const contentId = content.id;
            if (contentId === `tab-${tabId}`) {
                content.classList.add('active-tab');
            } else {
                content.classList.remove('active-tab');
            }
        });

        AppState.currentTab = tabId;
    }

    // =========================================================
    // PART 4: MODAL SYSTEM
    // =========================================================

    function showModal(title, content) {
        if (!Elements.modal || !Elements.modalTitle || !Elements.modalBody) return;
        Elements.modalTitle.textContent = title;
        Elements.modalBody.innerHTML = content;
        Elements.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!Elements.modal) return;
        Elements.modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // =========================================================
    // PART 5: TOAST SYSTEM
    // =========================================================

    function showToast(message, type = 'info', duration = 4000) {
        if (!Elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        Elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    // =========================================================
    // PART 6: GLOBAL LOGOUT
    // =========================================================

    function handleGlobalLogout() {
        showModal(
            'Pause All Sessions',
            `
            <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 56px; color: #ef4444; margin-bottom: 16px;">
                    <i class="fas fa-triangle-exclamation"></i>
                </div>
                <h3 style="color: #dc2626; font-size: 20px; margin-bottom: 8px;">Confirm Global Logout</h3>
                <p style="color: #64748b; margin-bottom: 24px;">
                    This will immediately logout all devices and pause all active sessions.
                    <br><strong style="color: #1e293b;">Are you sure?</strong>
                </p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="closeModal()" style="
                        padding: 10px 28px;
                        border-radius: 12px;
                        border: 2px solid #e2e8f0;
                        background: transparent;
                        font-weight: 600;
                        cursor: pointer;
                        transition: 0.25s;
                    ">Cancel</button>
                    <button onclick="confirmLogout()" style="
                        padding: 10px 28px;
                        border-radius: 12px;
                        background: #ef4444;
                        color: white;
                        font-weight: 600;
                        border: none;
                        cursor: pointer;
                        transition: 0.25s;
                    ">Yes, Logout All</button>
                </div>
            </div>
            `
        );
    }

    function confirmLogout() {
        closeModal();
        showToast('🔒 All sessions paused successfully', 'success');
        // Update UI to reflect paused state
        document.querySelector('.session-status .status-dot')?.classList.remove('active');
        document.querySelector('.session-title').textContent = 'Session Paused';
        document.querySelector('.session-title').style.opacity = '0.7';
        document.querySelector('.risk-number').textContent = '0%';
        showToast('🔔 Logout notification sent to all devices', 'info');
    }

    // Expose for inline onclick
    window.closeModal = closeModal;
    window.confirmLogout = confirmLogout;

    // =========================================================
    // PART 7: ALERT INTERACTIONS
    // =========================================================

    function setupAlertInteractions() {
        document.querySelectorAll('.alert-item').forEach(item => {
            item.addEventListener('click', function() {
                const title = this.querySelector('.alert-title')?.textContent || 'Alert';
                const desc = this.querySelector('.alert-desc')?.textContent || '';
                const badge = this.querySelector('.alert-badge')?.textContent || '';

                showModal(
                    `Security Alert: ${title}`,
                    `
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 40px; text-align: center; margin-bottom: 12px;">
                            ${this.classList.contains('high') ? '🔴' : 
                              this.classList.contains('medium') ? '🟡' : '🟢'}
                        </div>
                        <p><strong>Description:</strong> ${desc}</p>
                        <p><strong>Risk Score:</strong> ${badge}</p>
                        <p><strong>Time:</strong> ${this.querySelector('.alert-desc')?.textContent.split('•')[1] || 'Unknown'}</p>
                        <div style="
                            margin-top: 16px;
                            padding: 12px 16px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2878f3;
                        ">
                            <strong>AI Analysis:</strong> This alert was triggered by the Isolation Forest model.
                            ${this.classList.contains('high') ? 'High risk activity detected.' : 
                              this.classList.contains('medium') ? 'Medium risk activity. Review recommended.' : 
                              'Low risk activity. Standard monitoring.'}
                        </div>
                    </div>
                    `
                );
            });
        });
    }

    // =========================================================
    // PART 8: DEVICE INTERACTIONS
    // =========================================================

    function setupDeviceInteractions() {
        document.querySelectorAll('.device-item').forEach(item => {
            item.addEventListener('click', function() {
                const name = this.querySelector('.device-name span')?.textContent || 'Device';
                const fingerprint = this.querySelector('.device-fingerprint')?.textContent || '';
                const lastUsed = this.querySelector('.device-last')?.textContent || '';

                showModal(
                    `Device: ${name}`,
                    `
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 40px; text-align: center; margin-bottom: 12px;">
                            ${this.classList.contains('current') ? '🟢' : '⚪'}
                        </div>
                        <p><strong>Device Name:</strong> ${name}</p>
                        <p><strong>Fingerprint:</strong> <code style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">${fingerprint}</code></p>
                        <p><strong>Status:</strong> ${this.classList.contains('current') ? 'Active' : 'Inactive'}</p>
                        <p><strong>Last Used:</strong> ${lastUsed}</p>
                        <div style="
                            margin-top: 16px;
                            padding: 12px 16px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2878f3;
                        ">
                            <strong>AI Trust Score:</strong> ${this.classList.contains('current') ? '95%' : '78%'}
                            <br>
                            <small style="color: #64748b;">Based on device fingerprint, IP consistency, and behavioral patterns</small>
                        </div>
                    </div>
                    `
                );
            });
        });
    }

    // =========================================================
    // PART 9: RECOVERY OPTIONS
    // =========================================================

    function setupRecoveryInteractions() {
        document.querySelectorAll('.recovery-option').forEach(option => {
            option.addEventListener('click', function() {
                const name = this.querySelector('span')?.textContent || 'Recovery Method';

                const details = {
                    'Bank Branch Verification': 'Visit your bank branch with valid ID proof. Branch manager will verify your identity and initiate the recovery process.',
                    'Recovery Device': 'Use your pre-registered backup device to receive a recovery code. This device must have been previously verified.',
                    'Hardware Security Key': 'Insert your registered hardware security key (YubiKey or similar). This provides cryptographic proof of identity.'
                };

                showModal(
                    `Recovery: ${name}`,
                    `
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 48px; text-align: center; margin-bottom: 12px;">
                            ${this.querySelector('i')?.outerHTML || '🔐'}
                        </div>
                        <p><strong>Method:</strong> ${name}</p>
                        <p style="margin-top: 8px;"><strong>Process:</strong></p>
                        <p style="color: #475569;">${details[name] || 'Follow the standard recovery process.'}</p>
                        <div style="
                            margin-top: 16px;
                            padding: 12px 16px;
                            background: #fef3c7;
                            border-radius: 8px;
                            border-left: 4px solid #f59e0b;
                        ">
                            <strong>⚠️ Security Notice:</strong> Recovery requires additional verification and may take 24-48 hours for security reasons.
                        </div>
                    </div>
                    `
                );
            });
        });
    }

    // =========================================================
    // PART 10: NAVIGATION SETUP
    // =========================================================

    function setupNavigation() {
        Elements.navTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                if (tabId) {
                    switchTab(tabId);
                    showToast(`Switched to ${this.textContent.trim()}`, 'info', 1500);
                }
            });
        });
    }

    // =========================================================
    // PART 11: MODAL EVENTS
    // =========================================================

    function setupModalEvents() {
        if (Elements.closeModal) {
            Elements.closeModal.addEventListener('click', closeModal);
        }

        if (Elements.modal) {
            Elements.modal.addEventListener('click', function(e) {
                if (e.target === this) closeModal();
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeModal();
        });
    }

    // =========================================================
    // PART 12: LOGOUT HANDLER
    // =========================================================

    function setupLogoutHandler() {
        if (Elements.logoutBtn) {
            Elements.logoutBtn.addEventListener('click', handleGlobalLogout);
        }
    }

    // =========================================================
    // PART 13: SESSION STATUS UPDATER
    // =========================================================

    function setupSessionUpdater() {
        // Simulate session time remaining
        let minutesRemaining = 15;
        const sessionStatus = document.querySelector('.session-label');
        const sessionTime = document.querySelector('.session-time span');

        setInterval(() => {
            minutesRemaining--;
            if (minutesRemaining <= 0) {
                minutesRemaining = 15;
                // Simulate token refresh
                showToast('🔄 Session token refreshed', 'success', 2000);
            }
            // Update session display if needed
        }, 60000); // Update every minute
    }

    // =========================================================
    // PART 14: RISK SIMULATION (Demo Purpose)
    // =========================================================

    function setupRiskSimulation() {
        const riskNumber = document.querySelector('.risk-number');
        const riskBadge = document.querySelector('.risk-badge');
        const riskScoreCircle = document.querySelector('.risk-score-circle');

        if (!riskNumber) return;

        // Slightly fluctuate risk score for demo
        setInterval(() => {
            const currentRisk = parseInt(riskNumber.textContent);
            const fluctuation = (Math.random() - 0.5) * 6;
            let newRisk = Math.max(2, Math.min(35, currentRisk + fluctuation));
            newRisk = Math.round(newRisk);

            riskNumber.textContent = `${newRisk}%`;

            // Update badge color
            if (riskBadge) {
                riskBadge.className = 'risk-badge';
                if (newRisk < 20) {
                    riskBadge.classList.add('low');
                } else if (newRisk < 40) {
                    riskBadge.classList.add('medium');
                } else {
                    riskBadge.classList.add('high');
                }
                riskBadge.innerHTML = `<span class="risk-dot"></span>${newRisk}% Risk`;
            }
        }, 5000);
    }

    // =========================================================
    // PART 15: TOAST FROM ALERTS (Initial demo)
    // =========================================================

    function showInitialAlerts() {
        setTimeout(() => {
            showToast('🛡️ AI Risk Engine: All systems normal', 'success', 3000);
        }, 1000);

        setTimeout(() => {
            showToast('📱 Device fingerprint verified for Laptop A', 'info', 3000);
        }, 3000);
    }

    // =========================================================
    // PART 16: INITIALIZATION
    // =========================================================

    function init() {
        // Update time
        updateTime();
        setInterval(updateTime, 30000);

        // Setup navigation
        setupNavigation();

        // Setup modal
        setupModalEvents();

        // Setup interactions
        setupAlertInteractions();
        setupDeviceInteractions();
        setupRecoveryInteractions();
        setupLogoutHandler();

        // Session updates
        setupSessionUpdater();

        // Risk simulation
        setupRiskSimulation();

        // Initial alerts
        showInitialAlerts();

        // Set default active tab
        switchTab('main');

        console.log('🚀 VaultID Dashboard initialized');
        console.log('🔐 Zero-Trust Authentication ready');
        console.log('📋 Keyboard shortcuts: Click any card for details');
    }

    // =========================================================
    // PART 17: EXPOSE FOR DEBUGGING
    // =========================================================

    window.VaultID = {
        Elements,
        AppState,
        switchTab,
        showModal,
        closeModal,
        showToast,
        handleGlobalLogout,
        confirmLogout,
        init
    };

    // =========================================================
    // START APP
    // =========================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();