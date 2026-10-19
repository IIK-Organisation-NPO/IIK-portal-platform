// src/pages/Learner_Screens/LocateCenter.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/Learner/Locate_Center.css';
import api from '../../services/api';

// ============================================
// Robust SA-aware geocoder
// ============================================
const geocodeAddress = async (rawQuery) => {
  const raw = rawQuery.trim();

  const segments = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const postalMatch = segments.find((s) => /^\d{4}$/.test(s));
  const nonPostalSegments = segments.filter((s) => !/^\d{4}$/.test(s));

  const streetSegment = nonPostalSegments[0] || '';
  const remaining = nonPostalSegments.slice(1);
  const suburb = remaining[0] || '';
  const city = remaining[remaining.length - 1] || '';
  const streetNumberMatch = streetSegment.match(/^(\d+[A-Za-z]?)\s+(.*)$/);
  const houseNumber = streetNumberMatch ? streetNumberMatch[1] : '';
  const streetName = streetNumberMatch ? streetNumberMatch[2] : streetSegment;

  const photonQueries = [
    raw,
    `${raw}, South Africa`,
    `${nonPostalSegments.join(', ')}, South Africa`,
    `${streetName} ${suburb} ${city} South Africa`,
    `${suburb} ${city} South Africa`,
  ].filter((q, i, arr) => q && arr.indexOf(q) === i);

  for (const q of photonQueries) {
    try {
      const url =
        `https://photon.komoot.io/api/?` +
        `q=${encodeURIComponent(q)}&limit=1&lang=en&lat=-29.85&lon=31.02`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const f = data.features[0];
        const [lng, lat] = f.geometry.coordinates;
        const p = f.properties || {};
        const display =
          [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(', ') ||
          q;
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          displayName: display,
          matchedQuery: q,
          source: 'photon',
        };
      }
    } catch (_) { /* try next */ }
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      limit: '1',
      addressdetails: '1',
      countrycodes: 'za',
    });
    if (streetName) params.set('street', `${houseNumber} ${streetName}`.trim());
    if (city) params.set('city', city);
    if (suburb) params.set('suburb', suburb);
    if (postalMatch) params.set('postalcode', postalMatch);

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          matchedQuery: 'structured',
          source: 'nominatim-structured',
        };
      }
    }
  } catch (_) { /* fall through */ }

  const trimmed = raw.replace(/\b\d{4}\b/g, '').replace(/\s+/g, ' ').trim();
  const noNumber = trimmed.replace(/^\d+[A-Za-z]?\s+/, '').trim();
  const areaOnly = nonPostalSegments.slice(-2).join(', ');
  const cityOnly = nonPostalSegments[nonPostalSegments.length - 1] || '';

  const nominatimQueries = [trimmed, noNumber, areaOnly, cityOnly]
    .filter((q, i, arr) => q && arr.indexOf(q) === i);

  for (const q of nominatimQueries) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&limit=1&addressdetails=1&countrycodes=za&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          matchedQuery: q,
          source: 'nominatim-text',
        };
      }
    } catch (_) { /* try next */ }
  }

  throw new Error(
    `Could not find "${raw}". Try adding the city, e.g. "Berea, Durban, South Africa".`
  );
};

// ============================================
// Helpers
// ============================================

// Opens Google Maps searching for the given address
const googleMapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;

// "2.3 km" -> "2.3 km away" (leaves it alone if it already says "away")
const formatDistance = (distance) => {
  const text = String(distance).trim();
  return /away/i.test(text) ? text : `${text} away`;
};

