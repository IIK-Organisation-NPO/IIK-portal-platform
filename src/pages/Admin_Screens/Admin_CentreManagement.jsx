// src/pages/Admin_Screens/Admin_CentreManagement.jsx
import { useState, useEffect, useMemo } from 'react';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_CentreManagement.css';
import { API, authHeaders } from '../../config/api';

const PAGE_SIZE = 5;
const DEFAULT_HOURS = 'Mon-Fri: 8:00 AM - 4:00 PM';
const DEFAULT_REGION = 'KwaZulu-Natal';

const REGIONS = [
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

const EMPTY_FORM = {
  name: '',
  address: '',
  phone: '',
  hours: '',
  status: 'Active',
  region: DEFAULT_REGION
};

const STORAGE_KEY = 'iik_centre_management_changes';
const EMPTY_CHANGES = { added: [], edited: {}, deleted: [] };

const readChanges = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored) return EMPTY_CHANGES;
    return {
      added: Array.isArray(stored.added) ? stored.added : [],
      edited: stored.edited && typeof stored.edited === 'object' ? stored.edited : {},
      deleted: Array.isArray(stored.deleted) ? stored.deleted : []
    };
  } catch {
    return EMPTY_CHANGES;
  }
};

const applyChanges = (base, changes) =>
  [...base, ...changes.added]
    .filter(c => !changes.deleted.includes(String(c.id)))
    .map(c => ({ ...c, ...(changes.edited[String(c.id)] || {}) }));

// ---- Name ------------------------------------------------------------
const validateCentreName = (value) => {
  const v = (value || '').trim();
  if (!v) return 'Centre name is required';
  if (v.length < 3) return 'Centre name must be at least 3 characters';
  if (v.length > 100) return 'Centre name must be less than 100 characters';
  if (/\d/.test(v)) return 'Centre name cannot contain numbers';
  if (!/^[A-Za-z\s\-'&.]+$/.test(v)) {
    return 'Centre name can only contain letters, spaces, hyphens, apostrophes, ampersands, and periods';
  }
  return '';
};

// ---- Address ---------------------------------------------------------
const validateAddress = (value) => {
  const v = (value || '').trim();
  if (!v) return 'Address is required';
  if (v.length < 5) return 'Please enter the full address';
  if (v.length > 255) return 'Address must be less than 255 characters';
  return '';
};

// ---- Phone -----------------------------------------------------------
const normalisePhone = (value) => {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) {
    digits = '0' + digits.slice(2);
  }
  if (digits.length === 9 && /^[678]/.test(digits)) {
    digits = '0' + digits;
  }
  return digits;
};

const validatePhone = (value) => {
  const v = (value || '').trim();
  if (!v) return 'Phone number is required';
  if (!/^[+\d\s()-]+$/.test(v)) {
    return 'Phone number can only contain digits, spaces, +, - and brackets';
  }
  const normalised = normalisePhone(v);
  if (normalised.length !== 10) {
    return 'Phone number must be exactly 10 digits (e.g. 076 065 6576)';
  }
  if (!normalised.startsWith('0')) {
    return 'Phone number must start with 0 (e.g. 076 065 6576)';
  }
  return '';
};

const validateHours = (value) => {
  const v = (value || '').trim();
  if (!v) return 'Opening hours are required';
  if (v.length < 3) return 'Opening hours must be at least 3 characters';
  if (v.length > 60) return 'Opening hours must be less than 60 characters';
  return '';
};

