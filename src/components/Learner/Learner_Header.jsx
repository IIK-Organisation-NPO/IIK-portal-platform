import React, { useEffect, useState } from 'react';
import '../../styles/Learner/Learner_Header.css';
import logo from '../../assets/images/small Mki.png';

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:5000';

// ---------------------------------------------------------------------------
// Extract a display name from whatever shape the user object happens to be.
// Supports: { fullName } | { name } | { firstName, lastName } | { email }
// ---------------------------------------------------------------------------
const resolveUserName = (user) => {
  if (!user) return '';
  const full =
    user.fullName ||
    user.name ||
    `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (full) return full;
  if (user.email) {
    const local = user.email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return '';
};

// ---------------------------------------------------------------------------
// Read the cached user synchronously (first paint), then confirm with the API.
// ---------------------------------------------------------------------------
const readCachedUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const Learner_Header = ({
  userName,          // optional override — pages that already pass this still work
  onMenuToggle,
  isMobileMenuOpen
}) => {
  // Seed from cache so the first render shows the name instantly.
  const [resolvedName, setResolvedName] = useState(
    () => userName || resolveUserName(readCachedUser()) || ''
  );

  // If a page explicitly passes userName, respect it (existing behaviour).
  useEffect(() => {
    if (userName) {
      setResolvedName(userName);
    }
  }, [userName]);

  // Otherwise, fetch the profile once so we always have the freshest name.
  useEffect(() => {
    if (userName) return; // page supplied a name; nothing to fetch

    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/learner/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        const profile = data?.data;
        const name = resolveUserName(profile);

        if (!cancelled && name) {
          setResolvedName(name);
          // Keep the cache in sync for other pages.
          localStorage.setItem('user', JSON.stringify(profile));
        }
      } catch {
        // Silent — the cached name is already displayed.
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userName]);

  const displayName = resolvedName || 'Learner';

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const initials = getInitials(displayName);
  const first = displayName.split(/\s+/)[0] || '';
  const rest = displayName.split(/\s+/).slice(1).join(' ');

  return (
    <header className="learner-header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
        <div className="header-logo">
          <img src={logo} alt="IIK Portal Logo" />
          <span className="header-title">Learner Certificate Portal</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-avatar" title={displayName}>
          {initials}
        </div>
        <span className="user-name">
          {first} <span>{rest}</span>
        </span>
      </div>
    </header>
  );
};

export default Learner_Header;