// src/components/Admin/Admin_Sidebar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Admin/Admin_Sidebar.css';

const Admin_Sidebar = ({ active = 'dashboard', isMobileOpen, onClose }) => {
    const navigate = useNavigate();
    
    // State to control the logout confirmation modal visibility
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/admin-dashboard' },
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-line', path: '/admin/analytics' },
        { id: 'learners', label: 'Learners', icon: 'fa-users', path: '/admin/learners' },
        { id: 'certificates', label: 'Certificates', icon: 'fa-certificate', path: '/admin-certificates' },
        { id: 'programmes', label: 'Programmes', icon: 'fa-book-open', path: '/admin/programmes' },
        { id: 'blog', label: 'Blog & News', icon: 'fa-newspaper', path: '/admin/blog' },
        { id: 'staff', label: 'Staff Management', icon: 'fa-user-cog', path: '/admin/staff' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog', path: '/admin/settings' },
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
        localStorage.removeItem('adminToken'); // Example: clear token
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
            {/* Mobile Overlay - appears when sidebar is open on mobile */}
            {isMobileOpen && (
                <div className="admin-sidebar-overlay" onClick={onClose}></div>
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar-menu-label">Admin Portal</div>

                <nav className="admin-sidebar-nav">
                    {navItems.map((item) => {
                        // Check if this is the logout item
                        if (item.isLogout) {
                            return (
                                <button
                                    key={item.id}
                                    className="admin-logout-nav-item"
                                    onClick={handleLogoutClick}
                                >
                                    <i className={`fas ${item.icon}`}></i>
                                    <span>{item.label}</span>
                                </button>
                            );
                        }
                        // Regular navigation items
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

                <div className="admin-sidebar-version">
                    <small>v2.0.0</small>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="logout-modal-overlay" onClick={cancelLogout}>
                    <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="logout-modal-header">
                            <h2>Confirm Logout</h2>
                            <button className="logout-modal-close" onClick={cancelLogout}>
                                ×
                            </button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="logout-modal-body">
                            <p>Are you sure you want to logout?</p>
                            <p className="logout-modal-warning">
                                You will be redirected to the login page and will need to sign in again to access the admin panel.
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

export default Admin_Sidebar;