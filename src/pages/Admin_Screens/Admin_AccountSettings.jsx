// src/pages/Admin/Admin_AccountSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../../styles/Admin/Admin_AccountSettings.css';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';

const Admin_AccountSettings = () => {
  // ============================================================
  // ACCOUNT PROFILE STATE
  // ============================================================
  const [name, setName] = useState('Admin');
  const [surname, setSurname] = useState('User');
  const [email] = useState('admin@iik.co.za'); // Read-only
  const [role] = useState('Administrator');    // Read-only

  // ============================================================
  // PASSWORD STATE
  // ============================================================
  const [currentPassword, setCurrentPassword] = useState('**********');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // ============================================================
  // MODAL STATE
  // ============================================================
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // ============================================================
  // TOAST STATE (FIXED)
  // ============================================================
  // toastMessage  -> the text to display
  // toastVisible  -> controls enter vs. exit animation class
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  // Store timer IDs so rapid clicks don't cut off the previous toast
  const toastTimerRef = useRef(null);
  const toastCleanupRef = useRef(null);

  // ============================================================
  // BACKUP & RECOVERY STATE
  // ============================================================
  const [lastBackup] = useState('2026-01-18 • 02:14 AM • 1.2 GB');
  const [retention, setRetention] = useState('30 days');
  const [lastRecovery] = useState('2026-01-18 • 02:14 AM');
  const [backupStatus] = useState('COMPLETED');
  const [recoveryStatus] = useState('SUCCESSFUL');
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(true);
  const [selectedRestorePoint, setSelectedRestorePoint] = useState('');

  // ============================================================
  // NOTIFICATION PREFERENCES STATE
  // ============================================================
  const [notifyCert, setNotifyCert] = useState(true);
  const [notifyReg, setNotifyReg] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);

  // ============================================================
  // TWO-FACTOR AUTHENTICATION STATE
  // ============================================================
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // ============================================================
  // UI STATE
  // ============================================================
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('settings');
  const [showScrollButton, setShowScrollButton] = useState(false);

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /** Scrolls window to top smoothly. */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Displays a toast popup that:
   *   1. Fades + slides in from the top of the screen
   *   2. Stays visible for 2.5 seconds
   *   3. Fades + slides out gently
   *
   * FIX: Clears any previous timers so rapid clicks don't cut the
   *      new toast short, and adds a two-phase show/hide so we can
   *      animate the exit properly.
   */
  const showToast = (message) => {
    // Cancel any pending timers from a previous toast
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);

    // Phase 1: set the message and make it visible (triggers enter animation)
    setToastMessage(message);
    setToastVisible(true);

    // Phase 2: after 2.5s, trigger exit animation
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);

      // Phase 3: after exit animation completes (400ms), remove the node
      toastCleanupRef.current = setTimeout(() => {
        setToastMessage('');
      }, 400);
    }, 2500);
  };

  /** Clean up toast timers if the component unmounts mid-animation. */
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);
    };
  }, []);

  /** Show / hide the scroll-to-top button. */
  useEffect(() => {
    const handleScroll = () => setShowScrollButton(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /** Scroll to top on mount. */
  useEffect(() => {
    scrollToTop();
  }, []);

  // ============================================================
  // PROFILE HANDLERS
  // ============================================================
  const handleSaveProfile = () => {
    if (name !== 'Admin' || surname !== 'User') {
      setShowProfileModal(true);
    } else {
      showToast('No changes to save.');
    }
  };

  const confirmProfileSave = () => {
    setShowProfileModal(false);
    showToast('Profile updated successfully!');
  };

  // ============================================================
  // PASSWORD HANDLERS
  // ============================================================

  /**
   * Validates password inputs against the same rules used on Signup:
   *   - Not empty
   *   - Min 8 characters
   *   - At least 1 lowercase, 1 uppercase, 1 digit, 1 special char
   *   - Confirm matches
   */
  const validatePassword = () => {
    const errors = {};

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
    } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one special character';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return errors;
  };

  const handleUpdatePassword = () => {
    // FIX: capture the returned errors directly (React state updates are async,
    // so reading passwordErrors right after setPasswordErrors would be stale).
    const errors = validatePassword();

    if (Object.keys(errors).length > 0) {
      // Show the first error to the user via toast
      const firstError = Object.values(errors)[0];
      showToast(firstError);
      return;
    }

    // All validations passed -> open confirmation modal
    setShowPasswordModal(true);
  };

  const confirmPasswordUpdate = () => {
    setShowPasswordModal(false);
    showToast('Password updated successfully!');
    setCurrentPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  // ============================================================
  // BACKUP HANDLERS
  // ============================================================
  const handleBackupClick = () => setShowBackupModal(true);
  const confirmBackup = () => {
    setShowBackupModal(false);
    showToast('Backup initiated');
  };
  const cancelBackup = () => {
    setShowBackupModal(false);
    showToast('Backup canceled');
  };

  // ============================================================
  // RESTORE HANDLERS
  // ============================================================
  const handleRestoreClick = () => {
    if (!selectedRestorePoint || selectedRestorePoint === '') {
      showToast('Please select a restore point to restore data from that date.');
      return;
    }
    setShowRestoreModal(true);
  };

  const confirmRestore = () => {
    setShowRestoreModal(false);
    showToast('Restore data initiated');
  };

  const cancelRestore = () => {
    setShowRestoreModal(false);
    showToast('Restore data canceled');
  };

  // ============================================================
  // TOGGLE HANDLERS  (each shows a clear enable/disable toast)
  // ============================================================
  const toggle2FA = () => {
    const newState = !is2FAEnabled;
    setIs2FAEnabled(newState);
    showToast(
      newState
        ? 'Two-Factor Authentication (2FA) has been enabled.'
        : 'Two-Factor Authentication (2FA) has been turned off.'
    );
  };

  const toggleAutoBackup = () => {
    const newState = !isAutoBackupEnabled;
    setIsAutoBackupEnabled(newState);
    showToast(
      newState
        ? 'Automatic backups have been enabled.'
        : 'Automatic backups have been turned off.'
    );
  };

  const toggleNotifyCert = () => {
    const newState = !notifyCert;
    setNotifyCert(newState);
    showToast(
      newState
        ? 'Email notifications for certificate issuance have been enabled.'
        : 'Email notifications for certificate issuance have been turned off.'
    );
  };

  const toggleNotifyReg = () => {
    const newState = !notifyReg;
    setNotifyReg(newState);
    showToast(
      newState
        ? 'Notifications for new learner registrations have been enabled.'
        : 'Notifications for new learner registrations have been turned off.'
    );
  };

  const toggleNotifyWeekly = () => {
    const newState = !notifyWeekly;
    setNotifyWeekly(newState);
    showToast(
      newState
        ? 'Weekly summary report notifications have been enabled.'
        : 'Weekly summary report notifications have been turned off.'
    );
  };

  // ============================================================
  // MOBILE MENU HANDLERS
  // ============================================================
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="admin-account-settings-layout">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="admin-account-settings-body">
        <Admin_Sidebar
          active={activeNav}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="admin-account-settings-content">
          <h1 className="settings-title">System Admin Settings</h1>
          <p className="settings-subtitle">
            Configure your professional LMS workspace, security protocols, and system communication preferences.
          </p>

          {/* ==================== ACCOUNT PROFILE ==================== */}
          <div className="settings-card">
            <h2 className="card-heading">Account Profile</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="editable-input"
                />
              </div>
              <div className="profile-item">
                <label>Surname</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="editable-input"
                />
              </div>
              <div className="profile-item">
                <label>Email Address</label>
                <input type="text" value={email} readOnly className="readonly-input" />
              </div>
            </div>
            <div className="profile-role">
              <span>Role</span>
              <span className="role-badge">
                <svg className="lock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {role}
              </span>
            </div>
            <button className="btn btn-save" onClick={handleSaveProfile}>Save Changes</button>
          </div>

          {/* ==================== SECURITY SETTINGS ==================== */}
          <div className="settings-card">
            <h2 className="card-heading">Security Settings</h2>

            <div className="security-passwords">
              <div className="security-item">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="editable-input"
                />
              </div>
              <div className="security-row">
                <div className="security-item half">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.newPassword) {
                        setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                      }
                    }}
                    className={`editable-input ${passwordErrors.newPassword ? 'input-error' : ''}`}
                  />
                  {passwordErrors.newPassword && (
                    <span className="error-text">{passwordErrors.newPassword}</span>
                  )}
                </div>
                <div className="security-item half">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    className={`editable-input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="error-text">{passwordErrors.confirmPassword}</span>
                  )}
                </div>
              </div>
              <button className="btn btn-update" onClick={handleUpdatePassword}>Update Password</button>
            </div>

            <div className="two-factor-section">
              <div className="two-factor-header">
                <span className="two-factor-title">Two-Factor Authentication (2FA)</span>
                <div className="toggle-switch" onClick={toggle2FA}>
                  <div className={`toggle-track ${is2FAEnabled ? 'active' : ''}`}>
                    <div className={`toggle-thumb ${is2FAEnabled ? 'active' : ''}`}></div>
                  </div>
                  <span className="toggle-status">{is2FAEnabled ? '2FA ENABLED' : '2FA DISABLED'}</span>
                </div>
              </div>
              <p className="hint">When enabled, an OTP will be required when someone tries to delete your profile</p>
            </div>
          </div>

          {/* ==================== BACKUP ==================== */}
          <div className="settings-card">
            <h2 className="card-heading">Backup</h2>
            <p className="section-desc">Manage automatic backups and retention policies.</p>

            <div className="backup-auto-section">
              <div className="backup-auto-header">
                <div className="backup-auto-info">
                  <span className="backup-auto-label">Automatic backups</span>
                  <span className="backup-auto-time">Daily at 02:00 AM</span>
                </div>
                <div className="backup-toggle-wrapper">
                  <div className="toggle-switch small" onClick={toggleAutoBackup}>
                    <div className={`toggle-track ${isAutoBackupEnabled ? 'active' : ''}`}>
                      <div className={`toggle-thumb ${isAutoBackupEnabled ? 'active' : ''}`}></div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="btn btn-backup" onClick={handleBackupClick}>Backup Now</button>
            </div>

            <div className="backup-details">
              <div className="backup-detail-row">
                <span className="backup-label">Last backup</span>
              </div>
              <div className="backup-detail-row">
                <span className="backup-value">{lastBackup}</span>
                <span className={`backup-status ${backupStatus === 'COMPLETED' ? 'status-completed' : ''}`}>
                  {backupStatus}
                </span>
              </div>
              <div className="backup-detail-row">
                <span className="backup-label">Retention period</span>
              </div>
              <div className="backup-detail-row">
                <select
                  className="retention-select"
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                >
                  <option value="7 days">7 days</option>
                  <option value="30 days">30 days</option>
                  <option value="3 months">3 months</option>
                </select>
              </div>
            </div>
          </div>

          {/* ==================== DATA RECOVERY ==================== */}
          <div className="settings-card">
            <h2 className="card-heading">Data Recovery</h2>
            <p className="section-desc">Restore lost data from automatic system backups.</p>

            <div className="recovery-section">
              <div className="recovery-item">
                <label>Restore point</label>
                <select
                  className="editable-select restore-select"
                  value={selectedRestorePoint}
                  onChange={(e) => setSelectedRestorePoint(e.target.value)}
                >
                  <option value="">Select restore point</option>
                  <option value="2026-01-18 02:14 AM">2026-01-18 02:14 AM</option>
                  <option value="2026-01-17 02:14 AM">2026-01-17 02:14 AM</option>
                </select>
              </div>
              <button className="btn btn-restore" onClick={handleRestoreClick}>Restore Data</button>
            </div>

            <div className="recovery-details">
              <span className="recovery-label">Last successful recovery:</span>
              <span className="recovery-value">{lastRecovery}</span>
              <span className={`recovery-status ${recoveryStatus === 'SUCCESSFUL' ? 'status-success' : ''}`}>
                {recoveryStatus}
              </span>
            </div>
          </div>

          {/* ==================== NOTIFICATION PREFERENCES ==================== */}
          <div className="settings-card">
            <h2 className="card-heading">Notification Preferences</h2>

            <div className="notification-item">
              <div className="notification-header">
                <span className="notification-title">Email me when a certificate is issued</span>
                <div className="toggle-switch small" onClick={toggleNotifyCert}>
                  <div className={`toggle-track ${notifyCert ? 'active' : ''}`}>
                    <div className={`toggle-thumb ${notifyCert ? 'active' : ''}`}></div>
                  </div>
                </div>
              </div>
              <p className="hint">Receive an email copy every time a learner completes a course and claims a certificate.</p>
            </div>

            <div className="notification-item">
              <div className="notification-header">
                <span className="notification-title">Notify on new learner registration</span>
                <div className="toggle-switch small" onClick={toggleNotifyReg}>
                  <div className={`toggle-track ${notifyReg ? 'active' : ''}`}>
                    <div className={`toggle-thumb ${notifyReg ? 'active' : ''}`}></div>
                  </div>
                </div>
              </div>
              <p className="hint">Instant system alert and email summary when a new user registers on the platform.</p>
            </div>

            <div className="notification-item">
              <div className="notification-header">
                <span className="notification-title">Weekly summary report</span>
                <div className="toggle-switch small" onClick={toggleNotifyWeekly}>
                  <div className={`toggle-track ${notifyWeekly ? 'active' : ''}`}>
                    <div className={`toggle-thumb ${notifyWeekly ? 'active' : ''}`}></div>
                  </div>
                </div>
              </div>
              <p className="hint">Get a high-level operational overview including enrolment metrics, active courses, and platform engagement.</p>
            </div>
          </div>
        </main>
      </div>

      {/* ==================== PROFILE MODAL ==================== */}
      {showProfileModal && (
        <div className="logout-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Changes</h2>
              <button className="logout-modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to save changes to your profile?</p>
              <p className="logout-modal-warning">Your name and surname will be updated across the system.</p>
            </div>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel-btn" onClick={() => setShowProfileModal(false)}>No, Stay</button>
              <button className="logout-modal-btn confirm-btn" onClick={confirmProfileSave}>Yes, Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PASSWORD MODAL ==================== */}
      {showPasswordModal && (
        <div className="logout-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Password Update</h2>
              <button className="logout-modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to modify this password?</p>
              <p className="logout-modal-warning">Continuing will result in use of the new password.</p>
            </div>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel-btn" onClick={() => setShowPasswordModal(false)}>No, Cancel</button>
              <button className="logout-modal-btn confirm-btn" onClick={confirmPasswordUpdate}>Yes, Update</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BACKUP MODAL ==================== */}
      {showBackupModal && (
        <div className="logout-modal-overlay" onClick={cancelBackup}>
          <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Backup</h2>
              <button className="logout-modal-close" onClick={cancelBackup}>×</button>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to backup?</p>
              <p className="logout-modal-warning">This will create a new backup of your system data.</p>
            </div>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel-btn" onClick={cancelBackup}>No, Cancel</button>
              <button className="logout-modal-btn confirm-btn" onClick={confirmBackup}>Yes, Backup</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RESTORE MODAL ==================== */}
      {showRestoreModal && (
        <div className="logout-modal-overlay" onClick={cancelRestore}>
          <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Restore</h2>
              <button className="logout-modal-close" onClick={cancelRestore}>×</button>
            </div>
            <div className="logout-modal-body">
              <p>Are you sure you want to restore data from this date?</p>
              <p className="logout-modal-warning">Restore point: {selectedRestorePoint}</p>
            </div>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel-btn" onClick={cancelRestore}>No, Cancel</button>
              <button className="logout-modal-btn confirm-btn" onClick={confirmRestore}>Yes, Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST POPUP ==================== */}
      {/* The className toggles between enter/exit animations */}
      {toastMessage && (
        <div className={`toast-message ${toastVisible ? 'toast-enter' : 'toast-exit'}`}>
          {toastMessage}
        </div>
      )}

      {/* ==================== SCROLL TO TOP ==================== */}
      {showScrollButton && (
        <button className="scroll-to-top-btn" onClick={scrollToTop} aria-label="Scroll to top">
          ↑
        </button>
      )}
    </div>
  );
};

export default Admin_AccountSettings;