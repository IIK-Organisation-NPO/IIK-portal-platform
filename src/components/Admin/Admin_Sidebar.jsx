// src/components/Admin/Admin_Sidebar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Admin/Admin_Sidebar.css';

const Admin_Sidebar = ({ active = 'dashboard', isMobileOpen, onClose }) => {
    const navigate = useNavigate();

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

    const handleLogout = () => {
        // Add your logout logic here
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="admin-sidebar-overlay" onClick={onClose}></div>
            )}

            <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar-menu-label">Admin Portal</div>

                <nav className="admin-sidebar-nav">
                    {navItems.map((item) => {
                        if (item.isLogout) {
                            return (
                                <button
                                    key={item.id}
                                    className="admin-logout-nav-item"
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

                <div className="admin-sidebar-version">
                    <small>v2.0.0</small>
                </div>
            </aside>
        </>
    );
};

export default Admin_Sidebar;