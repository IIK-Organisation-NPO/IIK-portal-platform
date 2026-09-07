// src/pages/Admin_Screens/Admin_Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_Dashboard.css';

const Admin_Dashboard = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeNav, setActiveNav] = useState('dashboard');
    const navigate = useNavigate();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Stats data with correct icons
    const stats = [
        { 
            label: 'Total Learners', 
            value: 247, 
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' // Users icon
        },
        { 
            label: 'Active Programmes', 
            value: 3, 
            icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' // Graduation icon
        },
        { 
            label: 'Certificates Issued', 
            value: 189, 
            icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' // Certificate/Ribbon badge icon
        },
        { 
            label: 'Pending Certificates', 
            value: 12, 
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' // Clock icon
        },
    ];

    // Programme interest data
    const programmes = [
        { name: 'Digital Literacy', interested: 45, lastDate: 'May 15, 2026' },
        { name: 'Microsoft 365', interested: 36, lastDate: 'May 14, 2026' },
        { name: 'Digital Marketing', interested: 52, lastDate: 'May 16, 2026' },
    ];

    // Recent activity data
    const activities = [
        { time: '10 minutes ago', description: 'Certificate issued to Jane Doe — Digital Literacy.' },
        { time: '1 hour ago', description: 'New learner registered: John Smith' },
        { time: '2 hours ago', description: 'Staff member updated program info: Microsoft 365' },
    ];

    const handleViewInterested = (programmeName) => {
        // Navigate to interested learners page with programme name as state
        navigate('/admin/interested-learners', { 
            state: { programme: programmeName } 
        });
    };

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
                        <h1>Welcome back, Admin Workspace</h1>
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
                                    {programmes.map((prog, index) => (
                                        <tr key={index}>
                                            <td>{prog.name}</td>
                                            <td>
                                                <span className="admin-interest-badge">
                                                    {prog.interested} Learners
                                                </span>
                                            </td>
                                            <td>{prog.lastDate}</td>
                                            <td>
                                                <button 
                                                    className="admin-view-btn"
                                                    onClick={() => handleViewInterested(prog.name)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="admin-activity-section">
                        <h2>Recent Activity</h2>
                        <div className="admin-activity-list">
                            {activities.map((activity, index) => (
                                <div className="admin-activity-item" key={index}>
                                    <div className="admin-activity-time">{activity.time}</div>
                                    <div className="admin-activity-desc">{activity.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin_Dashboard;