// src/pages/Admin_Screens/Admin_Analytics.jsx
import React, { useState, useEffect } from 'react';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_Analytics.css';
import api from '../../services/api';

const AdminAnalytics = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [activeNav, setActiveNav] = useState('analytics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    stats: {
      totalRegistered: 0,
      completedProgrammes: 0,
      inProgress: 0,
      inactive: 0,
      completionRate: 0,
      activeRate: 0
    },
    gender: { female: 0, male: 0, other: 0 },
    age: { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 }
  });
  const [centres, setCentres] = useState([]);
  const [programmes, setProgrammes] = useState([]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, centresRes, programmesRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/analytics/centres'),
        api.get('/admin/analytics/programmes')
      ]);

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }

      if (centresRes.data.success) {
        setCentres(centresRes.data.data);
      }

      if (programmesRes.data.success) {
        setProgrammes(programmesRes.data.data);
      }

    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate gender percentages
  const totalGender = analytics.gender.female + analytics.gender.male + analytics.gender.other;
  const femalePercent = totalGender > 0 ? ((analytics.gender.female / totalGender) * 100).toFixed(1) : 0;
  const malePercent = totalGender > 0 ? ((analytics.gender.male / totalGender) * 100).toFixed(1) : 0;
  const otherPercent = totalGender > 0 ? ((analytics.gender.other / totalGender) * 100).toFixed(1) : 0;

  // Get max age for bar chart
  const maxAge = Math.max(
    analytics.age['18-24'] || 0,
    analytics.age['25-34'] || 0,
    analytics.age['35-44'] || 0,
    analytics.age['45-54'] || 0,
    analytics.age['55+'] || 0
  );

  // Get max centre count for bar chart
  const maxCentreCount = centres.length > 0 ? Math.max(...centres.map(c => c.count)) : 1;

  if (loading) {
    return (
      <div className="app-container">
        <Admin_Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="main-layout">
          <Admin_Sidebar active={activeNav} isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
          <main className="admin-content">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p>Loading analytics data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Admin_Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="main-layout">
          <Admin_Sidebar active={activeNav} isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
          <main className="admin-content">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <h3 style={{ color: '#dc3545' }}>Error: {error}</h3>
              <button 
                onClick={fetchAnalytics}
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
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Admin_Header 
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-layout">
        <Admin_Sidebar 
          active={activeNav}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="admin-content">
          <div className="page-header">
            <h1>Analytics & Statistics</h1>
            <p>Comprehensive overview of learner demographics, programme performance, and centre activity.</p>
          </div>

          {/* Top Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Registered</span>
              <span className="stat-value">{analytics.stats.totalRegistered}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completed Programme</span>
              <span className="stat-value">
                {analytics.stats.completedProgrammes} 
                <span className="stat-sub">{analytics.stats.completionRate}%</span>
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">In Progress</span>
              <span className="stat-value">{analytics.stats.inProgress}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Inactive</span>
              <span className="stat-value">{analytics.stats.inactive}</span>
            </div>
          </div>

          {/* Completion Funnel */}
          <div className="card funnel-card">
            <h3 className="card-title">Completion Funnel</h3>
            
            <div className="funnel-row">
              <div className="funnel-label">Registered</div>
              <div className="funnel-bar-container">
                <div className="funnel-bar bar-black" style={{ width: '100%' }}></div>
              </div>
              <div className="funnel-value">{analytics.stats.totalRegistered} Learners (100%)</div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">Active Enrolments</div>
              <div className="funnel-bar-container">
                <div className="funnel-bar bar-dark-grey" style={{ width: `${Math.min(analytics.stats.activeRate, 100)}%` }}></div>
              </div>
              <div className="funnel-value">
                {analytics.stats.inProgress + analytics.stats.completedProgrammes} Learners ({analytics.stats.activeRate}%)
              </div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">Completed Programmes</div>
              <div className="funnel-bar-container">
                <div className="funnel-bar bar-grey" style={{ width: `${Math.min(analytics.stats.completionRate, 100)}%` }}></div>
              </div>
              <div className="funnel-value">
                {analytics.stats.completedProgrammes} Learners ({analytics.stats.completionRate}%)
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            
            {/* Gender Distribution */}
            <div className="card chart-card">
              <h3 className="card-title">Gender Distribution</h3>
              <div className="chart-content">
                <div className="donut-chart">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle-grey" strokeDasharray={`${femalePercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle-dark" strokeDasharray={`${malePercent}, 100`} strokeDashoffset={`-${femalePercent}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <g className="donut-text">
                      <text x="18" y="20.35" className="percentage">{totalGender}</text>
                      <text x="18" y="24.35" className="subtext">Total</text>
                    </g>
                  </svg>
                </div>
                <div className="legend">
                  <div className="legend-item">
                    <span className="dot dot-grey"></span>
                    <span className="legend-label">Female</span>
                    <span className="legend-value">{analytics.gender.female} ({femalePercent}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-dark"></span>
                    <span className="legend-label">Male</span>
                    <span className="legend-value">{analytics.gender.male} ({malePercent}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-light"></span>
                    <span className="legend-label">Other</span>
                    <span className="legend-value">{analytics.gender.other} ({otherPercent}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div className="card chart-card">
              <h3 className="card-title">Age Distribution</h3>
              <div className="bar-chart">
                {Object.entries(analytics.age).map(([ageGroup, count]) => {
                  const height = maxAge > 0 ? ((count / maxAge) * 100) : 0;
                  const sizeClass = height > 70 ? 'bar-xl' : height > 50 ? 'bar-lg' : height > 30 ? 'bar-md' : height > 15 ? 'bar-sm' : 'bar-xs';
                  return (
                    <div className="bar-column" key={ageGroup}>
                      <div className="bar-value">{count}</div>
                      <div className={`bar ${sizeClass}`} style={{ height: `${Math.max(height, 5)}px` }}></div>
                      <div className="bar-label">{ageGroup}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Participants by Digital Centre */}
          <div className="card centre-list-card">
            <h3 className="card-title">Participants by Digital Centre</h3>
            {centres.length > 0 ? (
              centres.map((centre, idx) => (
                <div className="centre-row" key={idx}>
                  <div className="centre-name">{centre.name}</div>
                  <div className="centre-bar-bg">
                    <div className="centre-bar" style={{ width: `${Math.min((centre.count / maxCentreCount) * 100, 100)}%` }}></div>
                  </div>
                  <div className="centre-count">{centre.count} Learners</div>
                </div>
              ))
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No centre data available</p>
            )}
          </div>

          {/* Programme Breakdown Table */}
          <div className="card table-card">
            <h3 className="card-title">Programme Enrolment & Completion Breakdown</h3>
            {programmes.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PROGRAMME NAME</th>
                    <th>ENROLLED</th>
                    <th>COMPLETED</th>
                    <th>COMPLETION RATE</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.map((prog, idx) => (
                    <tr key={idx}>
                      <td>{prog.name}</td>
                      <td>{prog.enrolled} Learners</td>
                      <td>{prog.completed} Learners</td>
                      <td><span className="rate-badge">{prog.completionRate}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No programme data available</p>
            )}
          </div>

        </main>
      </div>

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button 
          className="scroll-to-top-btn" 
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default AdminAnalytics;