// src/components/Admin/Admin_Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Admin/Admin_Sidebar.css';
import { navigationAPI } from '../../services/api';

const CENTRE_NAV_ITEM = {
    id: 'centres',
    label: 'Centre Management',
    icon: 'fa-map-marker-alt',
    path: '/admin/centres',
};

const HELP_NAV_ITEM = {
    id: 'help',
    label: 'Help & Support',
    icon: 'fa-question-circle',
    path: '/admin/help',
};

// Centre Management sits directly below Staff Management (above Settings)
const withCentreManagement = (items) => {
    if (items.some((item) => item.id === CENTRE_NAV_ITEM.id)) return items;

    const staffIndex = items.findIndex((item) => item.id === 'staff');
    if (staffIndex === -1) return items;

    return [
        ...items.slice(0, staffIndex + 1),
        CENTRE_NAV_ITEM,
        ...items.slice(staffIndex + 1),
    ];
};

// Help sits directly BELOW Settings
const withHelp = (items) => {
    if (items.some((item) => item.id === HELP_NAV_ITEM.id)) return items;

    const settingsIndex = items.findIndex((item) => item.id === 'settings');
    if (settingsIndex === -1) {
        // If no settings tab exists, just append help at the end
        return [...items, HELP_NAV_ITEM];
    }

    // Insert Help AFTER Settings
    return [
        ...items.slice(0, settingsIndex + 1),
        HELP_NAV_ITEM,
        ...items.slice(settingsIndex + 1),
    ];
};

const Admin_Sidebar = ({ active = 'dashboard', isMobileOpen, onClose }) => {
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
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
                    // Apply both Centre Management and Help injections
                    let items = withCentreManagement(res.data.data || []);
                    items = withHelp(items);
                    setNavItems(items);
                }
            } catch (err) {
                console.error('Failed to load navigation:', err);

                // Fallback: show safe items + centre + help
                if (!cancelled) {
                    const fallbackItems = [
                        { id: 'dashboard',    label: 'Dashboard',    icon: 'fa-th-large',   path: '/admin-dashboard' },
                        { id: 'analytics',    label: 'Analytics',    icon: 'fa-chart-line', path: '/admin-analytics' },
                        { id: 'learners',     label: 'Learners',     icon: 'fa-users',      path: '/admin/learners' },
                        { id: 'certificates', label: 'Certificates', icon: 'fa-certificate',path: '/admin-certificates' },
                        { id: 'programmes',   label: 'Programmes',   icon: 'fa-book-open',  path: '/admin/programmes' },
                        { id: 'blog',         label: 'Blog & News',  icon: 'fa-newspaper',  path: '/admin/blog-management' },
                        { id: 'settings',     label: 'Settings',     icon: 'fa-cog',        path: '/admin/settings' },
                    ];
                    setNavItems(withHelp(fallbackItems));
                }
            } finally {
                if (!cancelled) setNavLoading(false);
            }
        };

        loadNav();
        return () => { cancelled = true; };
    }, []);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
        if (onClose) onClose();
    };

    const confirmLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        setShowLogoutModal(false);
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    return (
        <>
            {isMobileOpen && (
                <div className="admin-sidebar-overlay" onClick={onClose}></div>
            )}

            <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="admin-sidebar-menu-label">Admin Portal</div>

                <nav className="admin-sidebar-nav">
                    {navLoading ? (
                        <div className="admin-sidebar-loading">Loading…</div>
                    ) : (
                        <>
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