// ---- Fetch helpers ----------------------------------------------------
const fetchJson = async (endpoint) => {
  const res = await fetch(endpoint, {
    headers: authHeaders(),
    credentials: 'include'
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return body.data;
};

// ---- loadCentres ------------------------------------------------------
const loadCentres = async () => {
  const [allResult, detailResult, countResult] = await Promise.allSettled([
    fetchJson(API.staff.digitalCenters),
    fetchJson(API.learner.digitalCenters),
    fetchJson(API.admin.analyticsCentres)
  ]);

  if (allResult.status === 'rejected' && detailResult.status === 'rejected') {
    throw allResult.reason;
  }

  const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
    if (value && Array.isArray(value.programmes)) return value.programmes;
    return [];
  };

  const allArray = asArray(allResult.status === 'fulfilled' ? allResult.value : []);
  const detailsArray = asArray(detailResult.status === 'fulfilled' ? detailResult.value : []);
  const countsArray = asArray(countResult.status === 'fulfilled' ? countResult.value : []);

  const detailsById = new Map(
    detailsArray.map(c => [String(c.digital_center_id ?? c.id), c])
  );

  const learnersByName = new Map(
    countsArray.map(c => [
      String(c.name || '').trim().toLowerCase(),
      Number(c.count) || 0
    ])
  );

  const master = allArray.length > 0 ? allArray : detailsArray;

  return master.map(row => {
    const id = row.digital_center_id ?? row.id;
    const name = row.center_name ?? row.name ?? 'Unnamed Centre';
    const detail = detailsById.get(String(id)) || {};

    const address = row.address ?? detail.address ?? '';
    const phone =
      row.contact_number ?? row.phone ??
      detail.contact_number ?? detail.phone ?? '';
    const hours =
      row.opening_hours ?? row.hours ??
      detail.opening_hours ?? detail.hours ?? DEFAULT_HOURS;
    const status = row.status ?? detail.status ?? 'Active';
    const region = row.region ?? detail.region ?? DEFAULT_REGION;
    const learners =
      learnersByName.get(String(name).trim().toLowerCase()) ?? 0;

    return { id, name, address, phone, hours, status, region, learners };
  });
};

// ---- loadCentreStats --------------------------------------------------
const loadCentreStats = async () => {
  try {
    const stats = await fetchJson(API.admin.centresStats);
    return {
      totalCentres: Number(stats?.totalCentres) || 0,
      activeCentres: Number(stats?.activeCentres) || 0,
      totalLearners: Number(stats?.totalLearners) || 0
    };
  } catch (err) {
    console.warn('Stats endpoint unavailable, falling back to client computation:', err.message);
    return null;
  }
};

const AdminCentreManagement = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [baseCentres, setBaseCentres] = useState([]);
  const [changes, setChanges] = useState(readChanges);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [centreToEdit, setCentreToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ phone: '', hours: '' });
  const [editErrors, setEditErrors] = useState({});
  const [centreToDeactivate, setCentreToDeactivate] = useState(null);
  const [centreToActivate, setCentreToActivate] = useState(null);
  const [centreToDelete, setCentreToDelete] = useState(null);
  const [resultMessage, setResultMessage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const centres = useMemo(() => applyChanges(baseCentres, changes), [baseCentres, changes]);

  const fetchCentres = () =>
    Promise.all([loadCentres(), loadCentreStats()])
      .then(([loaded, statsData]) => {
        setBaseCentres(loaded);
        setStats(statsData);
        setLoadError('');
      })
      .catch((err) => {
        console.error('Fetch centres error:', err);
        setLoadError(err.message || 'Failed to load digital centres.');
      })
      .finally(() => setIsLoading(false));

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError('');
    fetchCentres();
  };

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(changes));
    } catch (err) {
      console.error('Could not store centre changes:', err);
    }
  }, [changes]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollButton(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const patchCentre = (id, patch) => {
    setChanges(prev => ({
      ...prev,
      edited: { ...prev.edited, [String(id)]: { ...(prev.edited[String(id)] || {}), ...patch } }
    }));
  };

  // ---------- Stats ----------
  const totalCentres = stats ? stats.totalCentres : centres.length;
  const activeCentres = stats ? stats.activeCentres : centres.filter(c => c.status === 'Active').length;
  const totalLearners = stats ? stats.totalLearners : centres.reduce((sum, c) => sum + (Number(c.learners) || 0), 0);

  // ---------- Filters + pagination ----------
  const regionOptions = useMemo(
    () => [...new Set(centres.map(c => c.region).filter(Boolean))].sort(),
    [centres]
  );

  const filteredCentres = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return centres.filter(c => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (regionFilter !== 'All' && c.region !== regionFilter) return false;
      if (!term) return true;
      return (
        (c.name || '').toLowerCase().includes(term) ||
        (c.address || '').toLowerCase().includes(term)
      );
    });
  }, [centres, searchTerm, statusFilter, regionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCentres.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedCentres = filteredCentres.slice(pageStart, pageStart + PAGE_SIZE);

  // ---------- Form ----------
  const validateField = (field, value) => {
    switch (field) {
      case 'name':    return validateCentreName(value);
      case 'address': return validateAddress(value);
      case 'phone':   return validatePhone(value);
      case 'hours':   return validateHours(value);
      default:        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // ---- Phone change handler (Create form) ------------------------------
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const rawDigits = raw.replace(/\D/g, '');
    let effectiveDigits = rawDigits.length;
    if (rawDigits.startsWith('27')) {
      effectiveDigits = rawDigits.length - 1;
    }
    if (effectiveDigits > 10) return;

    setFormData(prev => ({ ...prev, phone: raw }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: validateField('phone', raw) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ---------- Save Centre (Create or Update via backend) ----------
  const handleSaveCentre = async (e) => {
    e.preventDefault();

    const newErrors = {};
    ['name', 'address', 'phone', 'hours'].forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Full payload now that the DB has opening_hours, status, region
    const payload = {
      center_name: formData.name.trim(),
      address: formData.address.trim(),
      contact_number: normalisePhone(formData.phone),
      opening_hours: formData.hours.trim() || null,
      status: formData.status || 'Active',
      region: formData.region || null
    };

    const existing = centres.find(
      c => (c.name || '').toLowerCase() === payload.center_name.toLowerCase()
    );

    try {
      const endpoint = existing
        ? `${API.admin.centres}/${existing.id}`
        : API.admin.centres;

      const res = await fetch(endpoint, {
        method: existing ? 'PUT' : 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Request failed.');
      }

      setResultMessage({
        title: existing ? 'Centre Updated' : 'Centre Registered',
        text: existing
          ? <><strong>{payload.center_name}</strong> has been updated.</>
          : <><strong>{payload.center_name}</strong> has been added to the digital centres.</>
      });

      setFormData(EMPTY_FORM);
      setErrors({});
      await fetchCentres();
    } catch (err) {
      setResultMessage({
        title: 'Error',
        text: err.message
      });
    }
  };

  // ---------- Edit ----------
  const handleEdit = (centre) => {
    setCentreToEdit(centre);
    setEditForm({
      phone: centre.phone || '',
      hours: centre.hours || DEFAULT_HOURS
    });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // ---- Phone change handler (Edit modal) -------------------------------
  const handleEditPhoneChange = (e) => {
    const raw = e.target.value;
    const rawDigits = raw.replace(/\D/g, '');
    let effectiveDigits = rawDigits.length;
    if (rawDigits.startsWith('27')) {
      effectiveDigits = rawDigits.length - 1;
    }
    if (effectiveDigits > 10) return;

    setEditForm(prev => ({ ...prev, phone: raw }));
    if (editErrors.phone) {
      setEditErrors(prev => ({ ...prev, phone: validatePhone(raw) }));
    }
  };

  const handleSaveEdit = async () => {
    if (!centreToEdit) return;

    const newErrors = {};
    const phoneErr = validatePhone(editForm.phone);
    const hoursErr = validateHours(editForm.hours);
    if (phoneErr) newErrors.phone = phoneErr;
    if (hoursErr) newErrors.hours = hoursErr;

    setEditErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await fetch(`${API.admin.centres}/${centreToEdit.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          contact_number: normalisePhone(editForm.phone),
          opening_hours: editForm.hours.trim() || null
        })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Update failed.');
      }

      setResultMessage({
        title: 'Centre Updated',
        text: <>Details for <strong>{centreToEdit.name}</strong> have been saved.</>
      });
      setCentreToEdit(null);
      await fetchCentres();
    } catch (err) {
      setResultMessage({
        title: 'Error',
        text: err.message
      });
    }
  };

  // ---------- Deactivate / activate (now backend-driven) ----------
  const handleConfirmDeactivate = async () => {
    if (!centreToDeactivate) return;
    try {
      const res = await fetch(`${API.admin.centres}/${centreToDeactivate.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: 'Inactive' })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Failed to deactivate.');
      }
      setResultMessage({
        title: 'Centre Deactivated',
        text: <><strong>{centreToDeactivate.name}</strong> is now inactive.</>
      });
      setCentreToDeactivate(null);
      await fetchCentres();
    } catch (err) {
      setResultMessage({ title: 'Error', text: err.message });
    }
  };

  const handleConfirmActivate = async () => {
    if (!centreToActivate) return;
    try {
      const res = await fetch(`${API.admin.centres}/${centreToActivate.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: 'Active' })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Failed to activate.');
      }
      setResultMessage({
        title: 'Centre Activated',
        text: <><strong>{centreToActivate.name}</strong> is active again.</>
      });
      setCentreToActivate(null);
      await fetchCentres();
    } catch (err) {
      setResultMessage({ title: 'Error', text: err.message });
    }
  };

  // ---------- Delete ----------
  const handleConfirmDelete = async () => {
    if (!centreToDelete) return;

    try {
      const res = await fetch(`${API.admin.centres}/${centreToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include'
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Delete failed.');
      }

      setResultMessage({
        title: 'Centre Deleted',
        text: <><strong>{centreToDelete.name}</strong> has been removed.</>
      });
      setCentreToDelete(null);
      await fetchCentres();
    } catch (err) {
      setResultMessage({
        title: 'Error',
        text: err.message
      });
    }
  };

  // ---------- Export ----------
  const handleExportCentres = () => {
    if (filteredCentres.length === 0) return;

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Centre', 'Address', 'Phone', 'Opening Hours', 'Region', 'Status', 'Learners'],
      ...filteredCentres.map(c => [c.name, c.address, c.phone, c.hours, c.region, c.status, c.learners])
    ];
    const csvContent = rows.map(row => row.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digital_centres.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container cm-page">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-layout">
        <Admin_Sidebar
          active="centres"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="admin-content">
          <div className="cm-page-header">
            <h1>Centre Management</h1>
            <p>Register digital centres, manage operational access, and monitor learner distribution across each location.</p>
          </div>

          <div className="cm-stats-grid">
            <div className="cm-stat-card">
              <span className="cm-stat-label">Total Centres</span>
              <span className="cm-stat-value">{totalCentres}</span>
            </div>
            <div className="cm-stat-card">
              <span className="cm-stat-label">Active Centres</span>
              <span className="cm-stat-value">{activeCentres}</span>
            </div>
            <div className="cm-stat-card">
              <span className="cm-stat-label">Total Learners</span>
              <span className="cm-stat-value">{totalLearners}</span>
            </div>
          </div>

          <h2 className="cm-section-title">Register / Update Centre</h2>
          <div className="cm-card">
            <form onSubmit={handleSaveCentre} noValidate>
              <div className="cm-form-grid">
                <div className="cm-form-group">
                  <label htmlFor="cm-name">Centre Name</label>
                  <input
                    id="cm-name"
                    type="text"
                    name="name"
                    placeholder="Enter centre name..."
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="cm-field-error">{errors.name}</span>}
                </div>

                <div className="cm-form-group">
                  <label htmlFor="cm-address">Address</label>
                  <input
                    id="cm-address"
                    type="text"
                    name="address"
                    placeholder="Enter full address..."
                    value={formData.address}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <span className="cm-field-error">{errors.address}</span>}
                </div>

                <div className="cm-form-group">
                  <label htmlFor="cm-phone">Phone Number</label>
                  <input
                    id="cm-phone"
                    type="tel"
                    name="phone"
                    placeholder="e.g. +27 (0)11 555 0192"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onBlur={handleBlur}
                    className={errors.phone ? 'error' : ''}
                    inputMode="tel"
                    maxLength={17}
                  />
                  {errors.phone && <span className="cm-field-error">{errors.phone}</span>}
                </div>

                <div className="cm-form-group">
                  <label htmlFor="cm-hours">Opening Hours</label>
                  <input
                    id="cm-hours"
                    type="text"
                    name="hours"
                    placeholder="e.g. Mon-Fri: 8:00 AM - 4:00 PM"
                    value={formData.hours}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={errors.hours ? 'error' : ''}
                  />
                  {errors.hours && <span className="cm-field-error">{errors.hours}</span>}
                </div>

                <div className="cm-form-group">
                  <label htmlFor="cm-status">Status</label>
                  <select
                    id="cm-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="cm-form-group">
                  <label htmlFor="cm-region">Region</label>
                  <select
                    id="cm-region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                  >
                    {REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cm-form-actions">
                <button type="submit" className="cm-btn-primary">Save Centre</button>
              </div>
            </form>
          </div>

          <div className="cm-controls-bar">
            <div className="cm-controls-left">
              <button
                className="cm-btn-outline"
                onClick={handleExportCentres}
                disabled={filteredCentres.length === 0}
              >
                Export Centres
              </button>
            </div>
            <div className="cm-controls-right">
              <select
                className="cm-filter-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                aria-label="Filter by status"
              >
                <option value="All">Status: All</option>
                <option value="Active">Status: Active</option>
                <option value="Inactive">Status: Inactive</option>
              </select>
              <select
                className="cm-filter-select"
                value={regionFilter}
                onChange={(e) => { setRegionFilter(e.target.value); setCurrentPage(1); }}
                aria-label="Filter by region"
              >
                <option value="All">Region: All</option>
                {regionOptions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <input
                type="text"
                className="cm-search-input"
                placeholder="Search centre name or address..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="cm-safety-banner">
            <svg className="cm-safety-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p><strong>Centre Management Safety:</strong> Deactivation preserves learner history and keeps the centre visible internally. Deletion removes the centre record permanently and requires reassignment of attached learners first.</p>
          </div>

          <h2 className="cm-section-title">Current Digital Centres</h2>
          <div className="cm-card cm-table-card">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Learners</th>
                  <th className="cm-actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="cm-no-results">Loading digital centres...</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan="6" className="cm-no-results">
                      {loadError}{' '}
                      <button className="cm-btn-outline" onClick={handleRetry}>Retry</button>
                    </td>
                  </tr>
                ) : pagedCentres.length > 0 ? (
                  pagedCentres.map((centre) => (
                    <tr key={centre.id}>
                      <td className="cm-centre-name" data-label="Centre">{centre.name}</td>
                      <td className="cm-address-cell" data-label="Address" title={centre.address}>{centre.address || '—'}</td>
                      <td className="cm-nowrap" data-label="Phone">{centre.phone || '—'}</td>
                      <td data-label="Status">
                        <span className={`cm-status-badge cm-status-${centre.status.toLowerCase()}`}>
                          {centre.status}
                        </span>
                      </td>
                      <td className="cm-learners-cell" data-label="Learners">{centre.learners}</td>
                      <td className="cm-actions-cell" data-label="Actions">
                        <div className="cm-action-buttons">
                          <button className="cm-btn-edit" onClick={() => handleEdit(centre)}>
                            Edit
                          </button>
                          {centre.status === 'Active' ? (
                            <button className="cm-btn-deactivate" onClick={() => setCentreToDeactivate(centre)}>
                              Deactivate
                            </button>
                          ) : (
                            <button className="cm-btn-activate" onClick={() => setCentreToActivate(centre)}>
                              Activate
                            </button>
                          )}
                          <button className="cm-btn-delete" onClick={() => setCentreToDelete(centre)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="cm-no-results">No centres found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && !loadError && filteredCentres.length > 0 && (
            <div className="cm-pagination-row">
              <span className="cm-pagination-info">
                Showing {pageStart + 1}-{pageStart + pagedCentres.length} of {filteredCentres.length} centres
              </span>
              <div className="cm-pagination">
                <button
                  className="cm-page-btn"
                  onClick={() => setCurrentPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    className={`cm-page-btn ${number === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <button
                  className="cm-page-btn"
                  onClick={() => setCurrentPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {centreToEdit && (
            <div className="cm-modal-overlay">
              <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby="cm-edit-modal-title">
                <h2 id="cm-edit-modal-title">Edit Centre</h2>
                <div className="cm-modal-content">
                  <p><strong>Centre:</strong> {centreToEdit.name}</p>
                  <div className="cm-form-group">
                    <label htmlFor="cm-edit-phone">Phone Number</label>
                    <input
                      id="cm-edit-phone"
                      type="tel"
                      name="phone"
                      placeholder="e.g. +27 (0)11 555 0192"
                      value={editForm.phone}
                      onChange={handleEditPhoneChange}
                      className={editErrors.phone ? 'error' : ''}
                      inputMode="tel"
                      maxLength={17}
                    />
                    {editErrors.phone && <span className="cm-field-error">{editErrors.phone}</span>}
                  </div>
                  <div className="cm-form-group">
                    <label htmlFor="cm-edit-hours">Opening Hours</label>
                    <input
                      id="cm-edit-hours"
                      type="text"
                      name="hours"
                      placeholder="e.g. Mon-Fri: 8:00 AM - 4:00 PM"
                      value={editForm.hours}
                      onChange={handleEditChange}
                      className={editErrors.hours ? 'error' : ''}
                    />
                    {editErrors.hours && <span className="cm-field-error">{editErrors.hours}</span>}
                  </div>
                </div>
                <div className="cm-modal-actions">
                  <button className="cm-modal-cancel" onClick={() => setCentreToEdit(null)}>Cancel</button>
                  <button className="cm-modal-confirm" onClick={handleSaveEdit}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {centreToDeactivate && (
            <div className="cm-modal-overlay">
              <div className="cm-modal cm-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="cm-deactivate-modal-title">
                <h2 id="cm-deactivate-modal-title">Deactivate Centre?</h2>
                <div className="cm-modal-content">
                  <p className="cm-confirmation-question">Are you sure you want to deactivate <strong>{centreToDeactivate.name}</strong>?</p>
                  <p className="cm-modal-warning">This action will mark the centre as inactive. Learner history is preserved.</p>
                </div>
                <div className="cm-modal-actions">
                  <button className="cm-modal-cancel" onClick={() => setCentreToDeactivate(null)}>Cancel</button>
                  <button className="cm-modal-confirm" onClick={handleConfirmDeactivate}>Deactivate Centre</button>
                </div>
              </div>
            </div>
          )}

          {centreToActivate && (
            <div className="cm-modal-overlay">
              <div className="cm-modal cm-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="cm-activate-modal-title">
                <h2 id="cm-activate-modal-title">Activate Centre?</h2>
                <div className="cm-modal-content">
                  <p className="cm-confirmation-question">Are you sure you want to activate <strong>{centreToActivate.name}</strong> again?</p>
                </div>
                <div className="cm-modal-actions">
                  <button className="cm-modal-cancel" onClick={() => setCentreToActivate(null)}>Cancel</button>
                  <button className="cm-modal-confirm" onClick={handleConfirmActivate}>Activate Centre</button>
                </div>
              </div>
            </div>
          )}

          {centreToDelete && (
            <div className="cm-modal-overlay">
              <div className="cm-modal cm-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="cm-delete-modal-title">
                <h2 id="cm-delete-modal-title">Delete Centre?</h2>
                <div className="cm-modal-content">
                  <p className="cm-confirmation-question">Are you sure you want to delete <strong>{centreToDelete.name}</strong>?</p>
                  <p className="cm-modal-warning">This action cannot be reversed. The centre will be removed from the system completely.</p>
                </div>
                <div className="cm-modal-actions">
                  <button className="cm-modal-cancel" onClick={() => setCentreToDelete(null)}>Cancel</button>
                  <button className="cm-modal-delete" onClick={handleConfirmDelete}>Delete Centre</button>
                </div>
              </div>
            </div>
          )}

          {resultMessage && (
            <div className="cm-modal-overlay">
              <div className="cm-modal cm-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="cm-result-modal-title">
                <h2 id="cm-result-modal-title">{resultMessage.title}</h2>
                <div className="cm-modal-content">
                  <p className="cm-confirmation-question">{resultMessage.text}</p>
                </div>
                <div className="cm-modal-actions">
                  <button className="cm-modal-confirm" onClick={() => setResultMessage(null)}>OK</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showScrollButton && (
        <button className="cm-scroll-to-top-btn" onClick={scrollToTop} aria-label="Scroll to top">
          ↑
        </button>
      )}
    </div>
  );
};

export default AdminCentreManagement;
