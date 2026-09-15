import { useEffect, useRef, useState } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Settings.css';

const SettingsPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    certificateIssued: true,
    newProgramme: true
  });
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

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => {
      const newState = !prev[key];
      const message = key === 'certificateIssued'
        ? `Email notifications for certificate issuance have been ${newState ? 'enabled.' : 'turned off.'}`
        : `Notifications for new programme availability have been ${newState ? 'enabled.' : 'turned off.'}`;

      showToast(message);
      return { ...prev, [key]: newState };
    });
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

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);
  }, []);

  return (
    <div className="settings-layout">
      <Learner_Header
        userName="Sarah Khumalo"
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
          {/* Header Section */}
          <section className="settings-hero">
            <div className="hero-content">
              <h1>Settings</h1>
              <p className="hero-subtitle">
                Manage your notification preferences.
              </p>
            </div>
          </section>

          <div className="settings-content">
            {/* Notification Preferences */}
            <div className="settings-card">
              <div className="card-header">
                <h2>Notification Preferences</h2>
              </div>
              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-text">
                    <h3>Email me when a certificate is issued</h3>
                    <p>Receive an email copy every time you complete a course and a certificate is issued.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.certificateIssued}
                      onChange={() => handleNotificationToggle('certificateIssued')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-text">
                    <h3>Notify me of new programme availability</h3>
                    <p>Get notified when new programmes are published and available for enrollment.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications.newProgramme}
                      onChange={() => handleNotificationToggle('newProgramme')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* POPIA Notice */}
            <div className="popia-notice">
              <strong>POPIA Notice:</strong> All personal information shown on this profile is processed in compliance with the South African Protection of Personal Information Act (POPIA). Your ID and contact details are fully encrypted and only used for verified academic credential issuance.
            </div>
          </div>
        </main>
      </div>

      {toastMessage && (
        <div className={`toast-message ${toastVisible ? 'toast-enter' : 'toast-exit'}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;