// ============================================
// LocateCenter — the page component
// ============================================
const LocateCenter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () =>
    window.history.state?.idx > 0 ? navigate(-1) : navigate('/learner-dashboard');

  const [searchTerm, setSearchTerm] = useState('');
  const [centers, setCenters] = useState([]);
  const [interestedCenters, setInterestedCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const [selectedCenter, setSelectedCenter] = useState(null);

  const [programmeContext, setProgrammeContext] = useState(null);

  // Set of programme IDs the learner has already submitted interest for.
  // Used to lock the button across every other centre.
  const [submittedProgrammeIds, setSubmittedProgrammeIds] = useState(new Set());

  // -------------------------------------------------------------------------
  // Read programme context on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const stateProgrammeId = location.state?.programmeId ?? null;
    const stateProgrammeTitle = location.state?.programmeTitle ?? null;

    if (stateProgrammeId) {
      setProgrammeContext({
        programmeId: stateProgrammeId,
        programmeTitle: stateProgrammeTitle || 'this programme',
      });
      return;
    }

    const raw = sessionStorage.getItem('pendingProgrammeInterest');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.stagedAt > 30 * 60 * 1000) {
        sessionStorage.removeItem('pendingProgrammeInterest');
        return;
      }
      setProgrammeContext({
        programmeId: parsed.programmeId,
        programmeTitle: parsed.programmeTitle || 'this programme',
      });
    } catch (_) {
      sessionStorage.removeItem('pendingProgrammeInterest');
    }
  }, [location.state]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const centresUrl = programmeContext?.programmeId
          ? `/programmes/${programmeContext.programmeId}/centres`
          : '/learner/digital-centers';

        const res = await api.get(centresUrl);
        if (res.data.success) setCenters(res.data.data || []);
        else setError(res.data.message || 'Failed to load centres');

        try {
          const mine = await api.get('/learner/digital-centers/my-interests');
          if (mine.data.success) {
            setInterestedCenters(mine.data.data.map((i) => i.digital_center_id));
          }
        } catch (_) { /* silent */ }

        // Load every programme the learner has already submitted interest for.
        try {
          const interestsRes = await api.get('/learner/interests');
          if (interestsRes.data.success && Array.isArray(interestsRes.data.data)) {
            const ids = interestsRes.data.data
              .filter((row) => row.status && row.status !== 'Not Interested')
              .map((row) => row.Programme_id ?? row.programme_id)
              .filter((id) => id != null);
            setSubmittedProgrammeIds(new Set(ids));
          }
        } catch (_) { /* silent */ }
      } catch (err) {
        setError('Failed to load digital centres. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [programmeContext?.programmeId]);

  const findNearest = async () => {
    setSearching(true);
    setError(null);
    setStatusMsg('');

    try {
      let latitude, longitude;

      if (searchTerm.trim()) {
        setStatusMsg(`Searching for "${searchTerm}"...`);
        const geo = await geocodeAddress(searchTerm.trim());
        latitude = geo.lat;
        longitude = geo.lng;

        const short = geo.displayName.split(',').slice(0, 3).join(', ');
        setStatusMsg(`Showing centres near: ${short}`);
      } else {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported. Please type an address instead.');
          setSearching(false);
          return;
        }

        setStatusMsg('Getting your live location...');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        setStatusMsg('Showing centres near your live location.');
      }

      const params = { latitude, longitude };
      if (programmeContext?.programmeId) {
        params.programme_id = programmeContext.programmeId;
      }

      const res = await api.get('/learner/digital-centers/nearest', { params });

      if (res.data.success) {
        const list = res.data.data || [];
        setCenters(list);
        setSelectedCenter(list.length > 0 ? list[0] : null);
      } else {
        setError(res.data.message || 'Failed to find nearby centres');
      }
    } catch (err) {
      if (err?.message?.includes('Could not find')) {
        setError(err.message);
      } else if (err?.code === 1) {
        setError('Location permission denied. Please type an address instead.');
      } else if (err?.code === 3) {
        setError('Location request timed out. Please try again or type an address.');
      } else {
        console.error('Search failed:', err);
        setError('Could not find nearby centres. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    findNearest();
  };

  const handleInterest = async (centerId, e) => {
    if (e) e.stopPropagation();

    const pid = programmeContext?.programmeId;
    const programmeTitle = programmeContext?.programmeTitle || 'this programme';

    if (pid != null && submittedProgrammeIds.has(pid)) {
      alert(
        `You've already submitted your interest for ${programmeTitle}. ` +
        `Please wait for a centre to contact you.`
      );
      return;
    }

    try {
      const payload = { centerId };
      if (pid != null) payload.programmeId = pid;

      const res = await api.post('/learner/digital-centers/interest', payload);

      setInterestedCenters((prev) => [...prev, centerId]);
      if (pid != null) {
        setSubmittedProgrammeIds((prev) => {
          const next = new Set(prev);
          next.add(pid);
          return next;
        });
      }

      if (pid != null) {
        sessionStorage.removeItem('pendingProgrammeInterest');
      }

      const successMsg =
        res?.data?.message ||
        `Your interest in ${programmeTitle} has been submitted successfully. A centre will contact you soon.`;
      alert(successMsg);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update your interest.');
    }
  };



  const handleCardClick = (center) => setSelectedCenter(center);


  if (loading) {
    return (
      <div className="locate-page">
        <section className="locate-hero">
         <div className="hero-content">
            <h1>Locate a Digital Center Near You</h1>
            <p className="hero-subtitle">Loading digital centres...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="locate-page">
      <section className="locate-hero">
        <div className="hero-content">
          <button type="button" className="locate-back-btn" onClick={handleBack}>
            ← Back
          </button>

          <h1>Locate a Digital Center Near You</h1>
          <p className="hero-subtitle">
            Enter your address to find the nearest physical digital learning centre, explore accessible resources, and
            jump-start your learning journey.
          </p>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-wrapper">
              <div className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <input
                type="text"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. 27 Hunt Rd, Bulwer, Berea, 4083 (or leave empty for live location)"
              />
              <button type="submit" className="search-btn" disabled={searching}>
                {searching ? 'Locating...' : 'Search'}
              </button>
            </div>
          </form>

          {statusMsg && (
            <p style={{ color: '#0f766e', marginTop: 12, fontSize: 14 }}>{statusMsg}</p>
          )}
          {error && (
            <p style={{ color: '#dc3545', marginTop: 12, fontSize: 14 }}>{error}</p>
          )}
        </div>
      </section>

      <section className="locate-results">
        {programmeContext?.programmeId && (
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto 20px',
              padding: '14px 20px',
              borderRadius: 10,
              background: '#f0fdfa',
              color: '#0f766e',
              border: '1px solid #99f6e4',
              fontSize: 15,
              textAlign: 'center',
            }}
          >
            You're interested in <strong>{programmeContext.programmeTitle}</strong>.
            Pick a centre below to complete your interest.
          </div>
        )}


        <div className="results-header">
          <h2>{centers.length} Digital Centers Found</h2>
          <span className="sort-label">Sorted by nearest</span>
        </div>

        <div className="centers-list">
          {centers.length === 0 ? (
            <div className="center-card">
              <p style={{ textAlign: 'center', color: '#64748b', margin: 0 }}>
                No digital centres available.
              </p>
            </div>
          ) : (
            centers.map((center) => {
              const isSelected = selectedCenter?.id === center.id;

              const pid = programmeContext?.programmeId;
              const alreadySubmittedForProgramme =
                pid != null && submittedProgrammeIds.has(pid);

              return (
                <div
                  key={center.id}
                  className={`center-card ${isSelected ? 'center-card--selected' : ''}`}
                  onClick={() => handleCardClick(center)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleCardClick(center)}
                >
                  <div className="center-card-header">
                    <div className="center-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <h3>{center.name}</h3>
                    {center.distance && (
                      <span className="center-distance">{formatDistance(center.distance)}</span>
                    )}
                  </div>

                  <div className="center-details">
                    <div className="detail-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      <a
                        className="address-link"
                        href={googleMapsUrl(center.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Google Maps"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {center.address}
                      </a>
                    </div>
                    <div className="detail-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{center.hours}</span>
                    </div>
                    {center.phone && (
                      <div className="detail-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{center.phone}</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn-interest"
                    onClick={(e) => handleInterest(center.id, e)}
                    disabled={alreadySubmittedForProgramme}
                    style={{
                      opacity: alreadySubmittedForProgramme ? 0.45 : 1,
                      cursor: alreadySubmittedForProgramme ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Submit Interest
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default LocateCenter;