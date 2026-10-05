// src/pages/Learner_Screens/Learner _Settings.jsx
import { useEffect, useRef, useState } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Settings.css';
import { API } from '../../config/api';

const SettingsPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    certificateIssued: true,
    newProgramme: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const toastCleanupRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getAuthHeaders = (extra = {}) => {
    const token = localStorage.getItem('token');
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
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
    let cancelled = false;

    const load = async () => {
      try {
        setPrefsLoading(true);
        const res = await fetch(API.learner.notifications, {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        const data = await res.json();
        if (cancelled) return;

        const payload = data?.data ?? null;
        const isOk = data?.success === true || data?.status === 'success';

        if (res.ok && isOk && payload) {
          setNotifications({
            certificateIssued: payload.certificateIssued ?? true,
            newProgramme: payload.newProgramme ?? true,
          });
        }
      } catch (err) {
        console.error('Load notification prefs error:', err);
      } finally {
        if (!cancelled) setPrefsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  
  const handleNotificationToggle = async (key) => {
    if (saving || prefsLoading) return;

    const next = { ...notifications, [key]: !notifications[key] };
    const previous = notifications;

    setNotifications(next);
    setSaving(true);

    const message =
      key === 'certificateIssued'
        ? `Email notifications for certificate issuance have been ${
            next.certificateIssued ? 'enabled.' : 'turned off.'
          }`
        : `Notifications for new programme availability have been ${
            next.newProgramme ? 'enabled.' : 'turned off.'
          }`;
    showToast(message);

    try {
      const res = await fetch(API.learner.notifications, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(next),
      });

      const data = await res.json();
      const isOk = data?.success === true || data?.status === 'success';

      if (!res.ok || !isOk) {
        setNotifications(previous);
        showToast(data?.message || 'Failed to save preference.');
      }
    } catch (err) {
      console.error('Save notification prefs error:', err);
      setNotifications(previous);
      showToast('Failed to save preference.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);
    },
    []
  );

  return (
    <div className="learner-certificates-layout">
      <Learner_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="settings-body">
        <Learner_SideBar
          active="settings"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="settings-page">
          <section className="settings-hero">
            <div className="hero-content">
              <h1>Settings</h1>
              <p className="hero-subtitle">
                Manage your notification preferences.
              </p>
            </div>
          </section>

          <div className="settings-content">
            <div className="settings-card">
              <div className="card-header">
                <h2>Notification Preferences</h2>
              </div>
              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-text">
                    <h3>Email me when a certificate is issued</h3>
                    <p>
                      Receive an email copy every time you complete a course and
                      a certificate is issued.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.certificateIssued}
                      onChange={() =>
                        handleNotificationToggle('certificateIssued')
                      }
                      disabled={prefsLoading || saving}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-text">
                    <h3>Notify me of new programme availability</h3>
                    <p>
                      Get notified when new programmes are published and
                      available for enrollment.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.newProgramme}
                      onChange={() => handleNotificationToggle('newProgramme')}
                      disabled={prefsLoading || saving}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="popia-notice">
              <strong>POPIA Notice:</strong> All personal information shown on
              this profile is processed in compliance with the South African
              Protection of Personal Information Act (POPIA). Your ID and
              contact details are fully encrypted and only used for verified
              academic credential issuance.
            </div>
          </div>
        </main>
      </div>

      {toastMessage && (
        <div
          className={`toast-message ${
            toastVisible ? 'toast-enter' : 'toast-exit'
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;