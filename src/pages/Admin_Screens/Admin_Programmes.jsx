// src/pages/Admin_Screens/Admin_Programmes.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/admin_Programmes.css';

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
  const [programmes, setProgrammes] = useState([
    {
      id: 1,
      name: 'Digital Literacy',
      enrolled: 52,
      startDate: 'Jan 10, 2026',
      status: 'Active',
      category: 'Digital Skills',
      archived: false
    },
    {
      id: 2,
      name: 'Microsoft 365',
      enrolled: 38,
      startDate: 'Feb 01, 2026',
      status: 'Active',
      category: 'Productivity',
      archived: false
    },
    {
      id: 3,
      name: 'Digital Marketing',
      enrolled: 45,
      startDate: 'Mar 05, 2026',
      status: 'Active',
      category: 'Marketing',
      archived: false
    },
    {
      id: 4,
      name: 'Business Communication',
      enrolled: 0,
      startDate: 'Jan 20, 2026',
      status: 'Upcoming',
      category: 'Business',
      archived: false
    },
    {
      id: 5,
      name: 'Project Management Basics',
      enrolled: 0,
      startDate: 'May 01, 2026',
      status: 'Draft',
      category: 'Management',
      archived: false
    }
  ]);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    const newProgramme = location.state?.programme;
    if (!newProgramme) return;

    setProgrammes(currentProgrammes => (
      currentProgrammes.some(programme => programme.id === newProgramme.id)
        ? currentProgrammes
        : [...currentProgrammes, newProgramme]
    ));
    navigate('/admin/programmes', { replace: true, state: {} });
  }, [location.state?.programme, navigate]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show/hide scroll button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get unique categories for filter
  const categories = ['Category', 'All', ...new Set(programmes.map(p => p.category))];
  const statuses = ['Status', 'All', 'Active', 'Upcoming', 'Draft', 'Archived'];

  // Filter programmes
  const filteredProgrammes = programmes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Category' || categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'Status' || statusFilter === 'All'
      || (statusFilter === 'Archived' ? p.archived : p.status === statusFilter);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Separate archived and active programmes
  const activeProgrammes = filteredProgrammes.filter(p => !p.archived);
  const archivedProgrammes = filteredProgrammes.filter(p => p.archived);

  // Get displayed programmes
  const displayedProgrammes = showArchived ? [...activeProgrammes, ...archivedProgrammes] : activeProgrammes;

  // Stats
  const totalProgrammes = programmes.length;
  const activeProgrammesCount = programmes.filter(p => p.status === 'Active' && !p.archived).length;
  const totalEnrolments = programmes.reduce((sum, p) => sum + p.enrolled, 0);

  // Handle archive
  const handleArchive = (id) => {
    setProgrammes(programmes.map(p => 
      p.id === id ? { ...p, archived: !p.archived } : p
    ));
    setProgrammeToArchive(null);
  };

  // Handle edit
  const handleEdit = (programme) => {
    setEditingProgramme(programme);
    setEditStatus(programme.status);
    setShowEditModal(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    setProgrammes(programmes.map(p => 
      p.id === editingProgramme.id
        ? { ...p, status: editStatus, enrolled: ['Draft', 'Upcoming'].includes(editStatus) ? 0 : p.enrolled }
        : p
    ));
    setShowEditModal(false);
    setEditingProgramme(null);
  };

  // Handle create programme
  const handleCreateProgramme = () => {
    navigate('/admin/create-programme');
  };

  // Handle export data
  const handleExportData = () => {
    const exportData = filteredProgrammes.map(p => ({
      'Programme Name': p.name,
      'Enrolled': p.enrolled,
      'Start Date': p.startDate,
      'Status': p.archived ? 'Archived' : p.status,
      'Category': p.category
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
      {/* Header */}
      <Admin_Header 
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-layout">
        {/* Sidebar */}
        <Admin_Sidebar 
          active="programmes"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        {/* Main Content */}
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

          {/* Stats Cards */}
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

          {/* Controls Bar */}
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

          {/* Programmes Table */}
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
                {displayedProgrammes.length > 0 ? (
                  displayedProgrammes.map((programme) => (
                    <tr key={programme.id} className={programme.archived ? 'archived-row' : ''}>
                      <td>{programme.name}</td>
                      <td>{programme.enrolled} learners</td>
                      <td>{programme.startDate}</td>
                      <td>
                        <span className={`status-badge status-${programme.status.toLowerCase()}`}>
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

          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Edit Programme Status</h2>
                <div className="modal-content">
                  <p><strong>Programme:</strong> {editingProgramme?.name}</p>
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSaveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {programmeToArchive && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true" aria-labelledby="archive-modal-title">
                <h2 id="archive-modal-title">Archive Programme?</h2>
                <div className="modal-content">
                  <p>Are you sure you want to archive <strong>{programmeToArchive.name}</strong>?</p>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setProgrammeToArchive(null)}>
                    Cancel
                  </button>
                  <button className="btn-archive" onClick={() => handleArchive(programmeToArchive.id)}>
                    Archive Programme
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* POPIA Notice */}
          <div className="popia-notice">
            <p><strong>POPIA Compliance Notice:</strong> Under South African Protection of Personal Information Act rules, this database is restricted to authorized credentials management. Deactivation obscures public-facing records immediately.</p>
          </div>

        </main>
      </div>

      {/* Scroll to Top Button */}
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