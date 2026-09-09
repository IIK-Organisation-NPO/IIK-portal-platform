import React from 'react';
import '../../styles/Learner/Learner_Header.css';
import logo from '../../assets/images/small Mki.png'; // Adjust path as needed

const Learner_Header = ({ 
  userName = 'Sarah Khumalo', 
  onMenuToggle, 
  isMobileMenuOpen 
}) => {
  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(userName);

  return (
    <header className="learner-header">
      <div className="header-left">
        <button 
          className="menu-toggle" 
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <div className="header-logo">
          <img src={logo} alt="IIK Portal Logo" />
          <span className="header-title">Learner Certificate Portal</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-avatar" title={userName}>
          {initials}
        </div>
        <span className="user-name">
          {userName.split(' ')[0]} <span>{userName.split(' ').slice(1).join(' ')}</span>
        </span>
      </div>
    </header>
  );
};

export default Learner_Header;