import React, { useState, useEffect } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_DashBoard.css';
import api from '../../services/api';

const Learner_DashBoard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [learnerData, setLearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [programmes, setProgrammes] = useState([]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ============================================
  // ✅ FETCH LEARNER DATA AND PROGRAMMES
  // ============================================
  useEffect(() => {
    const fetchLearnerData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // Fetch learner profile
        const profileResponse = await fetch(`${API_URL}/api/learner/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setLearnerData(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        } else {
          setError('Failed to fetch learner profile');
        }

        // Fetch programmes
        const programmesResponse = await fetch(`${API_URL}/api/learner/programmes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (programmesResponse.ok) {
          const data = await programmesResponse.json();
          if (data.success) {
            const mappedProgrammes = data.data.map(p => ({
              id: p.Programme_id,
              title: p.Programme_name,
              desc: p.Programme_description || 'Learn essential skills in this programme.',
              duration: '8 weeks',
              icon: getProgrammeIcon(p.Programme_name)
            }));
            setProgrammes(mappedProgrammes);
          }
        } else {
          // Fallback programmes
          setProgrammes([
            { id: 1, title: 'Digital Literacy', desc: 'Master essential computer skills, internet navigation, email management, and online safety.', duration: '8 weeks', icon: 'fa-laptop' },
            { id: 2, title: 'Microsoft 365', desc: 'Learn Word, Excel, PowerPoint, Outlook and Teams for high-grade professional productivity.', duration: '12 weeks', icon: 'fa-microsoft' },
            { id: 3, title: 'Digital Marketing', desc: 'Social media marketing, SEO, content strategy, email campaigns, and campaign analytics.', duration: '10 weeks', icon: 'fa-chart-line' },
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('API fetch error:', err);
        setError('Connection error');
        setLoading(false);
      }
    };

    fetchLearnerData();
  }, []);

  // ============================================
  // ✅ HELPER: Get icon based on programme name
  // ============================================
  const getProgrammeIcon = (name) => {
    const icons = {
      'Digital Literacy': 'fa-laptop',
      'Microsoft 365': 'fa-microsoft',
      'Digital Marketing': 'fa-chart-line'
    };
    return icons[name] || 'fa-graduation-cap';
  };

  // ============================================
  // ✅ HANDLE "I'M INTERESTED" BUTTON
  // ============================================
  const handleInterest = async (programmeId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrorMessage('Please login first to express interest.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        return;
      }

      const btn = document.querySelector(`[data-programme="${programmeId}"]`);
      if (btn) {
        btn.textContent = 'Submitting...';
        btn.disabled = true;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('📤 Sending interest for programmeId:', programmeId);
      
      const response = await fetch(`${API_URL}/api/learner/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          programmeId: programmeId
        })
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (response.ok && data.success) {
        setSuccessMessage(data.message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        
        if (btn) {
          btn.textContent = '✅ Interested';
          btn.style.background = '#28a745';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.disabled = true;
        }
      } else {
        setErrorMessage(data.message || 'Failed to express interest. Please try again.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        
        if (btn) {
          btn.textContent = "I'm Interested";
          btn.disabled = false;
        }
      }
    } catch (error) {
      console.error('Error expressing interest:', error);
      setErrorMessage('Network error. Please check your connection.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      
      const btn = document.querySelector(`[data-programme="${programmeId}"]`);
      if (btn) {
        btn.textContent = "I'm Interested";
        btn.disabled = false;
      }
    }
  };

  // ============================================
  // ✅ GET LEARNER STATS
  // ============================================
  const getUserName = () => {
    if (!learnerData) return 'Learner';
    return learnerData.fullName || 
           learnerData.name || 
           `${learnerData.firstName || ''} ${learnerData.lastName || ''}`.trim() || 
           learnerData.email?.split('@')[0] || 
           'Learner';
  };

  const getEnrolledCount = () => {
    if (!learnerData) return 0;
    return learnerData.totalEnrolled || 
           learnerData.enrolledProgrammes?.length || 
           0;
  };

  const getCompletedCount = () => {
    if (!learnerData) return 0;
    return learnerData.totalCompleted || 
           learnerData.completedProgrammes?.length || 
           0;
  };

  const getCertificatesCount = () => {
    if (!learnerData) return 0;
    return learnerData.totalCertificates || 
           learnerData.certificates?.length || 
           0;
  };

  const userName = getUserName();

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-layout">
        <Learner_Header userName="Loading..." onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="dashboard-body">
          <Learner_SideBar active="dashboard" isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
          <main className="learner-dashboard">
            <div className="loading-spinner">Loading your dashboard...</div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-layout">
        <Learner_Header userName="Error" onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="dashboard-body">
          <Learner_SideBar active="dashboard" isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
          <main className="learner-dashboard">
            <div className="error-message">Unable to load profile data. Please try again later.</div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Check if user has enrolled programmes
  const enrolledCount = getEnrolledCount();

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <Learner_Header 
        userName={userName}
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <div className="dashboard-body">
        {/* Sidebar */}
        <Learner_SideBar 
          active="dashboard" 
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
        
        <main className="learner-dashboard">
          {/* Success Message */}
          {showSuccess && (
            <div className="success-toast" style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px 25px',
              borderRadius: '8px',
              border: '1px solid #c3e6cb',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out'
            }}>
              ✅ {successMessage}
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="error-toast" style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '15px 25px',
              borderRadius: '8px',
              border: '1px solid #f5c6cb',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out'
            }}>
              ❌ {errorMessage}
            </div>
          )}

          {/* Welcome Section */}
          <div className="dashboard-welcome">
            <h1>Welcome back, <span>{userName}</span></h1>
            <p>Here is your learning summary and available programmes for enrollment.</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Enrolled Programmes</div>
              <div className="stat-value">{enrolledCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed Programmes</div>
              <div className="stat-value">{getCompletedCount()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Certificates Earned</div>
              <div className="stat-value">{getCertificatesCount()}</div>
            </div>
          </div>

          {/* Programmes Section */}
          <section className="programmes-section">
            <h2>Our Programmes</h2>
            <div className="programmes-grid">
              {programmes.map((prog) => (
                <div className="programme-card" key={prog.id}>
                  <div className="programme-icon">
                    <i className={`fas ${prog.icon}`}></i>
                  </div>
                  <h3>{prog.title}</h3>
                  <p className="programme-desc">{prog.desc}</p>
                  <div className="programme-duration">
                    <i className="far fa-clock"></i> Duration: {prog.duration}
                  </div>
                  <button 
                    className="btn-interest"
                    data-programme={prog.id}
                    onClick={() => handleInterest(prog.id)}
                  >
                    I'm Interested
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .btn-interest:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-interest {
          transition: all 0.3s ease;
        }
        .btn-interest:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Learner_DashBoard;