// src/pages/Admin_Screens/Admin_Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_Dashboard.css';
import api from '../../services/api';

const Admin_Dashboard = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeNav, setActiveNav] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminName, setAdminName] = useState('Admin Workspace');
    const navigate = useNavigate();

    // Stats data from database
    const [stats, setStats] = useState([
        { 
            label: 'Total Learners', 
            value: 0, 
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
        },
        { 
            label: 'Active Programmes', 
            value: 0, 
            icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
        },
        { 
            label: 'Certificates Issued', 
            value: 0, 
            icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
        },
        { 
            label: 'Pending Certificates', 
            value: 0, 
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        },
    ]);

    // Programme interest data from database
    const [programmes, setProgrammes] = useState([]);

    // Recent activity data from database
    const [activities, setActivities] = useState([]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // ============================================
    // PLURALIZATION HELPER
    // ============================================
    const pluralize = (count, singular, plural) => {
        return count === 1 ? singular : plural;
    };

    // Get user data from localStorage
    const getUserData = () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.name) {
                    const fullName = `${user.name} ${user.surname || ''}`.trim();
                    setAdminName(fullName || 'Admin Workspace');
                }
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    };

    // ============================================
    // FORMAT TIME AGO
    // ============================================
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} ${pluralize(diffMins, 'minute', 'minutes')} ago`;
        if (diffHours < 24) return `${diffHours} ${pluralize(diffHours, 'hour', 'hours')} ago`;
        if (diffDays < 7) return `${diffDays} ${pluralize(diffDays, 'day', 'days')} ago`;
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // ============================================
    //  FETCH DASHBOARD DATA
    // ============================================
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch stats
            const statsResponse = await api.get('/admin/stats');
            if (statsResponse.data.success) {
                const data = statsResponse.data.data;
                setStats([
                    { 
                        label: 'Total Learners', 
                        value: data.totalLearners || 0, 
                        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                    },
                    { 
                        label: 'Active Programmes', 
                        value: data.totalProgrammes || 0, 
                        icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
                    },
                    { 
                        label: 'Certificates Issued', 
                        value: data.totalCertificates || 0, 
                        icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222'
                    },
                    { 
                        label: 'Pending Certificates', 
                        value: data.inProgressEnrollments || 0, 
                        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    },
                ]);
            }

            // Fetch programmes with interest counts using the new endpoint
            const programmesResponse = await api.get('/admin/programme-interest-counts');
            if (programmesResponse.data.success) {
                const data = programmesResponse.data.data || [];
                setProgrammes(data.map(prog => ({
                    Programme_name: prog.Programme_name,
                    interested: prog.interested_count || 0,
                    lastDate: prog.last_interest_date ? 
                        new Date(prog.last_interest_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        }) : 'N/A'
                })));
            }

            // Fetch activities
            const activitiesResponse = await api.get('/admin/activities');
            if (activitiesResponse.data.success) {
                const activitiesData = activitiesResponse.data.data || [];
                setActivities(activitiesData.map(activity => ({
                    time: formatTimeAgo(activity.created_at || activity.timestamp),
                    description: activity.activity_description || activity.description || 'Activity recorded'
                })));
            }

            setLoading(false);
        } catch (err) {
            console.error(' Error fetching dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
            setLoading(false);
        }
    };

    // Load data on mount
    useEffect(() => {
        getUserData();
        fetchDashboardData();
    }, []);

    const handleViewInterested = (programmeName) => {
        navigate('/admin/interested-learners', { 
            state: { programme: programmeName } 
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="admin-dashboard-layout">
                <Admin_Header 
                    onMenuToggle={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                />
                <div className="admin-dashboard-body">
                    <Admin_Sidebar 
                        active={activeNav}
                        isMobileOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                    />
                    <div className="admin-dashboard-content">
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div className="loading-spinner" style={{ 
                                width: '40px', 
                                height: '40px', 
                                border: '4px solid #f3f3f3', 
                                borderTop: '4px solid #000', 
                                borderRadius: '50%', 
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px'
                            }}></div>
                            <p>Loading dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="admin-dashboard-layout">
                <Admin_Header 
                    onMenuToggle={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                />
                <div className="admin-dashboard-body">
                    <Admin_Sidebar 
                        active={activeNav}
                        isMobileOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                    />
                    <div className="admin-dashboard-content">
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <h3 style={{ color: '#dc3545' }}>⚠️ Unable to load dashboard</h3>
                            <p style={{ color: '#666' }}>{error}</p>
                            <button 
                                onClick={fetchDashboardData}
                                style={{
                                    marginTop: '20px',
                                    padding: '10px 30px',
                                    background: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout">
            <Admin_Header 
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            
            <div className="admin-dashboard-body">
                <Admin_Sidebar 
                    active={activeNav}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <div className="admin-dashboard-content">
                    {/* Welcome Section */}
                    <div className="admin-dashboard-welcome">
                        <h1>Welcome back, {adminName}</h1>
                        <p>Operational overview, pending credential reviews, and recent registrations.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="admin-stats-grid">
                        {stats.map((stat, index) => (
                            <div className="admin-stat-card" key={index}>
                                <div className="admin-stat-header">
                                    <div className="admin-stat-icon">
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="#111827" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d={stat.icon} />
                                        </svg>
                                    </div>
                                    <div className="admin-stat-label">{stat.label}</div>
                                </div>
                                <div className="admin-stat-value">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Programme Interest Overview */}
                    <div className="admin-programmes-section">
                        <h2>Programme Interest Overview</h2>
                        
                        <div className="admin-table-responsive">
                            <table className="admin-programme-table">
                                <thead>
                                    <tr>
                                        <th>PROGRAMME</th>
                                        <th>INTERESTED</th>
                                        <th>LAST DATE</th>
                                        <th>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {programmes && programmes.length > 0 ? (
                                        programmes.map((prog, index) => (
                                            <tr key={index}>
                                                <td>{prog.Programme_name}</td>
                                                <td>
                                                    <span className="admin-interest-badge">
                                                        {prog.interested} {pluralize(prog.interested, 'Learner', 'Learners')}
                                                    </span>
                                                </td>
                                                <td>{prog.lastDate || 'N/A'}</td>
                                                <td>
                                                    <button 
                                                        className="admin-view-btn"
                                                        onClick={() => handleViewInterested(prog.Programme_name)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                                No programmes available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="admin-activity-section">
                        <h2>Recent Activity</h2>
                        <div className="admin-activity-list">
                            {activities && activities.length > 0 ? (
                                activities.map((activity, index) => (
                                    <div className="admin-activity-item" key={index}>
                                        <div className="admin-activity-time">{activity.time}</div>
                                        <div className="admin-activity-desc">{activity.description}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="admin-activity-item">
                                    <div className="admin-activity-desc" style={{ color: '#888' }}>
                                        No recent activities
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add spin animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Admin_Dashboard;