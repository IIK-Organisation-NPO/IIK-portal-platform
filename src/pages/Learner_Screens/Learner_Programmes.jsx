import React, { useState } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Programmes.css';

const ProgrammesPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [interestedProgrammes, setInterestedProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const programmes = [
    {
      id: 1,
      title: 'Digital Literacy Fundamentals',
      description: 'Master essential computer skills, internet navigation, email management, online safety, and everyday digital tools.',
      duration: '8 weeks',
      category: 'Digital Literacy'
    },
    {
      id: 2,
      title: 'Microsoft 365 Essentials',
      description: 'Learn Word, Excel, PowerPoint, Outlook, and Teams for confident and productive workplace collaboration.',
      duration: '12 weeks',
      category: 'Microsoft 365'
    },
    {
      id: 3,
      title: 'Digital Marketing Strategies',
      description: 'Build practical skills in social media marketing, search engine optimization, content strategy, and campaign planning.',
      duration: '10 weeks',
      category: 'Digital Marketing'
    },
    {
      id: 4,
      title: 'Advanced Excel & Data Analysis',
      description: 'Unlock complex formulas, pivot tables, data visualization tools, and reporting techniques for better business decisions.',
      duration: '8 weeks',
      category: 'Microsoft 365'
    },
    {
      id: 5,
      title: 'Social Media Management',
      description: 'Build an engaging online presence, schedule post workflows, design visual content, and measure social media performance.',
      duration: '6 weeks',
      category: 'Digital Marketing'
    },
    {
      id: 6,
      title: 'Internet Safety & POPIA Compliance',
      description: 'Understand POPI Act privacy regulations, corporate compliance frameworks, secure browsing, and responsible data handling.',
      duration: '4 weeks',
      category: 'Digital Literacy'
    },
    {
      id: 7,
      title: 'Cloud Computing Fundamentals',
      description: 'Explore cloud services, deployment models, infrastructure concepts, and the fundamentals of modern cloud-based work.',
      duration: '10 weeks',
      category: 'Digital Literacy'
    },
    {
      id: 8,
      title: 'Cybersecurity Essentials',
      description: 'Learn security best practices, threat detection, risk management, password protection, and safe digital habits.',
      duration: '12 weeks',
      category: 'Digital Literacy'
    },
    {
      id: 9,
      title: 'Data Science & Analytics',
      description: 'Develop a foundation in data visualization, statistical analysis, data storytelling, and machine learning basics.',
      duration: '14 weeks',
      category: 'Digital Marketing'
    }
  ];

  const categories = ['All', 'Digital Literacy', 'Microsoft 365', 'Digital Marketing'];

  const handleInterest = (programmeId) => {
    if (interestedProgrammes.includes(programmeId)) {
      setInterestedProgrammes(interestedProgrammes.filter(id => id !== programmeId));
    } else {
      setInterestedProgrammes([...interestedProgrammes, programmeId]);
    }
  };

  const filteredProgrammes = programmes.filter(programme => {
    const matchesCategory = activeFilter === 'All' || programme.category === activeFilter;
    const matchesSearch = programme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         programme.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="programmes-layout">
      <Learner_Header
        userName="Sarah Khumalo"
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
          {/* Header Section */}
          <section className="programmes-hero">
            <div className="hero-content">
              <h1>Our Programmes</h1>
              <p className="hero-subtitle">
                Explore our accredited professional courses designed to accelerate your digital capabilities. Choose a programme that fits your career goals.
              </p>
            </div>
          </section>

          {/* Filter and Search Section */}
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

          {/* Programmes Grid */}
          <section className="programmes-grid-section">
            <div className="grid-content">
              <div className="programmes-grid">
                {filteredProgrammes.length > 0 ? (
                  filteredProgrammes.map((programme) => (
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
                          className={`btn-interest ${interestedProgrammes.includes(programme.id) ? 'interested' : ''}`}
                          onClick={() => handleInterest(programme.id)}
                        >
                          {interestedProgrammes.includes(programme.id) ? 'Interested ✓' : "I'm Interested"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <p>No programmes found matching your criteria.</p>
                  </div>
                )}
              </div>
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