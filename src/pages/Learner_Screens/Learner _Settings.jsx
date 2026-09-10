import React, { useState } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Settings.css';

const SettingsPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Sarah',
    surname: 'Khumalo',
    email: 'sarah.khumalo@example.com',
    phone: '+27 82 123 4567'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    certificateIssued: true,
    newProgramme: true
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    alert('Profile changes saved!');
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    alert('Password updated successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

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
                Manage your account profile, security, and notification preferences.
              </p>
            </div>
          </section>

          <div className="settings-content">
            {/* Account Profile */}
            <div className="settings-card">
              <div className="card-header">
                <h2>Account Profile</h2>
                <p className="card-subtitle">
                  Update your personal details and contact information.
                </p>
              </div>
              <form className="profile-form" onSubmit={handleSaveChanges}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="surname">Surname</label>
                    <input
                      type="text"
                      id="surname"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-footer">
                  <span className="last-updated">Last updated September 8</span>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Security Settings */}
            <div className="settings-card">
              <div className="card-header">
                <h2>Security Settings</h2>
              </div>
              <form className="security-form" onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••••"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••••"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••••"
                    />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="submit" className="btn-primary">
                    Update Password
                  </button>
                </div>
              </form>
            </div>

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
    </div>
  );
};

export default SettingsPage;