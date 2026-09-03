// src/pages/Admin_Screens/Admin_InterestedLearners.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import EmailComposerModal from '../Admin_Screens/EmailComposerModal';
import '../../styles/Admin/Admin_InterestedLearners.css';

const Admin_InterestedLearners = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav] = useState('learners');
  const [selectedProgramme, setSelectedProgramme] = useState('Digital Marketing');
  const [selectedCentre, setSelectedCentre] = useState('All');

  // Modal state for email composer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState([]);

  // Enrollment confirmation modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null); // stores the learner ID

  // Learners data (we'll use state so we can update status)
  const [interestedLearners, setInterestedLearners] = useState([
    {
      id: 1,
      name: 'Sarah Khumalo',
      email: 'sarah@example.com',
      phone: '+27 82 123 4567',
      center: 'Harry Gwala Digital Centre',
      date: 'May 15, 2026',
      status: 'New',
    },
    {
      id: 2,
      name: 'Sipho Ndlovu',
      email: 'sipho@webmail.co.za',
      phone: '+27 71 456 7890',
      center: 'Amashubi Digital Centre',
      date: 'May 14, 2026',
      status: 'Contacted',
    },
    {
      id: 3,
      name: 'Lindiwe Dlamini',
      email: 'lindi@gmail.com',
      phone: '+27 83 987 6543',
      center: 'Umlazi Digital Centre',
      date: 'May 12, 2026',
      status: 'Enrolled',
    },
    {
      id: 4,
      name: 'Pieter Botha',
      email: 'pieter@vodamail.co.za',
      phone: '+27 72 345 6789',
      center: 'KwaMashu Digital Centre',
      date: 'May 10, 2026',
      status: 'New',
    },
    {
      id: 5,
      name: 'Amina Bester',
      email: 'amina.b@mweb.co.za',
      phone: '+27 84 567 8901',
      center: 'Richmond Digital Centre',
      date: 'May 08, 2026',
      status: 'Contacted',
    },
    {
      id: 6,
      name: 'Thabo Mokwena',
      email: 'thabo.m@outlook.com',
      phone: '+27 81 234 5678',
      center: 'Umzimkulu Digital Centre',
      date: 'May 05, 2026',
      status: 'New',
    },
  ]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  const centres = ['All', ...new Set(interestedLearners.map((l) => l.center))];
  const programmes = ['Digital Marketing', 'Digital Literacy', 'Microsoft 365'];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'status-new';
      case 'contacted':
        return 'status-contacted';
      case 'enrolled':
        return 'status-enrolled';
      default:
        return '';
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(interestedLearners.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open modal for selected learners (email)
  const openModalForSelected = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one learner.');
      return;
    }
    const selected = interestedLearners.filter((l) => selectedIds.includes(l.id));
    setSelectedLearners(selected);
    setIsModalOpen(true);
  };

  // Open modal for a single learner (email)
  const openModalForOne = (learner) => {
    setSelectedLearners([learner]);
    setIsModalOpen(true);
  };

  const filterTotal = () => {
    alert('Filter by all interested learners');
  };

  const filterNew = () => {
    alert('Filter by new learners (last 30 days)');
  };

  // ---- ENROLLMENT HANDLERS ----

  // Open confirmation modal for a specific learner
  const handleEnrollClick = (learnerId) => {
    setEnrollTarget(learnerId);
    setShowEnrollModal(true);
  };

  // Confirm enrollment – update the status
  const confirmEnroll = () => {
    if (enrollTarget !== null) {
      const updatedLearners = interestedLearners.map((learner) =>
        learner.id === enrollTarget
          ? { ...learner, status: 'Enrolled' }
          : learner
      );
      setInterestedLearners(updatedLearners);
      setShowEnrollModal(false);
      setEnrollTarget(null);
    }
  };

  const cancelEnroll = () => {
    setShowEnrollModal(false);
    setEnrollTarget(null);
  };

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
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                >
                  {programmes.map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
                </select>
                <span className="dropdown-arrow">▼</span>
              </h1>
              <p>Pipeline of learners expressing interest.</p>
            </div>

            <div className="header-stats-group">
              <button className="stat-filter-btn stat-total" onClick={filterTotal}>
                52 Total Interested
              </button>
              <button className="stat-filter-btn stat-new" onClick={filterNew}>
                18 New (Last 30 Days)
              </button>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="admin-interested-toolbar">
            <div className="toolbar-left">
              <button className="btn-outline">Export to CSV</button>
              <button className="btn-outline btn-contact-selected" onClick={openModalForSelected}>
                Send Bulk Email ({selectedIds.length})
              </button>
            </div>
            <div className="toolbar-right">
              <div className="toolbar-filters">
                <select
                  className="filter-select"
                  value={selectedCentre}
                  onChange={(e) => setSelectedCentre(e.target.value)}
                >
                  {centres.map((centre) => (
                    <option key={centre} value={centre}>
                      Digital Centre: {centre}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="search-input"
                />
              </div>
            </div>
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
                        selectedIds.length === interestedLearners.length &&
                        interestedLearners.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>DIGITAL CENTER</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {interestedLearners.map((learner) => (
                  <tr key={learner.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(learner.id)}
                        onChange={() => handleSelectOne(learner.id)}
                      />
                    </td>
                    <td>{learner.name}</td>
                    <td>{learner.email}</td>
                    <td>{learner.phone}</td>
                    <td>{learner.center}</td>
                    <td>{learner.date}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(learner.status)}`}>
                        {learner.status}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className="action-btn contact" onClick={() => openModalForOne(learner)}>
                        Contact
                      </button>
                      <button
                        className="action-btn enroll"
                        onClick={() => handleEnrollClick(learner.id)} // ✅ pass the id
                      >
                        Enroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="admin-interested-pagination">
            <button className="pagination-btn next-only">Next</button>
          </div>
        </div>
      </div>

      {/* ===== EMAIL COMPOSER MODAL ===== */}
      <EmailComposerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        learners={selectedLearners}
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