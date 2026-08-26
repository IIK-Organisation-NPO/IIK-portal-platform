// src/pages/Admin_Screens/Admin_Dashboard.jsx
import React, { useState } from 'react';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_Dashboard.css';

const Admin_Dashboard = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeNav, setActiveNav] = useState('dashboard');

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Stats data
    const stats = [
        { label: 'Total Learners', value: 247, icon: 'fa-users' },
        { label: 'Active Programmes', value: 3, icon: 'fa-book-open' },
        { label: 'Certificates Issued', value: 189, icon: 'fa-certificate' },
        { label: 'Pending Certificates', value: 12, icon: 'fa-clock' },
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
                                <div className="admin-stat-label">{stat.label}</div>
                                <div className="admin-stat-value">{stat.value}</div>
                                <i className={`fas ${stat.icon} admin-stat-icon`}></i>
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
                                                <button className="admin-view-btn">View</button>
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