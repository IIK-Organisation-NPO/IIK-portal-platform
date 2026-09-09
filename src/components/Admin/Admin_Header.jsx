// src/components/Admin/Admin_Header.jsx
import React from 'react';
import '../../styles/Admin/Admin_Header.css';
import logo from '../../assets/images/small Mki.png'; // Adjust path as needed

const Admin_Header = ({ 
  userName = 'Admin Workspace', 
  onMenuToggle, 
  isMobileMenuOpen 
}) => {
  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return 'A';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(userName);

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
          {userName.split(' ')[0]} <span>{userName.split(' ').slice(1).join(' ')}</span>
        </span>
      </div>
    </header>
  );
};

export default Admin_Header;