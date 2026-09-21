// src/pages/Learner_Screens/LocateCenter.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/Learner/Locate_Center.css';
import api from '../../services/api';

// ============================================
// Custom divIcons
// ============================================
const centerIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#10b981;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);box-sizing:border-box;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#dc2626;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(220,38,38,0.5);box-sizing:border-box;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const activeCenterIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;background:#f59e0b;border:4px solid #fff;border-radius:50%;box-shadow:0 0 0 6px rgba(245,158,11,0.25),0 3px 10px rgba(0,0,0,0.35);box-sizing:border-box;"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

// ============================================
// Fetch real road route from OSRM (free, no key)
// ============================================
const fetchRoute = async (from, to) => {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Routing service unavailable');
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const route = data.routes[0];
  const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

  return {
    latLngs,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
};

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
// MapController — owns the route drawing
// ============================================
const MapController = ({ target, userLocation, focusUser, onRouteInfo }) => {
  const map = useMap();
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (!target || !target.latitude || !target.longitude) {
      if (focusUser) {
        map.setView([userLocation.lat, userLocation.lng], 11, { animate: true });
      }
      onRouteInfo(null);
      return;
    }

    const loadRoute = async () => {
      try {
        const route = await fetchRoute(
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: target.latitude, lng: target.longitude }
        );

        const line = L.polyline(route.latLngs, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        const userToRouteStart = L.polyline(
          [[userLocation.lat, userLocation.lng], route.latLngs[0]],
          { color: '#94a3b8', weight: 3, opacity: 0.6, dashArray: '4 6' }
        ).addTo(map);

        const routeEndToCenter = L.polyline(
          [
            route.latLngs[route.latLngs.length - 1],
            [target.latitude, target.longitude],
          ],
          { color: '#94a3b8', weight: 3, opacity: 0.6, dashArray: '4 6' }
        ).addTo(map);

        routeLayerRef.current = L.layerGroup([
          line,
          userToRouteStart,
          routeEndToCenter,
        ]).addTo(map);

        if (route.distanceKm < 0.5) {
          const bounds = line.getBounds();
          const midLat = (bounds.getNorth() + bounds.getSouth()) / 2;
          const midLng = (bounds.getEast() + bounds.getWest()) / 2;
          map.setView([midLat, midLng], 16, { animate: true });
        } else {
          map.fitBounds(line.getBounds(), { padding: [80, 80], maxZoom: 15 });
        }

        onRouteInfo({
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
        });
      } catch (err) {
        console.error('Route fetch failed:', err);

        const fallback = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [target.latitude, target.longitude],
          ],
          { color: '#dc2626', weight: 3, opacity: 0.7, dashArray: '8 8' }
        ).addTo(map);

        routeLayerRef.current = fallback;

        map.fitBounds(fallback.getBounds(), { padding: [60, 60], maxZoom: 15 });
        onRouteInfo(null);
      }
    };

    loadRoute();

    return () => {
      if (routeLayerRef.current && map.hasLayer(routeLayerRef.current)) {
        map.removeLayer(routeLayerRef.current);
      }
      routeLayerRef.current = null;
    };
  }, [target, userLocation.lat, userLocation.lng, map, focusUser, onRouteInfo]);

  return null;
};

