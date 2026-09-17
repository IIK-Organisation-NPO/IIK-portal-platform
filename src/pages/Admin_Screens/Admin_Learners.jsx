// src/pages/Admin_Screens/Admin_Learners.jsx
<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from "react";
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
>>>>>>> c5d32a3dd518092c21dfda9b3cbb92617a3ec011
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

  // Edit state - using ID instead of index
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

<<<<<<< HEAD
  const [stats, setStats] = useState([
    { label: "Total Learners", value: 0 },
    { label: "Active Enrolments", value: 0 },
    { label: "Completed Programmes", value: 0 },
=======
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Sample learner data
  const [learners, setLearners] = useState([
    {
      name: "Sibusiso Ndlovu",
      email: "sibundlo.",
      phone: "+27 82 456 7890",
      programme: "Digital Marketing",
      date: "Jan 12, 2026",
      status: "Active",
    },
    {
      name: "Chanel Fourie",
      email: "chanelf.",
      phone: "+27 71 890 1234",
      programme: "Digital Literacy",
      date: "Jan 15, 2026",
      status: "Completed",
    },
    {
      name: "Lindlwe Khumalo",
      email: "lindluh.",
      phone: "+27 83 234 5678",
      programme: "Microsoft 365",
      date: "Feb 02, 2026",
      status: "Active",
    },
    {
      name: "David Botha",
      email: "davidbot.",
      phone: "+27 82 789 0123",
      programme: "Digital Marketing",
      date: "Feb 10, 2026",
      status: "Inactive",
    },
    {
      name: "Fatima Patel",
      email: "fatima.p.",
      phone: "+27 61 345 6789",
      programme: "Digital Literacy",
      date: "Feb 14, 2026",
      status: "Active",
    },
    {
      name: "Thabo Mokoena",
      email: "thabom.",
      phone: "+27 73 901 2345",
      programme: "Microsoft 365",
      date: "Feb 22, 2026",
      status: "Completed",
    },
    {
      name: "Zanele Disarmi",
      email: "zanele.d.",
      phone: "+27 82 567 8901",
      programme: "Digital Marketing",
      date: "Mar 01, 2026",
      status: "Active",
    },
    {
      name: "Johan Smuts",
      email: "johanam.",
      phone: "+27 79 123 4567",
      programme: "Digital Literacy",
      date: "Mar 05, 2026",
      status: "Active",
    },
>>>>>>> c5d32a3dd518092c21dfda9b3cbb92617a3ec011
  ]);

  // Status options
  const statusOptions = [
    { value: "", label: "Status: All" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Completed", label: "Completed" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ============================================
  // PLURALIZATION HELPER
  // ============================================
  const pluralize = (count, singular, plural) => {
    return count === 1 ? singular : plural;
  };

<<<<<<< HEAD
  // ============================================
  // FETCH PROGRAMMES FROM DATABASE
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
  // FETCH STATS (UPDATED)
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
  // UPDATE LEARNER IN DATABASE
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
        alert(' Learner updated successfully!');
        return true;
      } else {
        alert(' ' + (response.data.message || 'Failed to update learner'));
        return false;
      }
    } catch (err) {
      console.error('Error updating learner:', err);
      alert('' + (err.response?.data?.message || 'Failed to update learner'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  //  DEACTIVATE LEARNER IN DATABASE
  // ============================================
  const deactivateLearner = async (id) => {
    try {
      const response = await api.put(`/admin/learners/${id}`, { status: 'Inactive' });
      
      if (response.data.success) {
        await fetchLearners();
        await fetchStats();
        setDeactivatingId(null);
        setDeactivateTarget(null);
        setShowDeactivateModal(false);
        alert(' Learner deactivated successfully!');
        return true;
      } else {
        alert(' ' + (response.data.message || 'Failed to deactivate learner'));
        return false;
      }
    } catch (err) {
      console.error('Error deactivating learner:', err);
      alert(' ' + (err.response?.data?.message || 'Failed to deactivate learner'));
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

  // ============================================
  // HANDLE FILTER CHANGES
  // ============================================
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProgrammeChange = (e) => {
    setSelectedProgramme(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

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
  // LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchStats();
    fetchProgrammes();
    fetchLearners();
  }, []);

  // ============================================
  // APPLY FILTERS WHEN DEPENDENCIES CHANGE
  // ============================================
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
=======
  const filteredLearners = learners.filter((learner) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch ||
      learner.name.toLowerCase().includes(normalizedSearch) ||
      learner.email.toLowerCase().includes(normalizedSearch);
    const matchesProgramme = selectedProgramme === 'All' || learner.programme === selectedProgramme;
    const matchesStatus = selectedStatus === 'All' || learner.status === selectedStatus;

    return matchesSearch && matchesProgramme && matchesStatus;
  });

  // Handle Edit button click - enables editing mode for a specific row
  const handleEditClick = (index) => {
    setEditingIndex(index);
    // Pre-fill the edit form with current learner data
    setEditedLearner({
      name: learners[index].name,
      email: learners[index].email,
      phone: learners[index].phone
>>>>>>> c5d32a3dd518092c21dfda9b3cbb92617a3ec011
    });
  };

  // ============================================
  // GET STATUS CLASS
  // ============================================
  const getStatusClass = (status) => {
    if (!status) return 'inactive';
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'in progress' || statusLower === 'enrolled') return 'active';
    if (statusLower === 'completed') return 'completed';
    if (statusLower === 'inactive' || statusLower === 'withdrawn') return 'inactive';
    return 'inactive';
  };

  // ============================================
  // RENDER PAGINATION
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

  // Loading state
  if (loading && learners.length === 0) {
    return (
      <div className="admin-learners-layout">
        <Admin_Header
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="admin-learners-body">
          <Admin_Sidebar
            active={activeNav}
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
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
        <Admin_Header
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="admin-learners-body">
          <Admin_Sidebar
            active={activeNav}
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
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

  // ============================================
  // PROGRAMMES FROM DATABASE
  // ============================================
  const programmeOptions = programmes.map(p => p.Programme_name || p.name).filter(Boolean);

  // ============================================
  // HANDLE EDIT CLICK
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

  // ============================================
  // HANDLE CANCEL EDIT
  // ============================================
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedLearner({ id: '', name: '', surname: '', email: '', phone: '' });
  };

  // ============================================
  // HANDLE SAVE EDIT
  // ============================================
  const handleSaveEdit = async () => {
    if (!editedLearner.name.trim()) {
      alert(' Please enter a name');
      return;
    }
    if (!editedLearner.email.trim()) {
      alert(' Please enter an email');
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

  // ============================================
  // HANDLE INPUT CHANGE
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLearner({
      ...editedLearner,
      [name]: value
    });
  };

  // ============================================
  // HANDLE DEACTIVATE CLICK
  // ============================================
  const handleDeactivateClick = (learner) => {
    const learnerId = learner.id || learner.learner_id;
    setDeactivateTarget(learnerId);
    setShowDeactivateModal(true);
  };

  // ============================================
  // CONFIRM DEACTIVATE
  // ============================================
  const confirmDeactivate = async () => {
    if (deactivateTarget) {
      setDeactivatingId(deactivateTarget);
      await deactivateLearner(deactivateTarget);
    }
  };

  // ============================================
  // CANCEL DEACTIVATE
  // ============================================
  const cancelDeactivate = () => {
    setShowDeactivateModal(false);
    setDeactivateTarget(null);
  };

  return (
    <div className="admin-learners-layout">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="admin-learners-body">
        <Admin_Sidebar
          active={activeNav}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <div className="admin-learners-content">
          {/* Page Header */}
          <div className="admin-learners-header">
            <h1>Learner Management</h1>
            <p>
              Manage corporate professionals, track enrolment progression, and
              monitor profile accessibility.
            </p>
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
              <button
                className="btn-solid"
                onClick={() => navigate("/admin/interested-learners")}
              >
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
<<<<<<< HEAD
              <select 
                className="filter-select" 
                value={selectedProgramme} 
                onChange={handleProgrammeChange}
              >
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
              <select 
                className="filter-select" 
                value={selectedStatus} 
                onChange={handleStatusChange}
              >
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
=======
              <div className="toolbar-filters">
                <select
                  className="filter-select"
                  value={selectedProgramme}
                  onChange={(event) => setSelectedProgramme(event.target.value)}
                  aria-label="Filter learners by programme"
                >
                  <option value="All">Prog: All</option>
                  <option>Digital Literacy</option>
                  <option>Microsoft 365</option>
                  <option>Digital Marketing</option>
                </select>
                <select
                  className="filter-select"
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  aria-label="Filter learners by status"
                >
                  <option value="All">Status: All</option>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Inactive</option>
                </select>
                <input
                  type="text"
                  placeholder="Search name or email..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search learners by name or email"
                />
              </div>
>>>>>>> c5d32a3dd518092c21dfda9b3cbb92617a3ec011
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
<<<<<<< HEAD
                {currentItems.map((learner) => {
                  const learnerId = learner.id || learner.learner_id;
                  const isEditing = editingId === learnerId;
                  const isDeactivating = deactivatingId === learnerId;
                  
                  return (
                    <tr 
                      key={learnerId} 
                      className={isDeactivating ? "deactivating-row" : ""}
                    >
                      {/* NAME column - editable */}
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
                      
                      {/* EMAIL column - editable */}
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
                      
                      {/* PHONE column - editable */}
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
                      
                      {/* PROGRAMME - display only */}
                      <td>{learner.programme_name || learner.Programme_name || learner.programme || 'N/A'}</td>
                      
                      {/* ENROLMENT DATE - display only */}
                      <td>{formatDate(learner.enrolment_date || learner.date || learner.created_at)}</td>
                      
                      {/* STATUS - display only */}
                      <td>
                        <span className={`status-badge ${getStatusClass(learner.status)}`}>
                          {learner.status || 'Inactive'}
                        </span>
                      </td>
                      
                      {/* ACTIONS column */}
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
                              disabled={isDeactivating}
                            >
                              {isDeactivating ? "Deactivating..." : "Deactivate"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
=======
                {filteredLearners.map((learner) => {
                  const learnerIndex = learners.indexOf(learner);

                  return (
                  <tr 
                    key={learnerIndex} 
                    className={deactivatingIndex === learnerIndex ? "deactivating-row" : ""}
                  >
                    <td>{learner.name}</td>
                    <td>{learner.email}</td>
                    <td>{learner.phone}</td>
                    
                    <td>{learner.programme}</td>
                    <td>{learner.date}</td>
                    <td>
                      <span
                        className={`status-badge ${learner.status.toLowerCase()}`}
                      >
                        {learner.status}
                      </span>
                    </td>
                    
                    <td>
                      <button 
                        className="action-btn edit" 
                        onClick={() => handleEditClick(learnerIndex)}
                      >
                        Edit
                      </button>
                      <button 
                        className="action-btn deactivate" 
                        onClick={() => handleDeactivateClick(learnerIndex)}
                        disabled={deactivatingIndex === learnerIndex}
                      >
                        {deactivatingIndex === learnerIndex ? "Deactivating..." : "Deactivate"}
                      </button>
                    </td>
                  </tr>
                  );
                })}
                {filteredLearners.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-results">No learners match your search or filters.</td>
                  </tr>
                )}
>>>>>>> c5d32a3dd518092c21dfda9b3cbb92617a3ec011
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {editingIndex !== null && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content learner-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="learner-edit-modal-header">
              <h2>Edit Learner</h2>
              <button type="button" className="learner-modal-close" onClick={handleCancelEdit} aria-label="Close">&times;</button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); handleSaveEdit(editingIndex); }}>
              <div className="learner-edit-form">
                <label>
                  Name
                  <input type="text" name="name" value={editedLearner.name} onChange={handleInputChange} required />
                </label>
                <label>
                  Email
                  <input type="email" name="email" value={editedLearner.email} onChange={handleInputChange} required />
                </label>
                <label>
                  Phone Number
                  <input type="text" name="phone" value={editedLearner.phone} onChange={handleInputChange} required />
                </label>
              </div>
              <div className="learner-edit-modal-actions">
                <button type="button" className="learner-modal-cancel" onClick={handleCancelEdit}>Cancel</button>
                <button type="submit" className="learner-modal-save">Save Learner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <h2>Confirm Deactivation</h2>
<<<<<<< HEAD
            <p>Are you sure you want to deactivate this student?</p>
            <p className="modal-warning">
              This action will change the student's status to "Inactive" in the database.
=======
            <p className="confirmation-message confirmation-question">Are you sure you want to deactivate this student?</p>
            <p className="modal-warning confirmation-message">
              This action will change the student's status to "Inactive" and remove them from the list after 3 seconds.
>>>>>>> c5d32a3dd518092c21dfda9b3cbb92617a3ec011
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelDeactivate}>
                Cancel
              </button>
              <button className="modal-btn confirm-btn" onClick={confirmDeactivate}>
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Learners;