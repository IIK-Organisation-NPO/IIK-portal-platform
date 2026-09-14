import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Learner/Locate_Center.css';

const LocateCenter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('25 hunt road');
  const [interestedCenters, setInterestedCenters] = useState([]);

  const centers = [
    {
      id: 1,
      name: 'Harry Gwala Digital Centre',
      distance: '2.3 km away',
      address: 'R162, KwaZulu-Natal, South Africa',
      hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
      phone: '+27 (0)11 555 0192',
      coordinates: { top: '30%', left: '55%' }
    },
    {
      id: 2,
      name: 'Amahlubi Digital Centre',
      distance: '12.1 km away',
      address: '69 Thabo Mbeki Drive',
      hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
      phone: '+27 (0)11 555 0244',
      coordinates: { top: '55%', left: '30%' }
    },
    {
      id: 3,
      name: 'Richmond Digital Centre',
      distance: '14.5 km away',
      address: '57 Harding Street, Richmond, 3780',
      hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
      phone: '+27 (0)11 555 0311',
      coordinates: { top: '20%', left: '70%' }
    },
    {
      id: 4,
      name: 'Umlazi Digital Centre',
      distance: '25.8 km away',
      address: '511 Griffiths Mxenge Highway (Mangosuthu Highway), Umlazi, Durban, 4031',
      hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
      phone: '+27 (0)11 555 0488',
      coordinates: { top: '62%', left: '42%' }
    },
    {
      id: 5,
      name: 'Kokstad Digital Centre',
      distance: '52.0 km away',
      address: '784 Bool Lane, Kokstad, 4700',
      hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
      phone: '+27 (0)12 555 0101',
      coordinates: { top: '35%', left: '85%' }
    }
  ];

  const handleInterest = (centerId) => {
    if (interestedCenters.includes(centerId)) {
      setInterestedCenters(interestedCenters.filter(id => id !== centerId));
    } else {
      setInterestedCenters([...interestedCenters, centerId]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for centers near: ${searchTerm}`);
  };

  return (
    <div className="locate-page">
      {/* Header Section */}
      <section className="locate-hero">
        <div className="hero-content">
          <button type="button" className="back-dashboard-btn" onClick={() => navigate('/learner-dashboard')}>
            <span aria-hidden="true">&larr;</span>
            Back to Dashboard
          </button>
          <h1>Locate a Digital Center Near You</h1>
          <p className="hero-subtitle">
            Enter your address to find the nearest physical digital learning center, explore accessible resources, and
            jump-start your learning journey.
          </p>

          {/* Search Bar */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-wrapper">
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <input
                type="text"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter your address..."
              />
              <button type="submit" className="search-btn">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results Section */}
      <section className="locate-results">
        <div className="results-header">
          <h2>{centers.length} Digital Centers Found</h2>
          <span className="sort-label">Sorted by nearest</span>
        </div>

        <div className="results-grid">
          {/* Center Cards - Left Column */}
          <div className="centers-list">
            {centers.map((center) => (
              <div key={center.id} className="center-card">
                <div className="center-card-header">
                  <div className="center-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3>{center.name}</h3>
                  <span className="center-distance">{center.distance}</span>
                </div>

                <div className="center-details">
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{center.address}</span>
                  </div>
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{center.hours}</span>
                  </div>
                  <div className="detail-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{center.phone}</span>
                  </div>
                </div>

                <button
                  className={`btn-interest ${interestedCenters.includes(center.id) ? 'interested' : ''}`}
                  onClick={() => handleInterest(center.id)}
                >
                  {interestedCenters.includes(center.id) ? 'Interest Submitted ✓' : 'Submit Interest'}
                </button>
              </div>
            ))}
          </div>

          {/* Map - Right Column */}
          <div className="map-container">
            <div className="map-placeholder">
              {/* Map background shapes */}
              <div className="map-bg-shape shape-1"></div>
              <div className="map-bg-shape shape-2"></div>
              <div className="map-bg-shape shape-3"></div>

              {/* Map roads */}
              <div className="map-road road-horizontal"></div>
              <div className="map-road road-vertical"></div>

              {/* Your Location marker */}
              <div className="map-marker user-location" style={{ top: '42%', left: '38%' }}>
                <div className="user-dot"></div>
                <div className="marker-label dark-label">Your Location</div>
              </div>

              {/* Center markers */}
              {centers.map((center) => (
                <div
                  key={center.id}
                  className="map-marker center-marker"
                  style={{ top: center.coordinates.top, left: center.coordinates.left }}
                >
                  <div className="center-ring"></div>
                  <div className="center-dot"></div>
                  <div className="marker-label">{center.name}</div>
                </div>
              ))}

              {/* Map Controls */}
              <div className="map-controls">
                <button className="map-control-btn" aria-label="Zoom in">+</button>
                <button className="map-control-btn" aria-label="Zoom out">−</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocateCenter;