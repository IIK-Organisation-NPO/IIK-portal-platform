// src/pages/Admin_Screens/Admin_Learners.jsx
import React, { useState, useEffect, useCallback } from "react";
import Admin_Sidebar from "../../components/Admin/Admin_Sidebar";
import Admin_Header from "../../components/Admin/Admin_Header";
import "../../styles/Admin/Admin_Learners.css";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Admin_Learners = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav] = useState("learners");
  const [learners, setLearners] = useState([]);
  const [filteredLearners, setFilteredLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programmes, setProgrammes] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Edit state — keyed by learner id
  const [editingId, setEditingId] = useState(null);
  const [editedLearner, setEditedLearner] = useState({
    id: '',
    name: '',
    surname: '',
    email: '',
    phone: ''
  });

  const [deactivatingId, setDeactivatingId] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [stats, setStats] = useState([
    { label: "Total Learners", value: 0 },
    { label: "Active Enrolments", value: 0 },
    { label: "Completed Programmes", value: 0 },
  ]);

  const statusOptions = [
    { value: "", label: "Status: All" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Completed", label: "Completed" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const pluralize = (count, singular, plural) => (count === 1 ? singular : plural);

  // ============================================
  // FETCH PROGRAMMES
  // ============================================
  const fetchProgrammes = async () => {
    try {
      const response = await api.get('/admin/programmes');
      if (response.data.success) {
        console.log('📚 Programmes fetched:', response.data.data);
        setProgrammes(response.data.data || []);
      } else {
        setProgrammes([
          { Programme_name: 'Digital Literacy' },
          { Programme_name: 'Microsoft 365' },
          { Programme_name: 'Digital Marketing' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching programmes:', err);
      setProgrammes([
        { Programme_name: 'Digital Literacy' },
        { Programme_name: 'Microsoft 365' },
        { Programme_name: 'Digital Marketing' },
      ]);
    }
  };

  // ============================================
  // FETCH STATS
  // ============================================
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      console.log('Stats response:', response.data);

      if (response.data.success) {
        const data = response.data.data;
        const activeEnrolments = data.activeEnrolments || data.enrolledEnrollments || 0;

        setStats([
          { label: "Total Learners", value: data.totalLearners || 0 },
          { label: "Active Enrolments", value: activeEnrolments },
          { label: "Completed Programmes", value: data.completedEnrollments || 0 },
        ]);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // ============================================
  // FETCH LEARNERS
  // ============================================
  const fetchLearners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/learners?limit=1000');

      if (response.data.success) {
        const data = response.data.data || [];
        setLearners(data);
        setFilteredLearners(data);
      }
    } catch (err) {
      console.error('Error fetching learners:', err);
      setError(err.response?.data?.message || 'Failed to load learners');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UPDATE LEARNER
  // ============================================
  const updateLearner = async (id, updatedData) => {
    try {
      setIsSaving(true);
      const response = await api.put(`/admin/learners/${id}`, updatedData);

      if (response.data.success) {
        await fetchLearners();
        await fetchStats();
        setEditingId(null);
        setEditedLearner({ id: '', name: '', surname: '', email: '', phone: '' });
        alert('Learner updated successfully!');
        return true;
      } else {
        alert(response.data.message || 'Failed to update learner');
        return false;
      }
    } catch (err) {
      console.error('Error updating learner:', err);
      alert(err.response?.data?.message || 'Failed to update learner');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // DEACTIVATE LEARNER
  // Updates the backend, then marks the row Inactive locally.
  // The Programme and Enrolment Date cells will render N/A for
  // inactive learners (guarded in the JSX below), so no refetch
  // is required — which also avoids the 500s the refetch was hitting.
  // ============================================
  const deactivateLearner = async (id) => {
    try {
      const response = await api.put(`/admin/learners/${id}`, { status: 'Inactive' });

      if (response.data.success) {
        // Optimistic local update so the row reflects the change immediately
        const patch = (l) =>
          l.id === id
            ? {
                ...l,
                status: 'Inactive',
                programme_name: null,
                Programme_name: null,
                programme: null,
                enrolment_date: null,
              }
            : l;

        setLearners(prev => prev.map(patch));
        setFilteredLearners(prev => prev.map(patch));

        setDeactivatingId(null);
        setDeactivateTarget(null);
        setShowDeactivateModal(false);
        alert('Learner deactivated successfully!');
        return true;
      } else {
        alert(response.data.message || 'Failed to deactivate learner');
        return false;
      }
    } catch (err) {
      console.error('Error deactivating learner:', err);
      alert(
        err.response?.data?.message ||
          'Failed to deactivate learner'
      );
      return false;
    }
  };

  // ============================================
  // APPLY FILTERS
  // ============================================
  const applyFilters = useCallback(() => {
    let filtered = [...learners];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(learner =>
        learner.name?.toLowerCase().includes(term) ||
        learner.surname?.toLowerCase().includes(term) ||
        learner.email?.toLowerCase().includes(term) ||
        `${learner.name} ${learner.surname}`.toLowerCase().includes(term)
      );
    }

    if (selectedProgramme) {
      filtered = filtered.filter(learner => {
        const learnerProgramme = learner.programme_name || learner.Programme_name || learner.programme || '';
        return learnerProgramme === selectedProgramme;
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter(learner => {
        const status = learner.status || (learner.isVerified ? 'Active' : 'Inactive');
        return status === selectedStatus;
      });
    }

    setFilteredLearners(filtered);
    setCurrentPage(1);
  }, [learners, searchTerm, selectedProgramme, selectedStatus]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleProgrammeChange = (e) => setSelectedProgramme(e.target.value);
  const handleStatusChange = (e) => setSelectedStatus(e.target.value);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProgramme("");
    setSelectedStatus("");
    setFilteredLearners(learners);
    setCurrentPage(1);
  };

  // ============================================
  // PAGINATION
  // ============================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLearners.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // ============================================
  // LOAD ON MOUNT
  // ============================================
  useEffect(() => {
    fetchStats();
    fetchProgrammes();
    fetchLearners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ============================================
  // HELPERS
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    if (!status) return 'inactive';
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'in progress' || statusLower === 'enrolled') return 'active';
    if (statusLower === 'completed') return 'completed';
    if (statusLower === 'inactive' || statusLower === 'withdrawn') return 'inactive';
    return 'inactive';
  };

  // ============================================
  // PAGINATION RENDER
  // ============================================
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="admin-learners-pagination">
        <button
          className="pagination-btn prev"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span className="pagination-numbers">
          {startPage > 1 && (
            <>
              <button className="pagination-num" onClick={() => paginate(1)}>1</button>
              {startPage > 2 && <span className="pagination-dots">…</span>}
            </>
          )}
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`pagination-num ${currentPage === number ? 'active' : ''}`}
              onClick={() => paginate(number)}
            >
              {number}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="pagination-dots">…</span>}
              <button className="pagination-num" onClick={() => paginate(totalPages)}>
                {totalPages}
              </button>
            </>
          )}
        </span>
        <button
          className="pagination-btn next"
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  // ============================================
  // EDIT HANDLERS
  // ============================================
  const handleEditClick = (learner) => {
    const learnerId = learner.id || learner.learner_id;
    setEditingId(learnerId);
    setEditedLearner({
      id: learnerId,
      name: learner.name || '',
      surname: learner.surname || '',
      email: learner.email || '',
      phone: learner.phone || learner.phone_number || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedLearner({ id: '', name: '', surname: '', email: '', phone: '' });
  };

  const handleSaveEdit = async () => {
    if (!editedLearner.name.trim()) {
      alert('Please enter a name');
      return;
    }
    if (!editedLearner.email.trim()) {
      alert('Please enter an email');
      return;
    }

    const updatedData = {
      name: editedLearner.name,
      surname: editedLearner.surname,
      email: editedLearner.email,
      phone: editedLearner.phone
    };

    await updateLearner(editedLearner.id, updatedData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLearner({
      ...editedLearner,
      [name]: value
    });
  };

  // ============================================
  // DEACTIVATE HANDLERS
  // ============================================
  const handleDeactivateClick = (learner) => {
    const learnerId = learner.id || learner.learner_id;
    setDeactivateTarget(learnerId);
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    if (deactivateTarget) {
      setDeactivatingId(deactivateTarget);
      await deactivateLearner(deactivateTarget);
    }
  };

  const cancelDeactivate = () => {
    setShowDeactivateModal(false);
    setDeactivateTarget(null);
  };

  // Loading state
  if (loading && learners.length === 0) {
    return (
      <div className="admin-learners-layout">
        <Admin_Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="admin-learners-body">
          <Admin_Sidebar active={activeNav} isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
          <div className="admin-learners-content">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p>Loading learners...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-learners-layout">
        <Admin_Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="admin-learners-body">
          <Admin_Sidebar active={activeNav} isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
          <div className="admin-learners-content">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <h3 style={{ color: '#dc3545' }}>Error: {error}</h3>
              <button
                onClick={fetchLearners}
                style={{
                  marginTop: '20px',
                  padding: '10px 30px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const programmeOptions = programmes.map(p => p.Programme_name || p.name).filter(Boolean);

  return (
    <div className="admin-learners-layout">
      <Admin_Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />

      <div className="admin-learners-body">
        <Admin_Sidebar active={activeNav} isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

        <div className="admin-learners-content">
          {/* Page Header */}
          <div className="admin-learners-header">
            <h1>Learner Management</h1>
            <p>Manage corporate professionals, track enrolment progression, and monitor profile accessibility.</p>
          </div>

          {/* Stats */}
          <div className="admin-learners-stats">
            {stats.map((stat, index) => (
              <div className="admin-learners-stat-card" key={index}>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Toolbar with Filters */}
          <div className="admin-learners-toolbar">
            <div className="toolbar-left">
              <button className="btn-outline">Export Records</button>
              <button className="btn-solid" onClick={() => navigate("/admin/interested-learners")}>
                Interested Learners
              </button>
              {filteredLearners.length !== learners.length && (
                <button
                  className="btn-clear-filters"
                  onClick={clearFilters}
                  style={{
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#dc3545',
                    fontSize: '13px'
                  }}
                >
                  Clear Filters ✕
                </button>
              )}
            </div>
            <div className="toolbar-right">
              <select className="filter-select" value={selectedProgramme} onChange={handleProgrammeChange}>
                <option value="">Prog: All</option>
                {programmeOptions.length > 0 ? (
                  programmeOptions.map((prog, index) => (
                    <option key={index} value={prog}>{prog}</option>
                  ))
                ) : (
                  <>
                    <option value="Digital Literacy">Digital Literacy</option>
                    <option value="Microsoft 365">Microsoft 365</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                  </>
                )}
              </select>
              <select className="filter-select" value={selectedStatus} onChange={handleStatusChange}>
                {statusOptions.map((status, index) => (
                  <option key={index} value={status.value}>{status.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search name or email..."
                className="search-input"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Results Count */}
          <div style={{
            padding: '10px 0',
            fontSize: '14px',
            color: '#666',
            borderBottom: '1px solid #eee'
          }}>
            Showing {filteredLearners.length} {pluralize(filteredLearners.length, 'learner', 'learners')}
            {selectedProgramme && ` in "${selectedProgramme}"`}
            {selectedStatus && ` with status "${selectedStatus}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>

          {/* Table */}
          <div className="admin-learners-table-wrapper">
            <table className="admin-learners-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>PROGRAMME</th>
                  <th>ENROLMENT DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((learner) => {
                  const learnerId = learner.id || learner.learner_id;
                  const isEditing = editingId === learnerId;
                  const isDeactivating = deactivatingId === learnerId;
                  const isInactive = learner.status === 'Inactive';

                  return (
                    <tr key={learnerId} className={isDeactivating ? "deactivating-row" : ""}>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editedLearner.name}
                            onChange={handleInputChange}
                            className="edit-input"
                            placeholder="Enter name"
                          />
                        ) : (
                          `${learner.name || ''} ${learner.surname || ''}`.trim() || 'N/A'
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={editedLearner.email}
                            onChange={handleInputChange}
                            className="edit-input"
                            placeholder="Enter email"
                          />
                        ) : (
                          learner.email || 'N/A'
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            name="phone"
                            value={editedLearner.phone}
                            onChange={handleInputChange}
                            className="edit-input"
                            placeholder="Enter phone"
                          />
                        ) : (
                          learner.phone || learner.phone_number || 'N/A'
                        )}
                      </td>

                      {/* PROGRAMME — N/A for inactive learners */}
                      <td>
                        {isInactive
                          ? 'N/A'
                          : (learner.programme_name || learner.Programme_name || learner.programme || 'N/A')}
                      </td>

                      {/* ENROLMENT DATE — N/A for inactive learners */}
                      <td>
                        {isInactive
                          ? 'N/A'
                          : formatDate(learner.enrolment_date || learner.date || learner.created_at)}
                      </td>

                      <td>
                        <span className={`status-badge ${getStatusClass(learner.status)}`}>
                          {learner.status || 'Inactive'}
                        </span>
                      </td>

                      <td>
                        {isEditing ? (
                          <>
                            <button
                              className="action-btn save"
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="action-btn cancel"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="action-btn edit"
                              onClick={() => handleEditClick(learner)}
                              disabled={isDeactivating}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn deactivate"
                              onClick={() => handleDeactivateClick(learner)}
                              disabled={isDeactivating || isInactive}
                            >
                              {isDeactivating
                                ? "Deactivating..."
                                : isInactive
                                  ? 'Inactive'
                                  : 'Deactivate'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {renderPagination()}

          {/* POPIA Notice */}
          <div className="admin-learners-notice">
            <p>
              <strong>POPIA Compliance Notice:</strong> Under South African
              Protection of Personal Information Act rules, this database is
              restricted to authorised credentials management. Deactivation
              obscures public-facing records immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <h2>Confirm Deactivation</h2>
            <p className="confirmation-message confirmation-question">Are you sure you want to deactivate this student?</p>
            <p className="modal-warning confirmation-message">
              This action will change the student's status to "Inactive" and hide their enrolment details.
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelDeactivate}>Cancel</button>
              <button className="modal-btn confirm-btn" onClick={confirmDeactivate}>Yes, Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Learners;