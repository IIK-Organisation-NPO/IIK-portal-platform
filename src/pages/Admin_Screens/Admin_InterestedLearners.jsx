// src/pages/Admin_Screens/Admin_InterestedLearners.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import EmailComposerModal from './EmailComposerModal';
import '../../styles/Admin/Admin_InterestedLearners.css';
import api from '../../services/api';

const Admin_InterestedLearners = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav] = useState('learners');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('All');

  // Modal state for email composer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState([]);

  // Enrollment confirmation modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [interestedLearners, setInterestedLearners] = useState([]);
  const [filteredLearners, setFilteredLearners] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [centres, setCentres] = useState(['All']);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    enrolled: 0
  });

  // Status options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Enrolled', label: 'Enrolled' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ============================================
  // ✅ PLURALIZATION HELPER
  // ============================================
  const pluralize = (count, singular, plural) => {
    return count === 1 ? singular : plural;
  };

  // ============================================
  // ✅ FORMAT DATE
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

  // ============================================
  // GET STATUS CLASS
  // ============================================
  const getStatusClass = (status) => {
    if (!status) return 'status-new';
    const statusLower = status.toLowerCase();
    if (statusLower === 'new') return 'status-new';
    if (statusLower === 'contacted') return 'status-contacted';
    if (statusLower === 'enrolled') return 'status-enrolled';
    return 'status-new';
  };

  // ============================================
  // FETCH PROGRAMMES FROM DATABASE
  // ============================================
  const fetchProgrammes = async () => {
    try {
      const response = await api.get('/admin/programmes');
      if (response.data.success) {
        setProgrammes(response.data.data || []);
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
  // FETCH INTERESTED LEARNERS
  // ============================================
  const fetchInterestedLearners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/interested-learners?limit=1000');
      
      if (response.data.success) {
        const data = response.data.data || [];
        console.log('Interested learners:', data);
        
        setInterestedLearners(data);
        setFilteredLearners(data);
        
        const newCount = data.filter(l => l.status === 'New' || l.status === 'new').length;
        const contactedCount = data.filter(l => l.status === 'Contacted' || l.status === 'contacted').length;
        const enrolledCount = data.filter(l => l.status === 'Enrolled' || l.status === 'enrolled').length;
        
        setStats({
          total: data.length,
          new: newCount,
          contacted: contactedCount,
          enrolled: enrolledCount
        });

        const centreSet = new Set();
        data.forEach(l => {
          if (l.centre || l.center) {
            centreSet.add(l.centre || l.center);
          }
        });
        setCentres(['All', ...Array.from(centreSet)]);
      }
    } catch (err) {
      console.error('Error fetching interested learners:', err);
      setError(err.response?.data?.message || 'Failed to load interested learners');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  //  UPDATE LEARNER STATUS - FIXED
  // ============================================
  const updateLearnerStatus = async (interestId, newStatus) => {
    try {
      console.log(` Updating learner ${interestId} to status: ${newStatus}`);
      
      const response = await api.put(`/admin/interested-learners/${interestId}`, {
        status: newStatus
      });

      if (response.data.success) {
        await fetchInterestedLearners();
        console.log(`Status updated to ${newStatus}`);
        return true;
      } else {
        console.error(' Failed to update status:', response.data.message);
        alert('Failed to update status: ' + response.data.message);
        return false;
      }
    } catch (err) {
      console.error(' Error updating status:', err);
      alert('Failed to update status. Please try again.');
      return false;
    }
  };

  // ============================================
  // APPLY FILTERS
  // ============================================
  const applyFilters = useCallback(() => {
    let filtered = [...interestedLearners];

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
        const prog = learner.programme_name || learner.Programme_name || learner.programme;
        return prog === selectedProgramme;
      });
    }

    if (selectedCentre && selectedCentre !== 'All') {
      filtered = filtered.filter(learner => {
        const centre = learner.centre || learner.center || learner.digital_centre;
        return centre === selectedCentre;
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter(learner => {
        const status = learner.status || learner.interest_status || 'New';
        return status.toLowerCase() === selectedStatus.toLowerCase();
      });
    }

    setFilteredLearners(filtered);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  }, [interestedLearners, searchTerm, selectedProgramme, selectedCentre, selectedStatus]);

  // ============================================
  // ✅ HANDLE FILTER CHANGES
  // ============================================
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProgrammeChange = (e) => {
    setSelectedProgramme(e.target.value);
  };

  const handleCentreChange = (e) => {
    setSelectedCentre(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProgramme("");
    setSelectedCentre("All");
    setSelectedStatus("");
    setFilteredLearners(interestedLearners);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  };

  // ============================================
  //  FILTER STATS BUTTONS
  // ============================================
  const filterTotal = () => {
    setSelectedProgramme("");
    setSelectedCentre("All");
    setSelectedStatus("");
    setSearchTerm("");
    setFilteredLearners(interestedLearners);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  };

  const filterNew = () => {
    setSelectedStatus("New");
    setSelectedProgramme("");
    setSelectedCentre("All");
    setSearchTerm("");
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  };

  // ============================================
  // HANDLE SELECT ALL
  // ============================================
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      const allIds = filteredLearners.map(l => l.interest_id || l.id);
      setSelectedIds(allIds);
    }
    setSelectAll(!selectAll);
  };

  // ============================================
  // HANDLE SELECT ONE
  // ============================================
  const handleSelectOne = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // ============================================
  // OPEN MODAL FOR SELECTED
  // ============================================
  const openModalForSelected = () => {
    const selected = filteredLearners.filter(l => {
      const id = l.interest_id || l.id;
      return selectedIds.includes(id);
    });
    
    if (selected.length === 0) {
      alert("Please select at least one learner.");
      return;
    }
    
    setSelectedLearners(selected.map(l => ({
      id: l.interest_id || l.id || l.User_id,
      email: l.email,
      name: l.name || l.learner_name,
      surname: l.surname || ''
    })));
    setIsModalOpen(true);
  };

  // ============================================
  // OPEN MODAL FOR ONE
  // ============================================
  const openModalForOne = (learner) => {
    setSelectedLearners([{
      id: learner.interest_id || learner.id || learner.User_id,
      email: learner.email,
      name: learner.name || learner.learner_name,
      surname: learner.surname || ''
    }]);
    setIsModalOpen(true);
  };

  // ============================================
  // HANDLE ENROLL CLICK
  // ============================================
  const handleEnrollClick = (learnerId) => {
    setEnrollTarget(learnerId);
    setShowEnrollModal(true);
  };

  // ============================================
  // CONFIRM ENROLL - UPDATED to use API
  // ============================================
  const confirmEnroll = async () => {
    if (enrollTarget !== null) {
      const success = await updateLearnerStatus(enrollTarget, 'Enrolled');
      if (success) {
        setShowEnrollModal(false);
        setEnrollTarget(null);
        alert('Learner successfully enrolled!');
      }
    }
  };

  // ============================================
  // CANCEL ENROLL
  // ============================================
  const cancelEnroll = () => {
    setShowEnrollModal(false);
    setEnrollTarget(null);
  };

  // ============================================
  // EXPORT TO CSV
  // ============================================
  const exportToCSV = () => {
    const dataToExport = selectedIds.length > 0 
      ? filteredLearners.filter(l => selectedIds.includes(l.interest_id || l.id))
      : filteredLearners;

    if (dataToExport.length === 0) {
      alert("No learners to export!");
      return;
    }

    const headers = [
      "Name",
      "Surname",
      "Email",
      "Phone",
      "Programme",
      "Centre",
      "Status",
      "Interest Date"
    ];

    const rows = dataToExport.map(learner => [
      learner.name || "",
      learner.surname || "",
      learner.email || "",
      learner.phone_number || learner.phone || "",
      learner.programme_name || learner.Programme_name || "",
      learner.centre || learner.center || "",
      learner.status || learner.interest_status || "New",
      formatDate(learner.interest_date || learner.register_at || learner.date || new Date())
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `interested_learners_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="admin-interested-pagination">
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
  // LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchProgrammes();
    fetchInterestedLearners();
  }, []);

  // ============================================
  // APPLY FILTERS WHEN DEPENDENCIES CHANGE
  // ============================================
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ============================================
  // PROGRAMMES FROM DATABASE
  // ============================================
  const programmeOptions = programmes.map(p => p.Programme_name || p.name).filter(Boolean);

  // ============================================
  // CENTRES FROM DATA
  // ============================================
  const centreOptions = centres.length > 0 ? centres : ['All'];

  // Loading state
  if (loading && interestedLearners.length === 0) {
    return (
      <div className="admin-interested-layout">
        <Admin_Header
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="admin-interested-body">
          <Admin_Sidebar
            active={activeNav}
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
          <div className="admin-interested-content">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p>Loading interested learners...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-interested-layout">
        <Admin_Header
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="admin-interested-body">
          <Admin_Sidebar
            active={activeNav}
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
          <div className="admin-interested-content">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <h3 style={{ color: '#dc3545' }}>Error: {error}</h3>
              <button 
                onClick={fetchInterestedLearners}
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

  return (
    <div className="admin-interested-layout">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="admin-interested-body">
        <Admin_Sidebar
          active={activeNav}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <div className="admin-interested-content">
          {/* TOP ROW */}
          <div className="admin-interested-top-row">
            <div className="header-left-group">
              <h1>
                Interested Learners —{' '}
                <select
                  className="programme-dropdown"
                  value={selectedProgramme}
                  onChange={handleProgrammeChange}
                >
                  <option value="">All Programmes</option>
                  {programmeOptions.map((prog, index) => (
                    <option key={index} value={prog}>{prog}</option>
                  ))}
                </select>
              </h1>
              <p>Pipeline of learners expressing interest.</p>
            </div>

            <div className="header-stats-group">
              <button
                className={`stat-filter-btn stat-total ${!selectedProgramme && !selectedCentre && !selectedStatus && !searchTerm ? 'active' : ''}`}
                onClick={filterTotal}
              >
                {stats.total} Total Interested
              </button>
              <button 
                className={`stat-filter-btn stat-new ${selectedStatus === 'New' ? 'active' : ''}`}
                onClick={filterNew}
              >
                {stats.new} New (Last 30 Days)
              </button>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="admin-interested-toolbar">
            <div className="toolbar-left">
              <button className="btn-outline" onClick={exportToCSV}>Export to CSV</button>
              <button 
                className="btn-outline btn-contact-selected" 
                onClick={openModalForSelected}
              >
                Send Bulk Email ({selectedIds.length})
              </button>
            </div>
            <div className="toolbar-right">
              <div className="toolbar-filters">
                <select
                  className="filter-select"
                  value={selectedStatus}
                  onChange={handleStatusChange}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={selectedCentre}
                  onChange={handleCentreChange}
                >
                  {centreOptions.map((centre) => (
                    <option key={centre} value={centre}>
                      Digital Centre: {centre}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div style={{ 
            padding: '10px 0', 
            fontSize: '14px', 
            color: '#666',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span>
              Showing {filteredLearners.length} {pluralize(filteredLearners.length, 'learner', 'learners')}
              {selectedProgramme && ` in "${selectedProgramme}"`}
              {selectedStatus && ` with status "${selectedStatus}"`}
              {selectedCentre && selectedCentre !== 'All' && ` at "${selectedCentre}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            {selectedIds.length > 0 && (
              <span style={{ fontWeight: '500', color: '#1E429F' }}>
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* TABLE */}
          <div className="admin-interested-table-wrapper">
            <table className="admin-interested-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredLearners.length &&
                        filteredLearners.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>PROGRAMME</th>
                  <th>DIGITAL CENTER</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((learner) => {
                  const learnerId = learner.interest_id || learner.id;
                  return (
                    <tr key={learnerId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(learnerId)}
                          onChange={() => handleSelectOne(learnerId)}
                        />
                      </td>
                      <td>{learner.name || learner.first_name} {learner.surname || learner.last_name}</td>
                      <td>{learner.email}</td>
                      <td>{learner.phone || learner.phone_number}</td>
                      <td>{learner.programme_name || learner.Programme_name || learner.programme}</td>
                      <td>{learner.centre || learner.center || learner.digital_centre}</td>
                      <td>{formatDate(learner.interest_date || learner.register_at || learner.date)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(learner.status || learner.interest_status)}`}>
                          {learner.status || learner.interest_status || 'New'}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button 
                          className="action-btn contact" 
                          onClick={() => openModalForOne(learner)}
                        >
                          Contact
                        </button>
                        <button
                          className="action-btn enroll"
                          onClick={() => handleEnrollClick(learnerId)}
                          disabled={learner.status === 'Enrolled' || learner.status === 'enrolled'}
                          style={{
                            opacity: learner.status === 'Enrolled' || learner.status === 'enrolled' ? 0.5 : 1,
                            cursor: learner.status === 'Enrolled' || learner.status === 'enrolled' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {learner.status === 'Enrolled' || learner.status === 'enrolled' ? '✓ Enrolled' : 'Enroll'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {renderPagination()}
        </div>
      </div>

      {/* ===== EMAIL COMPOSER MODAL ===== */}
      <EmailComposerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLearners([]);
        }}
        learners={selectedLearners}
        onSuccess={(result) => {
          console.log('Emails sent successfully:', result);
          // After emails are sent, update status of selected learners to "Contacted"
          const updateStatuses = async () => {
            for (const learner of selectedLearners) {
              await updateLearnerStatus(learner.id, 'Contacted');
            }
            fetchInterestedLearners();
          };
          updateStatuses();
        }}
      />

      {/* ===== ENROLLMENT CONFIRMATION MODAL ===== */}
      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Enrollment</h2>
            <p>Are you sure you want to Enroll this student?</p>
            <p className="modal-warning">
              This action will change the student's status to "Enrolled".
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelEnroll}>
                Cancel
              </button>
              <button className="modal-btn confirm-btn" onClick={confirmEnroll}>
                Yes, Enroll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_InterestedLearners;