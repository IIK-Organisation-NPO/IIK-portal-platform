// src/pages/Admin/Admin_AccountSettings.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../../styles/Admin/Admin_AccountSettings.css';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import api from '../../services/api';

// ---------------------------------------------------------------------------
// Password requirements — mirror the staff registration rules
// ---------------------------------------------------------------------------
const PASSWORD_REQUIREMENTS = [
  { id: 'length',    label: 'At least 8 characters',                    test: (p) => p.length >= 8 },
  { id: 'lowercase', label: 'At least one lowercase letter',            test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'At least one uppercase letter',            test: (p) => /[A-Z]/.test(p) },
  { id: 'number',    label: 'At least one number',                      test: (p) => /\d/.test(p) },
  { id: 'special',   label: 'At least one special character (@$!%*?&)', test: (p) => /[@$!%*?&]/.test(p) }
];

const Admin_AccountSettings = () => {
  // ============================================================
  // ACCOUNT PROFILE STATE
  // ============================================================
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Administrator');
  const [originalProfile, setOriginalProfile] = useState({ name: '', surname: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ============================================================
  // PASSWORD STATE
  // ============================================================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordServerError, setPasswordServerError] = useState('');

  // Live requirements panel visibility — shows while typing the new password
  // and hides once every requirement is met.
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // ============================================================
  // MODAL STATE
  // ============================================================
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // ============================================================
  // TOAST STATE
  // ============================================================
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
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
  //
  // These persist server-side via /staff/me/notifications. The state
  // mirrors what the server has, and every toggle PUTs the full set.
  // ============================================================
  const [notifyCert, setNotifyCert] = useState(true);
  const [notifyReg, setNotifyReg] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

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
  // DERIVED — has the admin met every new-password requirement?
  // ============================================================
  const allPasswordRequirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.every(r => r.test(newPassword)),
    [newPassword]
  );

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);

    setToastMessage(message);
    setToastVisible(true);

    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      toastCleanupRef.current = setTimeout(() => {
        setToastMessage('');
      }, 400);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollButton(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    scrollToTop();
  }, []);

  // ============================================================
  // FETCH MY PROFILE ON MOUNT
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async (attempt = 1) => {
      try {
        setProfileLoading(true);
        setProfileError('');

        const res = await api.get('/staff/me');
        if (cancelled) return;

        const payload = res.data?.data ?? res.data ?? null;
        const isOk = res.data?.success !== false && !!payload;

        if (isOk && (payload.name || payload.Name)) {
          const rawRole = payload.role_type || payload.role || '';
          const roleId  = payload.role_id ?? payload.roleId ?? null;

          let roleLabel = 'Administrator';
          if (rawRole === 'Super Admin' || roleId === 3) roleLabel = 'Super Admin';
          else if (rawRole === 'ADMIN' || roleId === 1) roleLabel = 'Administrator';
          else if (rawRole) roleLabel = rawRole;

          setName(payload.name || payload.Name || '');
          setSurname(payload.surname || payload.Surname || '');
          setEmail(payload.email || payload.Email_address || '');
          setRole(roleLabel);

          setOriginalProfile({
            name: payload.name || payload.Name || '',
            surname: payload.surname || payload.Surname || ''
          });

          setProfileError('');
        } else {
          setProfileError(res.data?.message || 'Failed to load profile');
        }
      } catch (err) {
        if (cancelled) return;

        if (attempt === 1) {
          setTimeout(() => fetchProfile(2), 300);
          return;
        }

        console.error('Fetch profile error:', err);
        setProfileError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to load profile'
        );
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    fetchProfile();

    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // FETCH NOTIFICATION PREFERENCES ON MOUNT
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const fetchPrefs = async () => {
      try {
        setPrefsLoading(true);
        const res = await api.get('/staff/me/notifications');
        if (cancelled) return;

        const payload = res.data?.data ?? null;
        const isOk = res.data?.success !== false && !!payload;

        if (isOk) {
          setNotifyCert(payload.notifyOnCertificate ?? true);
          setNotifyReg(payload.notifyOnRegistration ?? true);
          setNotifyWeekly(payload.notifyWeekly ?? false);
        }
      } catch (err) {
        // Silent — if this fails, toggles fall back to defaults and
        // the next toggle attempt will surface the error.
        console.error('Fetch notification prefs error:', err);
      } finally {
        if (!cancelled) setPrefsLoading(false);
      }
    };

    fetchPrefs();

    return () => { cancelled = true; };
  }, []);

  // ============================================================
  // PROFILE HANDLERS
  // ============================================================
  const handleSaveProfile = () => {
    setProfileError('');

    if (name.trim() === originalProfile.name && surname.trim() === originalProfile.surname) {
      showToast('No changes to save.');
      return;
    }

    if (!name.trim() || !surname.trim()) {
      setProfileError('Name and surname are required');
      return;
    }

    setShowProfileModal(true);
  };

  const confirmProfileSave = async () => {
    setProfileSaving(true);
    setProfileError('');

    try {
      const res = await api.put('/staff/me', {
        name: name.trim(),
        surname: surname.trim()
      });

      if (res.data.success) {
        const d = res.data.data || {};
        setOriginalProfile({
          name: d.name || name.trim(),
          surname: d.surname || surname.trim()
        });
        setShowProfileModal(false);
        showToast('Profile updated successfully!');
      } else {
        const messages = (res.data.errors || [])
          .map(e => e.message)
          .join('. ');
        setProfileError(messages || res.data.message || 'Failed to update profile');
        setShowProfileModal(false);
      }
    } catch (err) {
      console.error('Save profile error:', err);
      const messages = (err.response?.data?.errors || [])
        .map(e => e.message)
        .join('. ');
      setProfileError(
        messages ||
        err.response?.data?.message ||
        'Failed to update profile'
      );
      setShowProfileModal(false);
    } finally {
      setProfileSaving(false);
    }
  };

  // ============================================================
  // PASSWORD HANDLERS
  // ============================================================
  const validatePassword = () => {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

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
    setPasswordServerError('');
    const errors = validatePassword();

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      showToast(firstError);
      return;
    }

    setShowPasswordModal(true);
  };

  const confirmPasswordUpdate = async () => {
    setPasswordSaving(true);
    setPasswordServerError('');

    try {
      const res = await api.put('/staff/me/password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.data.success) {
        setShowPasswordModal(false);
        showToast('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
        setShowPasswordRequirements(false);
      } else {
        handlePasswordErrors(res.data);
      }
    } catch (err) {
      console.error('Change password error:', err);
      handlePasswordErrors(err.response?.data || {});
    } finally {
      setPasswordSaving(false);
    }
  };

  const handlePasswordErrors = (data) => {
    setShowPasswordModal(false);

    const fieldErrors = {};
    (data.errors || []).forEach(e => {
      if (e.field) fieldErrors[e.field] = e.message;
    });

    if (Object.keys(fieldErrors).length > 0) {
      setPasswordErrors(fieldErrors);
      setPasswordServerError('');

      if (fieldErrors.currentPassword) {
        showToast(fieldErrors.currentPassword);
      } else {
        const first = Object.values(fieldErrors)[0];
        showToast(first);
      }
    } else {
      const message = data.message || 'Failed to update password';
      setPasswordServerError(message);
      showToast(message);
    }
  };

  // ============================================================
  // LIVE NEW-PASSWORD REQUIREMENTS PANEL
  // ============================================================
  useEffect(() => {
    const hasContent = newPassword.length > 0;
    if (!hasContent) {
      setShowPasswordRequirements(false);
      return;
    }
    setShowPasswordRequirements(!allPasswordRequirementsMet);
  }, [newPassword, allPasswordRequirementsMet]);

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
  // TOGGLE HANDLERS
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

  // ============================================================
  // NOTIFICATION TOGGLE HANDLERS
  //
  // Each toggle flips one pref, then PUTs the full set to the server.
  // Optimistic update — rolls back on failure.
  // ============================================================
  const saveNotificationPrefs = async (next) => {
    const previous = {
      notifyCert,
      notifyReg,
      notifyWeekly,
    };

    // Optimistic flip
    setNotifyCert(next.notifyCert);
    setNotifyReg(next.notifyReg);
    setNotifyWeekly(next.notifyWeekly);
    setPrefsSaving(true);

    try {
      const res = await api.put('/staff/me/notifications', {
        notifyOnCertificate: next.notifyCert,
        notifyOnRegistration: next.notifyReg,
        notifyWeekly: next.notifyWeekly,
      });

      if (res.data?.success === false) {
        throw new Error(res.data?.message || 'Failed to save preference');
      }
    } catch (err) {
      console.error('Save notification prefs error:', err);
      // Roll back
      setNotifyCert(previous.notifyCert);
      setNotifyReg(previous.notifyReg);
      setNotifyWeekly(previous.notifyWeekly);
      showToast('Failed to save preference. Please try again.');
    } finally {
      setPrefsSaving(false);
    }
  };

  const toggleNotifyCert = () => {
    if (prefsLoading || prefsSaving) return;

    const newState = !notifyCert;
    showToast(
      newState
        ? 'Email notifications for certificate issuance have been enabled.'
        : 'Email notifications for certificate issuance have been turned off.'
    );
    saveNotificationPrefs({
      notifyCert: newState,
      notifyReg,
      notifyWeekly,
    });
  };

  const toggleNotifyReg = () => {
    if (prefsLoading || prefsSaving) return;

    const newState = !notifyReg;
    showToast(
      newState
        ? 'Notifications for new learner registrations have been enabled.'
        : 'Notifications for new learner registrations have been turned off.'
    );
    saveNotificationPrefs({
      notifyCert,
      notifyReg: newState,
      notifyWeekly,
    });
  };

  const toggleNotifyWeekly = () => {
    if (prefsLoading || prefsSaving) return;

    const newState = !notifyWeekly;
    showToast(
      newState
        ? 'Weekly summary report notifications have been enabled.'
        : 'Weekly summary report notifications have been turned off.'
    );
    saveNotificationPrefs({
      notifyCert,
      notifyReg,
      notifyWeekly: newState,
    });
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
                  disabled={profileLoading || profileSaving}
                  placeholder={profileLoading ? 'Loading...' : ''}
                />
              </div>
              <div className="profile-item">
                <label>Surname</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="editable-input"
                  disabled={profileLoading || profileSaving}
                  placeholder={profileLoading ? 'Loading...' : ''}
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
            {profileError && (
              <p className="error-text" style={{ marginTop: '10px' }}>{profileError}</p>
            )}
            <button
              className="btn btn-save"
              onClick={handleSaveProfile}
              disabled={profileLoading || profileSaving}
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
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
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  className={`editable-input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                  placeholder="Enter your current password"
                  disabled={passwordSaving}
                />
                {passwordErrors.currentPassword && (
                  <span className="error-text">{passwordErrors.currentPassword}</span>
                )}
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
                    disabled={passwordSaving}
                  />
                  {passwordErrors.newPassword && (
                    <span className="error-text">{passwordErrors.newPassword}</span>
                  )}

                  {/* Live requirements checklist */}
                  {showPasswordRequirements && newPassword && !allPasswordRequirementsMet && (
                    <div className="password-requirements">
                      <p className="requirements-title">Password must contain:</p>
                      <ul className="requirements-list">
                        {PASSWORD_REQUIREMENTS.map(req => {
                          const met = req.test(newPassword);
                          return (
                            <li key={req.id} className={met ? 'met' : 'unmet'}>
                              {met ? '●' : '○'} {req.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
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
                    disabled={passwordSaving}
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="error-text">{passwordErrors.confirmPassword}</span>
                  )}
                </div>
              </div>
              {passwordServerError && (
                <p className="error-text" style={{ marginBottom: '10px' }}>{passwordServerError}</p>
              )}
              <button
                className="btn btn-update"
                onClick={handleUpdatePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
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
                  <option value="90 days">3 months</option>
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
                <div
                  className={`toggle-switch small ${prefsLoading || prefsSaving ? 'toggle-disabled' : ''}`}
                  onClick={toggleNotifyCert}
                  style={prefsLoading || prefsSaving ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
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
                <div
                  className={`toggle-switch small ${prefsLoading || prefsSaving ? 'toggle-disabled' : ''}`}
                  onClick={toggleNotifyReg}
                  style={prefsLoading || prefsSaving ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
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
                <div
                  className={`toggle-switch small ${prefsLoading || prefsSaving ? 'toggle-disabled' : ''}`}
                  onClick={toggleNotifyWeekly}
                  style={prefsLoading || prefsSaving ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
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
        <div className="logout-modal-overlay" onClick={() => !profileSaving && setShowProfileModal(false)}>
          <div className="logout-modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Changes</h2>
              <button
                className="logout-modal-close"
                onClick={() => setShowProfileModal(false)}
                disabled={profileSaving}
              >×</button>
            </div>
            <div className="logout-modal-body">
              <p className="confirmation-message confirmation-question">Are you sure you want to save changes to your profile?</p>
              <p className="logout-modal-warning confirmation-message">Your name and surname will be updated across the system.</p>
            </div>
            <div className="logout-modal-actions">
              <button
                className="logout-modal-btn cancel-btn"
                onClick={() => setShowProfileModal(false)}
                disabled={profileSaving}
              >No, Stay</button>
              <button
                className="logout-modal-btn confirm-btn"
                onClick={confirmProfileSave}
                disabled={profileSaving}
              >{profileSaving ? 'Saving...' : 'Yes, Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PASSWORD MODAL ==================== */}
      {showPasswordModal && (
        <div className="logout-modal-overlay" onClick={() => !passwordSaving && setShowPasswordModal(false)}>
          <div className="logout-modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Password Update</h2>
              <button
                className="logout-modal-close"
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordSaving}
              >×</button>
            </div>
            <div className="logout-modal-body">
              <p className="confirmation-message confirmation-question">Are you sure you want to modify this password?</p>
              <p className="logout-modal-warning confirmation-message">Continuing will result in use of the new password.</p>
            </div>
            <div className="logout-modal-actions">
              <button
                className="logout-modal-btn cancel-btn"
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordSaving}
              >No, Cancel</button>
              <button
                className="logout-modal-btn confirm-btn"
                onClick={confirmPasswordUpdate}
                disabled={passwordSaving}
              >{passwordSaving ? 'Updating...' : 'Yes, Update'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BACKUP MODAL ==================== */}
      {showBackupModal && (
        <div className="logout-modal-overlay" onClick={cancelBackup}>
          <div className="logout-modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Backup</h2>
              <button className="logout-modal-close" onClick={cancelBackup}>×</button>
            </div>
            <div className="logout-modal-body">
              <p className="confirmation-message confirmation-question">Are you sure you want to backup?</p>
              <p className="logout-modal-warning confirmation-message">This will create a new backup of your system data.</p>
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
          <div className="logout-modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Confirm Restore</h2>
              <button className="logout-modal-close" onClick={cancelRestore}>×</button>
            </div>
            <div className="logout-modal-body">
              <p className="confirmation-message confirmation-question">Are you sure you want to restore data from this date?</p>
              <p className="logout-modal-warning confirmation-message">Restore point: {selectedRestorePoint}</p>
            </div>
            <div className="logout-modal-actions">
              <button className="logout-modal-btn cancel-btn" onClick={cancelRestore}>No, Cancel</button>
              <button className="logout-modal-btn confirm-btn" onClick={confirmRestore}>Yes, Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST POPUP ==================== */}
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