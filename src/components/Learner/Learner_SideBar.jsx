import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Learner/Learner_SideBar.css';

const Learner_SideBar = ({ active = 'dashboard', isMobileOpen, onClose }) => {
  const navigate = useNavigate();
  
  // State to control the logout confirmation modal visibility
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/learner-dashboard' },
    { id: 'programmes', label: 'Programmes', icon: 'fa-book-open', path: '/learner-programmes' },
    { id: 'certificates', label: 'Certificates', icon: 'fa-certificate', path: '/learner-certificates' },
    { id: 'profile', label: 'Profile', icon: 'fa-user', path: '/learner/profile' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog', path: '/learner/settings' },
    { id: 'logout', label: 'Logout', icon: 'fa-sign-out-alt', path: '#', isLogout: true },
  ];

  // Open the logout confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    // Close mobile menu if open
    if (onClose) onClose();
  };

  // Confirm logout - actually perform the logout
  const confirmLogout = () => {
    // Add your logout logic here
    // For example: clear tokens, user session, etc.
    localStorage.removeItem('token'); // Clear learner token
    localStorage.removeItem('user');  // Clear user data
    sessionStorage.clear(); // Clear any session data
    
    // Close the modal
    setShowLogoutModal(false);
    
    // Navigate to login page
    navigate('/login');
  };

  // Cancel logout - close the modal without logging out
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <aside className={`learner-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-menu-label">Portal Menu</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.isLogout) {
              return (
                <button
                  key={item.id}
                  className="logout-nav-item"
                  onClick={handleLogoutClick}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.id}
                to={item.path}
                className={active === item.id ? 'active' : ''}
                onClick={onClose}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={cancelLogout}>
          <div className="logout-modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="logout-modal-header">
              <h2>Confirm Logout</h2>
              <button className="logout-modal-close" onClick={cancelLogout}>
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="logout-modal-body">
              <p className="confirmation-message confirmation-question">Are you sure you want to logout?</p>
              <p className="logout-modal-warning confirmation-message">
                You will be redirected to the login page and will need to sign in again to access the learner portal.
              </p>
            </div>
            
            {/* Modal Actions */}
            <div className="logout-modal-actions">
              <button 
                className="logout-modal-btn cancel-btn" 
                onClick={cancelLogout}
              >
                No, Stay Logged In
              </button>
              <button 
                className="logout-modal-btn confirm-btn" 
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Learner_SideBar;