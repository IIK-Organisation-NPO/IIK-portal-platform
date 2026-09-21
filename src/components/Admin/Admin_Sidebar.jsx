// src/components/Admin/Admin_Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Admin/Admin_Sidebar.css';
import { navigationAPI } from '../../services/api';

const Admin_Sidebar = ({ active = 'dashboard', isMobileOpen, onClose }) => {
    const navigate = useNavigate();

    // State to control the logout confirmation modal visibility
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Nav items are now driven by the backend based on the user's role.
    const [navItems, setNavItems] = useState([]);
    const [navLoading, setNavLoading] = useState(true);

    // ============================================
    // FETCH NAV ITEMS BASED ON ROLE
    // ============================================
    useEffect(() => {
        let cancelled = false;

        const loadNav = async () => {
            try {
                const res = await navigationAPI.getAdminNav();

                if (!cancelled && res.data?.success) {
                    setNavItems(res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load navigation:', err);

                // Fallback: show safe items only (no Staff Management)
                if (!cancelled) {
                    setNavItems([
                        { id: 'dashboard',    label: 'Dashboard',    icon: 'fa-th-large',   path: '/admin-dashboard' },
                        { id: 'analytics',    label: 'Analytics',    icon: 'fa-chart-line', path: '/admin-analytics' },
                        { id: 'learners',     label: 'Learners',     icon: 'fa-users',      path: '/admin/learners' },
                        { id: 'certificates', label: 'Certificates', icon: 'fa-certificate',path: '/admin-certificates' },
                        { id: 'programmes',   label: 'Programmes',   icon: 'fa-book-open',  path: '/admin/programmes' },
                        { id: 'blog',         label: 'Blog & News',  icon: 'fa-newspaper',  path: '/admin/blog-management' },
                        { id: 'settings',     label: 'Settings',     icon: 'fa-cog',        path: '/admin/settings' },
                    ]);
                }
            } finally {
                if (!cancelled) setNavLoading(false);
            }
        };

        loadNav();
        return () => { cancelled = true; };
    }, []);

    // Open the logout confirmation modal
    const handleLogoutClick = () => {
        setShowLogoutModal(true);
        if (onClose) onClose();
    };

    // Confirm logout - actually perform the logout
    const confirmLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        setShowLogoutModal(false);
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
                <div className="admin-sidebar-overlay" onClick={onClose}></div>
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar-menu-label">Admin Portal</div>

                <nav className="admin-sidebar-nav">
                    {navLoading ? (
                        <div className="admin-sidebar-loading">Loading…</div>
                    ) : (
                        <>
                            {/* Role-filtered nav items from the backend */}
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={active === item.id ? 'active' : ''}
                                    onClick={onClose}
                                >
                                    <i className={`fas ${item.icon}`}></i>
                                    <span>{item.label}</span>
                                </Link>
                            ))}

                            {/* Logout — always present, not from the API */}
                            <button
                                className="admin-logout-nav-item"
                                onClick={handleLogoutClick}
                            >
                                <i className="fas fa-sign-out-alt"></i>
                                <span>Logout</span>
                            </button>
                        </>
                    )}
                </nav>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="logout-modal-overlay" onClick={cancelLogout}>
                    <div className="logout-modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-header">
                            <h2>Confirm Logout</h2>
                            <button className="logout-modal-close" onClick={cancelLogout}>×</button>
                        </div>

                        <div className="logout-modal-body">
                            <p className="confirmation-message confirmation-question">Are you sure you want to logout?</p>
                            <p className="logout-modal-warning confirmation-message">
                                You will be redirected to the login page and will need to sign in again to access the admin panel.
                            </p>
                        </div>

                        <div className="logout-modal-actions">
                            <button className="logout-modal-btn cancel-btn" onClick={cancelLogout}>
                                No, Stay Logged In
                            </button>
                            <button className="logout-modal-btn confirm-btn" onClick={confirmLogout}>
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