// ============================================
// LocateCenter — the page component
// ============================================
const LocateCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [centers, setCenters] = useState([]);
  const [interestedCenters, setInterestedCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const [selectedCenter, setSelectedCenter] = useState(null);
  const [focusUserTick, setFocusUserTick] = useState(0);
  const [routeInfo, setRouteInfo] = useState(null);

  const [userLocation, setUserLocation] = useState({ lat: -29.5, lng: 30.5 });

  // Programme the learner came from — passed by the dashboard / programmes
  // page through router state. Falls back to sessionStorage if needed.
  const [programmeContext, setProgrammeContext] = useState(null);

  // -------------------------------------------------------------------------
  // Read programme context on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Preferred source: router state passed by navigate()
    const stateProgrammeId = location.state?.programmeId ?? null;
    const stateProgrammeTitle = location.state?.programmeTitle ?? null;

    if (stateProgrammeId) {
      setProgrammeContext({
        programmeId: stateProgrammeId,
        programmeTitle: stateProgrammeTitle || 'this programme',
      });
      return;
    }

    // Fallback: legacy sessionStorage staging
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

  // -------------------------------------------------------------------------
  // Load centres + my centre interests
  // -------------------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/learner/digital-centers');
        if (res.data.success) setCenters(res.data.data || []);
        else setError(res.data.message || 'Failed to load centres');

        try {
          const mine = await api.get('/learner/digital-centers/my-interests');
          if (mine.data.success) {
            setInterestedCenters(mine.data.data.map((i) => i.digital_center_id));
          }
        } catch (_) { /* silent */ }
      } catch (err) {
        setError('Failed to load digital centres. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
        setUserLocation({ lat: latitude, lng: longitude });

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
        setUserLocation({ lat: latitude, lng: longitude });
        setStatusMsg('Showing centres near your live location.');
      }

      const res = await api.get('/learner/digital-centers/nearest', {
        params: { latitude, longitude },
      });

      if (res.data.success) {
        const list = res.data.data || [];
        setCenters(list);
        setSelectedCenter(list.length > 0 ? list[0] : null);
        setFocusUserTick((t) => t + 1);
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

  // ============================================
  // Submit / remove centre interest
  // The POST body now carries the programme id (if any) so the
  // learner_interests row links both programme and centre.
  // ============================================
  const handleInterest = async (centerId, e) => {
    if (e) e.stopPropagation();
    const already = interestedCenters.includes(centerId);

    try {
      if (already) {
        await api.delete('/learner/digital-centers/interest', {
          data: { centerId },
        });
        setInterestedCenters(interestedCenters.filter((id) => id !== centerId));
        return;
      }

      const payload = { centerId };
      if (programmeContext?.programmeId) {
        payload.programmeId = programmeContext.programmeId;
      }

      await api.post('/learner/digital-centers/interest', payload);
      setInterestedCenters([...interestedCenters, centerId]);

      if (programmeContext?.programmeId) {
        // Clear the staged context now that the interest is saved
        sessionStorage.removeItem('pendingProgrammeInterest');
        setProgrammeContext(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update your interest.');
    }
  };

  const handleCardClick = (center) => setSelectedCenter(center);

  const mappableCenters = useMemo(
    () =>
      centers
        .map((c) => ({
          ...c,
          latitude: parseFloat(c.latitude),
          longitude: parseFloat(c.longitude),
        }))
        .filter(
          (c) =>
            !isNaN(c.latitude) &&
            !isNaN(c.longitude) &&
            c.latitude !== 0 &&
            c.longitude !== 0
        ),
    [centers]
  );

  const validSelected = useMemo(() => {
    if (!selectedCenter) return null;
    const lat = parseFloat(selectedCenter.latitude);
    const lng = parseFloat(selectedCenter.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { ...selectedCenter, latitude: lat, longitude: lng };
  }, [selectedCenter]);

  if (loading) {
    return (
      <div className="locate-page">
        <section className="locate-hero">
          <div className="hero-content">
            <button
              type="button"
              className="back-dashboard-btn"
              onClick={() => navigate('/learner-dashboard')}
            >
              <span aria-hidden="true">&larr;</span> Back to Dashboard
            </button>
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
          <button
            type="button"
            className="back-dashboard-btn"
            onClick={() => navigate('/learner-dashboard')}
          >
            <span aria-hidden="true">&larr;</span> Back to Dashboard
          </button>
          <h1>Locate a Digital Center Near You</h1>
          <p className="hero-subtitle">
            Enter your address to find the nearest physical digital learning centre, explore accessible resources, and
            jump-start your learning journey.
          </p>

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

      {/* Programme context banner — tells the learner why they're here */}
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

      <section className="locate-results">
        <div className="results-header">
          <h2>{centers.length} Digital Centers Found</h2>
          <span className="sort-label">Sorted by nearest</span>
        </div>

        <div className="results-grid">
          <div className="centers-list">
            {centers.length === 0 ? (
              <div className="center-card">
                <p style={{ textAlign: 'center', color: '#64748b' }}>
                  No digital centres available.
                </p>
              </div>
            ) : (
              centers.map((center) => {
                const isSelected = selectedCenter?.id === center.id;
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <h3>{center.name}</h3>
                      {center.distance && <span className="center-distance">{center.distance}</span>}
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
                      {center.phone && (
                        <div className="detail-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span>{center.phone}</span>
                        </div>
                      )}
                    </div>

                    <button
                      className={`btn-interest ${interestedCenters.includes(center.id) ? 'interested' : ''}`}
                      onClick={(e) => handleInterest(center.id, e)}
                    >
                      {interestedCenters.includes(center.id)
                        ? 'Interest Submitted'
                        : 'Submit Interest'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="map-container">
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={8}
              scrollWheelZoom={true}
              style={{ height: '560px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                target={validSelected}
                userLocation={userLocation}
                focusUser={focusUserTick}
                onRouteInfo={setRouteInfo}
              />

              {routeInfo && (
                <div className="route-info-box">
                  <div className="route-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                      <circle cx="12" cy="5" r="2" />
                      <path d="M12 7v6l4 2" />
                      <path d="M7 21l3-5 2-3" />
                      <path d="M17 21l-3-5" />
                    </svg>
                  </div>
                  <div>
                    <div className="route-info-time">
                      {Math.round(routeInfo.durationMin)} min
                    </div>
                    <div className="route-info-distance">
                      {routeInfo.distanceKm.toFixed(1)} km
                    </div>
                  </div>
                </div>
              )}

              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <strong>Search Origin</strong>
                  <br />
                  <span style={{ fontSize: 12 }}>
                    {searchTerm ? searchTerm : 'Your live location'}
                  </span>
                </Popup>
              </Marker>

              {mappableCenters.map((center) => {
                const isSelected = selectedCenter?.id === center.id;
                return (
                  <Marker
                    key={center.id}
                    position={[center.latitude, center.longitude]}
                    icon={isSelected ? activeCenterIcon : centerIcon}
                    eventHandlers={{ click: () => setSelectedCenter(center) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <strong>{center.name}</strong>
                        <br />
                        <span style={{ fontSize: 12 }}>{center.address}</span>
                        {center.phone && (
                          <>
                            <br />
                            <span style={{ fontSize: 12 }}>{center.phone}</span>
                          </>
                        )}
                        {center.distance && (
                          <>
                            <br />
                            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>
                              {center.distance}
                            </span>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LocateCenter;