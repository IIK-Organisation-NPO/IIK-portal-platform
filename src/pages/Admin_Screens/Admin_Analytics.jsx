// src/pages/Admin_Screens/Admin_Analytics.jsx
import React, { useState, useEffect } from 'react';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_Analytics.css';

const AdminAnalytics = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [activeNav, setActiveNav] = useState('analytics');

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <Admin_Header 
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-layout">
        {/* Sidebar */}
        <Admin_Sidebar 
          active={activeNav}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        {/* Main Content */}
        <main className="admin-content">
          <div className="page-header">
            <h1>Analytics & Statistics</h1>
            <p>Comprehensive overview of learner demographics, programme performance, and centre activity.</p>
          </div>

          {/* Top Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Registered</span>
              <span className="stat-value">100</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completed Programme</span>
              <span className="stat-value">49 <span className="stat-sub">19.8%</span></span>
            </div>
            <div className="stat-card">
              <span className="stat-label">In Progress</span>
              <span className="stat-value">186</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Inactive</span>
              <span className="stat-value">12</span>
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
              <div className="funnel-value">100 Learners (100%)</div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">Active Enrolments</div>
              <div className="funnel-bar-container">
                <div className="funnel-bar bar-dark-grey" style={{ width: '80.1%' }}></div>
              </div>
              <div className="funnel-value">198 Learners (80.1%)</div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">Completed Programmes</div>
              <div className="funnel-bar-container">
                <div className="funnel-bar bar-grey" style={{ width: '19.8%' }}></div>
              </div>
              <div className="funnel-value">49 Learners (19.8%)</div>
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
                    <path className="circle-bg" d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle-grey" strokeDasharray="58, 100" d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle-dark" strokeDasharray="39, 100" strokeDashoffset="-58" d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <g className="donut-text">
                      <text x="18" y="20.35" className="percentage">100</text>
                      <text x="18" y="24.35" className="subtext">Total</text>
                    </g>
                  </svg>
                </div>
                <div className="legend">
                  <div className="legend-item">
                    <span className="dot dot-grey"></span>
                    <span className="legend-label">Female</span>
                    <span className="legend-value">50% (50)</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-dark"></span>
                    <span className="legend-label">Male</span>
                    <span className="legend-value">50% (50)</span>
                  </div>
                  <div className="legend-item">
                    <span className="dot dot-light"></span>
                    <span className="legend-label">Other</span>
                    <span className="legend-value">0% (0)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div className="card chart-card">
              <h3 className="card-title">Age Distribution</h3>
              <div className="bar-chart">
                <div className="bar-column">
                  <div className="bar-value">72</div>
                  <div className="bar bar-lg" style={{height: '72px'}}></div>
                  <div className="bar-label">18-24</div>
                </div>
                <div className="bar-column">
                  <div className="bar-value">98</div>
                  <div className="bar bar-xl" style={{height: '98px'}}></div>
                  <div className="bar-label">25-34</div>
                </div>
                <div className="bar-column">
                  <div className="bar-value">52</div>
                  <div className="bar bar-md" style={{height: '52px'}}></div>
                  <div className="bar-label">35-44</div>
                </div>
                <div className="bar-column">
                  <div className="bar-value">18</div>
                  <div className="bar bar-sm" style={{height: '18px'}}></div>
                  <div className="bar-label">45-54</div>
                </div>
                <div className="bar-column">
                  <div className="bar-value">7</div>
                  <div className="bar bar-xs" style={{height: '7px'}}></div>
                  <div className="bar-label">55+</div>
                </div>
              </div>
            </div>
          </div>

          {/* Participants by Digital Centre */}
          <div className="card centre-list-card">
            <h3 className="card-title">Participants by Digital Centre</h3>
            {[
              { name: 'Harry Gwala Digital Centre', count: 68 },
              { name: 'Richmond Digital Centre', count: 54 },
              { name: 'Umzimkhulu', count: 42 },
              { name: 'KwaMashu Digital Centre', count: 38 },
              { name: 'uMfolozi Digital Centre', count: 27 },
              { name: 'Jozini Digital Centre', count: 18 },
            ].map((centre, idx) => (
              <div className="centre-row" key={idx}>
                <div className="centre-name">{centre.name}</div>
                <div className="centre-bar-bg">
                  <div className="centre-bar" style={{ width: `${(centre.count / 68) * 100}%` }}></div>
                </div>
                <div className="centre-count">{centre.count} Learners</div>
              </div>
            ))}
          </div>

          {/* Programme Breakdown Table */}
          <div className="card table-card">
            <h3 className="card-title">Programme Enrolment & Completion Breakdown</h3>
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
                <tr>
                  <td>Digital Literacy</td>
                  <td>102 Learners</td>
                  <td>22 Learners</td>
                  <td><span className="rate-badge">21.6%</span></td>
                </tr>
                <tr>
                  <td>Microsoft 365</td>
                  <td>85 Learners</td>
                  <td>15 Learners</td>
                  <td><span className="rate-badge">17.6%</span></td>
                </tr>
                <tr>
                  <td>Digital Marketing</td>
                  <td>60 Learners</td>
                  <td>12 Learners</td>
                  <td><span className="rate-badge">20.0%</span></td>
                </tr>
              </tbody>
            </table>
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