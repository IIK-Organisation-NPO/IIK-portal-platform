// src/pages/Learner_Screens/Learner_Programmes.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Programmes.css';
import { API_BASE } from '../../config/api';

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

const isProgrammeActionable = (programme) => {
  if (programme.status === 'Active') return true;
  if (programme.status === 'Archived') return true;
  if (programme.status !== 'Upcoming') return false;
  const kind = classifyStartDate(programme.startDateRaw);
  return kind === 'today' || kind === 'past';
};

const normalizeProgramme = (p = {}) => {
  const rawStatus = p.status ?? p.Programme_status ?? 'Draft';

  const startDateRaw =
    p.startDateRaw ??
    p.startDate ??
    p.Start_date ??
    null;

  let formattedStartDate = 'Not set';
  if (startDateRaw) {
    const d = new Date(startDateRaw);
    if (!isNaN(d.getTime())) {
      formattedStartDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    } else {
      formattedStartDate = String(startDateRaw);
    }
  }

  return {
    id: p.id ?? p.Programme_id ?? Date.now(),
    title: p.name ?? p.Programme_name ?? 'Untitled Programme',
    description: p.description ?? p.Programme_description ?? '',
    duration: p.duration ?? p.Duration ?? '',
    category: p.category ?? p.Category ?? '',
    status: rawStatus,
    startDate: formattedStartDate,
    startDateRaw
  };
};

const ProgrammesPage = () => {
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  const [programmes, setProgrammes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [nowTick, setNowTick] = useState(Date.now());

  const fetchProgrammes = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/programmes`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load programmes.');
      }

      const visible = (data.programmes || [])
        .map(normalizeProgramme)
        .filter(p => p.status !== 'Draft');

      setProgrammes(visible);
    } catch (err) {
      console.error('Fetch programmes error:', err);
      setLoadError(err.message || 'Failed to load programmes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgrammes();
  }, [fetchProgrammes]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleInterest = (programme) => {
    sessionStorage.setItem('pendingProgrammeInterest', JSON.stringify({
      programmeId: programme.id,
      programmeTitle: programme.title,
      stagedAt: Date.now(),
    }));

    navigate('/locate-center', {
      state: {
        programmeId: programme.id,
        programmeTitle: programme.title
      }
    });
  };

  const categories = useMemo(() => {
    const set = new Set(programmes.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [programmes]);

  const filteredProgrammes = useMemo(() => {
    const search = (searchTerm || '').trim().toLowerCase();

    return programmes.filter(programme => {
      const matchesCategory =
        activeFilter === 'All' || programme.category === activeFilter;

      const title = (programme.title || '').toLowerCase();
      const description = (programme.description || '').toLowerCase();
      const matchesSearch =
        search === '' || title.includes(search) || description.includes(search);

      return matchesCategory && matchesSearch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programmes, activeFilter, searchTerm, nowTick]);

  return (
    <div className="programmes-layout">
      <Learner_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="programmes-body">
        <Learner_SideBar
          active="programmes"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="programmes-page">
          <section className="programmes-hero">
            <div className="hero-content">
              <h1>Our Programmes</h1>
              <p className="hero-subtitle">
                Explore our accredited professional courses designed to accelerate your digital capabilities. Choose a programme that fits your career goals.
              </p>
            </div>
          </section>

          <section className="programmes-filter">
            <div className="filter-content">
              <div className="filter-left">
                <div className="category-filters">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`filter-btn ${activeFilter === category ? 'active' : ''}`}
                      onClick={() => setActiveFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-right">
                <input
                  type="text"
                  placeholder="Search programmes..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="programmes-grid-section">
            <div className="grid-content">
              {isLoading ? (
                <div className="no-results">
                  <p>Loading programmes...</p>
                </div>
              ) : loadError ? (
                <div className="no-results">
                  <p>{loadError}</p>
                  <button className="read-more-button" onClick={fetchProgrammes}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="programmes-grid">
                  {filteredProgrammes.length > 0 ? (
                    filteredProgrammes.map((programme) => {
                      const actionable = isProgrammeActionable(programme);

                      return (
                        <div key={programme.id} className="programme-card">
                          <div className="programme-image-placeholder">
                            <div className="placeholder-content">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15L16 10L5 21" />
                              </svg>
                              <span>Course Image</span>
                            </div>
                          </div>
                          <div className="programme-content">
                            <h3>{programme.title}</h3>
                            <p className="programme-description">{programme.description}</p>
                            <button
                              type="button"
                              className="read-more-button"
                              onClick={() => setSelectedProgramme(programme)}
                            >
                              Read more
                            </button>
                            <div className="programme-meta">
                              <span className="duration">Duration: {programme.duration}</span>
                            </div>
                            <button
                              className="btn-interest"
                              onClick={() => actionable && handleInterest(programme)}
                              disabled={!actionable}
                              title={
                                !actionable
                                  ? `Available from ${programme.startDate}`
                                  : undefined
                              }
                            >
                              {!actionable
                                ? `Available from ${programme.startDate}`
                                : "I'm Interested"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-results">
                      <p>No programmes found matching your criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {selectedProgramme && (
            <div
              className="programme-modal-overlay"
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedProgramme(null);
                }
              }}
            >
              <article className="programme-modal" role="dialog" aria-modal="true" aria-labelledby="programme-modal-title">
                <button
                  type="button"
                  className="programme-modal-close"
                  aria-label="Close programme details"
                  onClick={() => setSelectedProgramme(null)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <div className="programme-modal-image">
                  <span>Course Image</span>
                </div>
                <div className="programme-modal-content">
                  <h2 id="programme-modal-title">{selectedProgramme.title}</h2>
                  <p>{selectedProgramme.description}</p>
                  <span className="duration">Duration: {selectedProgramme.duration}</span>
                </div>
              </article>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProgrammesPage;