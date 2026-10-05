// src/pages/Learner_Screens/Learner_DashBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_DashBoard.css';
import { API, API_BASE } from '../../config/api';

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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

  const fetchArchivedProgrammes = useCallback(async () => {
    try {
      const stored = (() => {
        try {
          return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
          return {};
        }
      })();

      const centreId =
        stored.centreId ??
        stored.digital_center_id ??
        stored.centre_id ??
        null;

      if (!centreId) return [];

      const res = await fetch(
        `${API_BASE}/api/centres/${centreId}/programmes`
      );

      if (!res.ok) return [];

      const data = await res.json();
      const rows = Array.isArray(data?.data) ? data.data : [];

      return rows
        .filter((row) => row.centreStatus === 'Archived')
        .map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          duration: row.duration,
          Programme_status: 'Archived'
        }));
    } catch (err) {
      console.error('Fetch archived programmes error:', err);
      return [];
    }
  }, []);

  const fetchLearnerData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const profileResponse = await fetch(API.learner.profile, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let profile = null;
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        profile = data.data;
        setLearnerData(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      } else {
        setError('Failed to fetch learner profile');
        setLoading(false);
        return;
      }

      const programmesResponse = await fetch(API.learner.programmes, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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

      const enrolled = Array.isArray(profile?.enrolledProgrammes)
        ? profile.enrolledProgrammes.map((row) => ({
            id: row.id ?? row.programmeId,
            name: row.name,
            description: row.description,
            duration: row.duration,
            Programme_status: 'Enrolled'
          }))
        : [];

      const archived = await fetchArchivedProgrammes();

      const existingIds = new Set(
        programmeRows
          .map((p) => p.id ?? p.Programme_id)
          .filter((id) => id != null)
      );
      const extras = [...enrolled, ...archived].filter(
        (p) => p.id != null && !existingIds.has(p.id)
      );
      const mergedRows = [...programmeRows, ...extras];

      const visible = mergedRows
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
        .filter(
          (p) =>
            p.status === 'Active' ||
            p.status === 'Upcoming' ||
            p.status === 'Archived' ||
            p.status === 'Enrolled'
        );

      setProgrammes(visible);
      setLoading(false);
    } catch (err) {
      console.error('API fetch error:', err);
      setError('Connection error');
      setLoading(false);
    }
  }, [fetchArchivedProgrammes]);

  useEffect(() => {
    fetchLearnerData();
  }, [fetchLearnerData]);

  const handleInterest = (programme) => {
    navigate('/locate-center', {
      state: {
        programmeId: programme.id,
        programmeTitle: programme.title
      }
    });
  };

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
    return (
      learnerData.totalEnrolled ||
      learnerData.enrolledProgrammes?.length ||
      0
    );
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
      <Learner_Header
        userName={userName}
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
                programmes.map((prog) => (
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
                      onClick={() => handleInterest(prog)}
                    >
                      I'm Interested
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

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
        .btn-interest {
          transition: all 0.3s ease;
        }
        .btn-interest:hover {
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