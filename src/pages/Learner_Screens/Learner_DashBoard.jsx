import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_DashBoard.css';
import api from '../../services/api';

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:5000';

// ---------------------------------------------------------------------------
// Classify a raw start date against today (date-only).
// Returns 'none' | 'today' | 'past' | 'future'
// ---------------------------------------------------------------------------
const classifyStartDate = (rawDate) => {
  if (!rawDate) return 'none';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return 'none';
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return 'today';
  return d < today ? 'past' : 'future';
};

// ---------------------------------------------------------------------------
// A programme is actionable when:
//   - status is Active, OR
//   - status is Upcoming but its start date has arrived or passed
// ---------------------------------------------------------------------------
const isProgrammeActionable = (programme) => {
  if (programme.status === 'Active') return true;
  if (programme.status !== 'Upcoming') return false;
  const kind = classifyStartDate(programme.startDateRaw);
  return kind === 'today' || kind === 'past';
};

// ---------------------------------------------------------------------------
// Format a raw date as "Sep 18, 2026"
// ---------------------------------------------------------------------------
const formatStartDate = (rawDate) => {
  if (!rawDate) return 'Not set';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
};

const Learner_DashBoard = () => {
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [learnerData, setLearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [programmes, setProgrammes] = useState([]);

  // Ticks every minute so an Upcoming programme unlocks automatically
  // when its start date becomes today.
  const [, setNowTick] = useState(Date.now());

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ============================================
  // HELPER: Pick an icon based on programme name
  // ============================================
  const getProgrammeIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('digital literacy')) return 'fa-laptop';
    if (n.includes('microsoft')) return 'fa-microsoft';
    if (n.includes('digital marketing')) return 'fa-chart-line';
    if (n.includes('web')) return 'fa-code';
    if (n.includes('data')) return 'fa-database';
    if (n.includes('excel')) return 'fa-file-excel';
    if (n.includes('cyber')) return 'fa-shield-alt';
    if (n.includes('cloud')) return 'fa-cloud';
    if (n.includes('social media')) return 'fa-hashtag';
    return 'fa-graduation-cap';
  };

  // ============================================
  // FETCH LEARNER DATA AND PROGRAMMES
  // ============================================
  const fetchLearnerData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      // ---------- Learner profile ----------
      const profileResponse = await fetch(`${API_BASE}/api/learner/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setLearnerData(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } else {
        setError('Failed to fetch learner profile');
        setLoading(false);
        return;
      }

      // ---------- Programmes ----------
      const programmesResponse = await fetch(
        `${API_BASE}/api/learner/programmes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let programmeRows = [];

      if (programmesResponse.ok) {
        const data = await programmesResponse.json();
        if (data.success && Array.isArray(data.data)) {
          programmeRows = data.data;
        }
      }

      // Fallback to the shared endpoint if the learner one returned nothing.
      if (programmeRows.length === 0) {
        try {
          const sharedRes = await fetch(`${API_BASE}/api/programmes`);
          if (sharedRes.ok) {
            const sharedData = await sharedRes.json();
            if (sharedData.success && Array.isArray(sharedData.programmes)) {
              programmeRows = sharedData.programmes;
            }
          }
        } catch {
          // swallow — no programmes available
        }
      }

      // Normalize + filter to Active and Upcoming.
      const visible = programmeRows
        .map((p) => {
          const rawStatus = p.status ?? p.Programme_status ?? 'Draft';
          const startDateRaw =
            p.startDateRaw ?? p.startDate ?? p.Start_date ?? null;

          const title =
            p.title ?? p.name ?? p.Programme_name ?? 'Untitled Programme';

          return {
            id: p.id ?? p.Programme_id,
            title,
            desc:
              p.desc ??
              p.description ??
              p.Programme_description ??
              'Learn essential skills in this programme.',
            duration: p.duration ?? p.Duration ?? '8 weeks',
            status: rawStatus,
            startDateRaw,
            startDate: formatStartDate(startDateRaw),
            icon: getProgrammeIcon(title)
          };
        })
        .filter((p) => p.status === 'Active' || p.status === 'Upcoming');

      setProgrammes(visible);
      setLoading(false);
    } catch (err) {
      console.error('API fetch error:', err);
      setError('Connection error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLearnerData();
  }, [fetchLearnerData]);

  // Re-evaluate the "is actionable" decision every minute
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // ============================================
  // HANDLE "I'M INTERESTED" BUTTON
  // Navigates to the Locate Center page and carries the programme
  // context (id + title) so the centre interest can be linked back
  // to the chosen programme.
  // ============================================
  const handleInterest = (programme) => {
    navigate('/locate-center', {
      state: {
        programmeId: programme.id,
        programmeTitle: programme.title
      }
    });
  };

  // ============================================
  // LEARNER STATS
  // ============================================
  const getUserName = () => {
    if (!learnerData) return 'Learner';
    return (
      learnerData.fullName ||
      learnerData.name ||
      `${learnerData.firstName || ''} ${learnerData.lastName || ''}`.trim() ||
      learnerData.email?.split('@')[0] ||
      'Learner'
    );
  };

  const getEnrolledCount = () => {
    if (!learnerData) return 0;
    return learnerData.totalEnrolled || learnerData.enrolledProgrammes?.length || 0;
  };

  const getCompletedCount = () => {
    if (!learnerData) return 0;
    return learnerData.totalCompleted || learnerData.completedProgrammes?.length || 0;
  };

  const getCertificatesCount = () => {
    if (!learnerData) return 0;
    return learnerData.totalCertificates || learnerData.certificates?.length || 0;
  };

  const userName = getUserName();

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-layout">
        <Learner_Header
          userName="Loading..."
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="dashboard-body">
          <Learner_SideBar
            active="dashboard"
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
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
        <Learner_Header
          userName="Error"
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="dashboard-body">
          <Learner_SideBar
            active="dashboard"
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
          <main className="learner-dashboard">
            <div className="error-message">
              Unable to load profile data. Please try again later.
            </div>
          </main>
        </div>
      </div>
    );
  }

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
            <div
              className="success-toast"
              style={{
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
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div
              className="error-toast"
              style={{
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
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Welcome Section */}
          <div className="dashboard-welcome">
            <h1>
              Welcome back, <span>{userName}</span>
            </h1>
            <p>
              Here is your learning summary and available programmes for
              enrollment.
            </p>
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
              {programmes.length === 0 ? (
                <p className="no-programmes">No programmes available yet.</p>
              ) : (
                programmes.map((prog) => {
                  const actionable = isProgrammeActionable(prog);

                  return (
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
                        onClick={() => actionable && handleInterest(prog)}
                        disabled={!actionable}
                        title={
                          !actionable
                            ? `Available from ${prog.startDate}`
                            : undefined
                        }
                      >
                        {!actionable
                          ? `Available from ${prog.startDate}`
                          : "I'm Interested"}
                      </button>
                    </div>
                  );
                })
              )}
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
        .no-programmes {
          color: #64748b;
          font-size: 0.95rem;
          padding: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default Learner_DashBoard;