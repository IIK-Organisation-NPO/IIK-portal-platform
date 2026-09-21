// src/pages/Admin_Screens/Admin_Programmes.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/admin_Programmes.css';

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:5000';

// ---------------------------------------------------------------------------
// Safe normalizer
// ---------------------------------------------------------------------------
const normalizeProgramme = (p = {}) => {
  const rawStatus = p.status ?? p.Programme_status ?? 'Draft';
  const isArchived =
    p.archived === true ||
    p.Programme_status === 'Archived' ||
    p.Archived === 1;

  let formattedStartDate = 'Not set';
  const rawDate = p.startDate ?? p.Start_date;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedStartDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    } else {
      formattedStartDate = String(rawDate);
    }
  }

  return {
    id: p.id ?? p.Programme_id ?? Date.now(),
    name: p.name ?? p.Programme_name ?? 'Untitled Programme',
    description: p.description ?? p.Programme_description ?? '',
    duration: p.duration ?? p.Duration ?? '',
    startDate: formattedStartDate,
    status: isArchived ? 'Archived' : rawStatus,
    enrolled: Number(p.enrolled ?? p.Enrolled ?? 0),
    category: p.category ?? p.Category ?? '',
    archived: isArchived
  };
};

const AdminProgrammes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Category');
  const [statusFilter, setStatusFilter] = useState('Status');
  const [showArchived, setShowArchived] = useState(false);
  const [programmeToArchive, setProgrammeToArchive] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [programmeToDelete, setProgrammeToDelete] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editError, setEditError] = useState('');

  // -------------------------------------------------------------------------
  // Total enrolments — fetched from /admin/stats
  // -------------------------------------------------------------------------
  const [totalEnrolments, setTotalEnrolments] = useState(0);

  // -------------------------------------------------------------------------
  // Fetch programmes
  // -------------------------------------------------------------------------
  const fetchProgrammes = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/programmes`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load programmes.');
      }

      setProgrammes((data.programmes || []).map(normalizeProgramme));
    } catch (err) {
      console.error('Fetch programmes error:', err);
      setLoadError(err.message || 'Failed to load programmes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch aggregate stats (for the Total Enrolments card)
  // -------------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      const data = await res.json();

      if (data.success && data.data) {
        setTotalEnrolments(Number(data.data.totalEnrollments) || 0);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
      // Silent — the card just shows 0 if this fails
    }
  }, []);

  useEffect(() => {
    fetchProgrammes();
    fetchStats();
  }, [fetchProgrammes, fetchStats]);

  // -------------------------------------------------------------------------
  // Router state passthrough
  // -------------------------------------------------------------------------
  useEffect(() => {
    const incoming = location.state?.programme;
    if (!incoming) return;

    const normalized = normalizeProgramme(incoming);
    setProgrammes(current =>
      current.some(p => p.id === normalized.id)
        ? current
        : [normalized, ...current]
    );
    navigate('/admin/programmes', { replace: true, state: {} });
  }, [location.state?.programme, navigate]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(v => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollButton(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  const categories = useMemo(
    () => [
      'Category',
      'All',
      ...new Set(programmes.map(p => p.category).filter(Boolean))
    ],
    [programmes]
  );

  const statuses = ['Status', 'All', 'Active', 'Upcoming', 'Draft', 'Archived'];

  const filteredProgrammes = useMemo(() => {
    const search = (searchTerm || '').trim().toLowerCase();

    return programmes.filter(p => {
      const name = (p.name || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const matchesSearch =
        search === '' || name.includes(search) || description.includes(search);

      const matchesCategory =
        categoryFilter === 'Category' ||
        categoryFilter === 'All' ||
        p.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'Status' ||
        statusFilter === 'All' ||
        (statusFilter === 'Archived' ? p.archived : p.status === statusFilter);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [programmes, searchTerm, categoryFilter, statusFilter]);

  const activeProgrammes = filteredProgrammes.filter(p => !p.archived);
  const archivedProgrammes = filteredProgrammes.filter(p => p.archived);
  const displayedProgrammes = showArchived
    ? [...activeProgrammes, ...archivedProgrammes]
    : activeProgrammes;

  const totalProgrammes = programmes.length;
  const activeProgrammesCount = programmes.filter(
    p => p.status === 'Active' && !p.archived
  ).length;

  // -------------------------------------------------------------------------
  // Archive / Unarchive
  // -------------------------------------------------------------------------
  const handleArchive = async (id) => {
    const target = programmes.find(p => p.id === id);
    if (!target) return;

    const endpoint = target.archived
      ? `${API_BASE}/api/programmes/${id}/unarchive`
      : `${API_BASE}/api/programmes/${id}/archive`;

    const previous = programmes;
    setProgrammes(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              archived: !p.archived,
              status: !p.archived ? 'Archived' : p.status
            }
          : p
      )
    );
    setProgrammeToArchive(null);

    try {
      const res = await fetch(endpoint, { method: 'PATCH' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update programme.');
      }

      setProgrammes(prev =>
        prev.map(p => (p.id === id ? normalizeProgramme(data.programme) : p))
      );
    } catch (err) {
      console.error('Archive/unarchive error:', err);
      setProgrammes(previous);
      setLoadError(err.message || 'Failed to update programme.');
    }
  };

  // -------------------------------------------------------------------------
  // Edit — open modal
  // -------------------------------------------------------------------------
  const handleEdit = (programme) => {
    setEditingProgramme(programme);
    setEditName(programme.name);
    setEditStatus(programme.status);
    setEditError('');
    setShowEditModal(true);
  };

  // -------------------------------------------------------------------------
  // Save edit
  // -------------------------------------------------------------------------
  const handleSaveEdit = async () => {
    if (!editingProgramme) return;

    const trimmedName = editName.trim() || editingProgramme.name;

    try {
      const res = await fetch(
        `${API_BASE}/api/programmes/${editingProgramme.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            programmeName: trimmedName,
            status: editStatus
          })
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setEditError(data.message || 'Failed to save changes.');
        return;
      }

      setProgrammes(prev =>
        prev.map(p =>
          p.id === editingProgramme.id ? normalizeProgramme(data.programme) : p
        )
      );
      setEditError('');
      setShowEditModal(false);
      setEditingProgramme(null);
    } catch (err) {
      console.error('Save edit error:', err);
      setEditError(err.message || 'Failed to save changes.');
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDeleteProgramme = async () => {
    if (!programmeToDelete) return;
    const id = programmeToDelete.id;

    const previous = programmes;
    setProgrammes(prev => prev.filter(p => p.id !== id));
    setProgrammeToDelete(null);

    try {
      const res = await fetch(`${API_BASE}/api/programmes/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete programme.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setProgrammes(previous);
      setLoadError(err.message || 'Failed to delete programme.');
    }
  };

  const handleCreateProgramme = () => {
    navigate('/admin/create-programme');
  };

  const handleExportData = () => {
    const exportData = filteredProgrammes.map(p => ({
      'Programme Name': p.name,
      Enrolled: p.enrolled,
      'Start Date': p.startDate,
      Status: p.archived ? 'Archived' : p.status,
      Category: p.category
    }));

    if (exportData.length === 0) return;

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programmes_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-layout">
        <Admin_Sidebar
          active="programmes"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="admin-content">
          <div className="page-header">
            <div className="page-header-row">
              <h1>Programme Management</h1>
              <button className="btn-primary" onClick={handleCreateProgramme}>
                + Create Programme
              </button>
            </div>
            <p>Create, manage, and monitor training programmes and enrolment pipelines.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Programmes</span>
              <span className="stat-value">{totalProgrammes}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active Programmes</span>
              <span className="stat-value">{activeProgrammesCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Enrolments</span>
              <span className="stat-value">{totalEnrolments}</span>
            </div>
          </div>

          <div className="controls-bar">
            <div className="controls-left">
              <button className="btn-secondary" onClick={handleExportData}>
                Export Data
              </button>
            </div>
            <div className="controls-right">
              <input
                type="text"
                className="search-input"
                placeholder="Search programmes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {archivedProgrammes.length > 0 && (
                <button
                  className="btn-archived"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? 'Hide' : 'Show'} Archived ({archivedProgrammes.length})
                </button>
              )}
            </div>
          </div>

          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PROGRAMME NAME</th>
                  <th>ENROLLED</th>
                  <th>START DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="no-results">Loading programmes...</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan="5" className="no-results">
                      {loadError}{' '}
                      <button className="btn-secondary" onClick={fetchProgrammes}>
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : displayedProgrammes.length > 0 ? (
                  displayedProgrammes.map((programme) => (
                    <tr key={programme.id} className={programme.archived ? 'archived-row' : ''}>
                      <td>{programme.name}</td>
                      <td>{programme.enrolled} learners</td>
                      <td>{programme.startDate}</td>
                      <td>
                        <span className={`status-badge status-${(programme.status || 'draft').toLowerCase()}`}>
                          {programme.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(programme)}
                            disabled={programme.archived}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn-archive ${programme.archived ? 'btn-unarchive' : ''}`}
                            onClick={() => programme.archived
                              ? handleArchive(programme.id)
                              : setProgrammeToArchive(programme)}
                          >
                            {programme.archived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => setProgrammeToDelete(programme)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-results">No programmes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Edit Programme</h2>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Programme Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        if (editError) setEditError('');
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => {
                        setEditStatus(e.target.value);
                        if (editError) setEditError('');
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  {editError && (
                    <p className="modal-error" role="alert">
                      {editError}
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProgramme(null);
                      setEditError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSaveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {programmeToDelete && (
            <div className="modal-overlay">
              <div className="modal archive-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                <h2 id="delete-modal-title">Delete Programme?</h2>
                <div className="modal-content">
                  <p className="archive-confirmation-question">Are you sure you want to delete <strong>{programmeToDelete.name}</strong>?</p>
                  <p className="archive-modal-warning delete-modal-warning">This action cannot be reversed.</p>
                </div>
                <div className="modal-actions">
                  <button className="archive-modal-cancel" onClick={() => setProgrammeToDelete(null)}>
                    Cancel
                  </button>
                  <button className="delete-modal-confirm" onClick={handleDeleteProgramme}>
                    Delete Programme
                  </button>
                </div>
              </div>
            </div>
          )}

          {programmeToArchive && (
            <div className="modal-overlay">
              <div className="modal archive-confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="archive-modal-title">
                <h2 id="archive-modal-title">Archive Programme?</h2>
                <div className="modal-content">
                  <p className="archive-confirmation-question">Are you sure you want to archive <strong>{programmeToArchive.name}</strong>?</p>
                  <p className="archive-modal-warning">This action will move the programme to the archived list.</p>
                </div>
                <div className="modal-actions">
                  <button className="archive-modal-cancel" onClick={() => setProgrammeToArchive(null)}>
                    Cancel
                  </button>
                  <button className="archive-modal-confirm" onClick={() => handleArchive(programmeToArchive.id)}>
                    Archive Programme
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="popia-notice">
            <p><strong>POPIA Compliance Notice:</strong> Under South African Protection of Personal Information Act rules, this database is restricted to authorized credentials management. Deactivation obscures public-facing records immediately.</p>
          </div>
        </main>
      </div>

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

export default AdminProgrammes;