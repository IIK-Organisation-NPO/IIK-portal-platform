import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Learner/Learner_SideBar.css';

const Learner_SideBar = ({ active = 'dashboard', isMobileOpen, onClose }) => {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/learner-dashboard' },
    { id: 'programmes', label: 'Programmes', icon: 'fa-book-open', path: '/learner/programmes' },
    { id: 'certificates', label: 'Certificates', icon: 'fa-certificate', path: '/learner/certificates' },
    { id: 'blog', label: 'Blog', icon: 'fa-blog', path: '/learner/blog' },
    { id: 'profile', label: 'Profile', icon: 'fa-user', path: '/learner/profile' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog', path: '/learner/settings' },
    { id: 'logout', label: 'Logout', icon: 'fa-sign-out-alt', path: '#', isLogout: true },
  ];

  const handleLogout = () => {
    // Add your logout logic here
    navigate('/login');
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
                  onClick={() => {
                    handleLogout();
                    if (onClose) onClose();
                  }}
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

        <div className="sidebar-version">
          <small>v2.0.0</small>
        </div>
      </aside>
    </>
  );
};

export default Learner_SideBar;