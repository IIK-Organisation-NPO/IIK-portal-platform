// src/components/Admin/Admin_Header.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/Admin/Admin_Header.css';
import logo from '../../assets/images/small Mki.png';
import api from '../../services/api';

const Admin_Header = ({
  userName: propUserName,
  onMenuToggle,
  isMobileMenuOpen
}) => {
  const [userName, setUserName] = useState(propUserName || 'Admin Workspace');

  // ---------------------------------------------------------------
  // Build the display name from the API / cached shape
  // ---------------------------------------------------------------
  const buildName = (data) => {
    if (!data) return propUserName || 'Admin Workspace';

    const first = (data.name || data.Name || '').trim();
    const last  = (data.surname || data.Surname || '').trim();

    if (!first) return propUserName || 'Admin Workspace';
    if (!last) return first;
    if (first.toLowerCase().includes(last.toLowerCase())) return first;
    return `${first} ${last}`.trim();
  };

  // ---------------------------------------------------------------
  // Load the admin profile:
  //   1. Optimistically use whatever is in localStorage (fast paint)
  //   2. Fetch the authoritative profile from /staff/me (Admin table)
  // ---------------------------------------------------------------
  useEffect(() => {
    // Step 1 — quick, cached name
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const cached = JSON.parse(raw);
        setUserName(buildName(cached));
      }
    } catch { /* ignore */ }

    // Step 2 — authoritative fetch from the Admin table
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const res = await api.get('/staff/me');
        if (cancelled) return;

        if (res.data?.success && res.data?.data) {
          const admin = res.data.data;
          setUserName(buildName(admin));

          // Keep localStorage in sync so other pages see the same shape
          try {
            const existing = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem(
              'user',
              JSON.stringify({
                ...existing,
                name: admin.name,
                surname: admin.surname,
                email: admin.email
              })
            );
          } catch { /* ignore */ }
        }
      } catch (err) {
        // Silent — the cached name is already displayed
        console.warn('Header: could not fetch /staff/me:', err.message);
      }
    };

    loadProfile();

    return () => { cancelled = true; };
  }, [propUserName]);

  // ---------------------------------------------------------------
  // Refresh on userUpdated (fired by Settings after save) and across tabs
  // ---------------------------------------------------------------
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const cached = JSON.parse(raw);
          setUserName(buildName(cached));
        }
      } catch { /* ignore */ }
    };

    window.addEventListener('userUpdated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('userUpdated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [propUserName]);

  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const initials = getInitials(userName);
  const firstName = userName.split(' ')[0];
  const lastName  = userName.split(' ').slice(1).join(' ');

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button
          className="admin-menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <div className="admin-header-logo">
          <img src={logo} alt="IIK Portal Logo" />
          <span className="admin-header-title">Admin Certificate Portal</span>
        </div>
      </div>

      <div className="admin-header-right">
        <div className="admin-user-avatar" title={userName}>
          {initials}
        </div>
        <span className="admin-user-name">
          {firstName} <span>{lastName}</span>
        </span>
      </div>
    </header>
  );
};

export default Admin_Header;