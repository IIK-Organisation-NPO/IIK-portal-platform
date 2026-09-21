// src/pages/Admin_Screens/Admin_StaffManagement.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/admin_StaffManagement.css';

const AdminStaffManagement = () => {
  const navigate = useNavigate();

  // --- UI State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  // --- Table Data State ---
  const [staffMembers, setStaffMembers] = useState([
    {
      id: 1,
      name: 'Admin Workspace',
      email: 'admin_administrator@...',
      role: 'Administrator',
      dateRegistered: 'Jan 01, 2026',
      lastLogin: '10 mins ago',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Kgmotso Masemola',
      email: 'kgmotso_Certificate...',
      role: 'Manager',
      dateRegistered: 'Jan 10, 2026',
      lastLogin: '2 hours ago',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Lerato Dube',
      email: 'lerato_Programme...',
      role: 'Coordinator',
      dateRegistered: 'Jan 15, 2026',
      lastLogin: 'Yesterday',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Siphesihle Nkosi',
      email: 'sihle@...',
      role: 'Viewer',
      dateRegistered: 'Feb 05, 2026',
      lastLogin: '5 days ago',
      status: 'Active'
    }
  ]);

  // --- Modal State ---
  const [showActionModal, setShowActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  // --- Handlers ---
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegisterStaff = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.surname || !formData.email || !formData.role) {
      alert("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const nextId = staffMembers.reduce((max, staff) => Math.max(max, staff.id), 0) + 1;
    const newStaff = {
      id: nextId,
      name: `${formData.name} ${formData.surname}`,
      email: formData.email,
      role: formData.role,
      dateRegistered: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      }),
      lastLogin: 'Never',
      status: 'Active'
    };

    setStaffMembers([...staffMembers, newStaff]);
    setFormData({ name: '', surname: '', email: '', phone: '', role: '', password: '', confirmPassword: '' });
  };

  // --- Action Modal Handlers ---
  const handleOpenActionModal = (staff) => {
    setSelectedStaff(staff);
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setSelectedStaff(null);
  };

  const handleSelectEdit = () => {
    setEditStatus(selectedStaff.status);
    setShowActionModal(false);
    setShowEditModal(true);
  };

  const handleSelectDeactivate = () => {
    setShowActionModal(false);
    setShowDeactivateModal(true);
  };

  const handleSelectDelete = () => {
    setShowActionModal(false);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = () => {
    setStaffMembers(staffMembers.map((staff) =>
      staff.id === selectedStaff.id ? { ...staff, status: editStatus } : staff
    ));
    setShowEditModal(false);
    setSelectedStaff(null);
  };

  const handleConfirmDeactivate = () => {
    setStaffMembers(staffMembers.map((staff) =>
      staff.id === selectedStaff.id ? { ...staff, status: 'Inactive' } : staff
    ));
    setShowDeactivateModal(false);
    setSelectedStaff(null);
  };

  const handleConfirmDelete = () => {
    setStaffMembers(staffMembers.filter((staff) => staff.id !== selectedStaff.id));
    setShowDeleteModal(false);
    setSelectedStaff(null);
  };

  return (
    <div className="app-container">
      <Admin_Header onMenuToggle={toggleMobileMenu} isMobileMenuOpen={isMobileMenuOpen} />
      <div className="main-layout">
        <Admin_Sidebar active="staff" isMobileOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        <main className="admin-content">
          <div className="page-header">
            <h1>Staff Management</h1>
            <p>Register administrative staff, delegate functional access roles, and audit operational activity.</p>
          </div>

          <div className="acl-banner">
            <svg className="acl-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p><strong>Access Control Level (ACL):</strong> Creating staff accounts issues temporary access codes. New staff must authenticate within 24 hours of invitation.</p>
          </div>

          <div className="card form-card">
            <h2>Register New Staff Member</h2>
            <form onSubmit={handleRegisterStaff} className="register-form">
              <div className="form-grid">
                <div className="form-group"><label>NAME</label><input type="text" name="name" placeholder="Enter name..." value={formData.name} onChange={handleInputChange} /></div>
                <div className="form-group"><label>SURNAME</label><input type="text" name="surname" placeholder="Enter surname..." value={formData.surname} onChange={handleInputChange} /></div>
                <div className="form-group"><label>EMAIL ADDRESS</label><input type="email" name="email" placeholder="username@uk.co.za" value={formData.email} onChange={handleInputChange} /></div>
                <div className="form-group"><label>PHONE NUMBER</label><input type="text" name="phone" placeholder="e.g. +27 82 123 4567" value={formData.phone} onChange={handleInputChange} /></div>
                <div className="form-group">
                  <label>ASSIGN SYSTEM ROLE</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="">Select Role...</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Manager</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="form-group"><label>TEMPORARY PASSWORD</label><input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} /></div>
                <div className="form-group"><label>CONFIRM PASSWORD</label><input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} /></div>
              </div>
              <div className="form-actions"><button type="submit" className="btn-primary">Register Staff Member</button></div>
            </form>
          </div>

          <div className="card table-card">
            <h2>Current Staff Members</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>STAFF MEMBER</th><th>SYSTEM ROLE / EMAIL</th><th>DATE REGISTERED</th><th>LAST LOGIN</th><th>STATUS</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => (
                  <tr key={staff.id}>
                    <td className="staff-name-cell"><strong>{staff.name}</strong></td>
                    <td className="staff-role-cell"><span>{staff.role}</span><small>{staff.email}</small></td>
                    <td>{staff.dateRegistered}</td>
                    <td>{staff.lastLogin}</td>
                    <td><span className={`status-badge status-${staff.status.toLowerCase()}`}>{staff.status}</span></td>
                    <td>
                      <button className="btn-action" onClick={() => handleOpenActionModal(staff)}>Action</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- MODALS --- */}

          {/* Action Selection Modal */}
          {showActionModal && (
            <div className="modal-overlay">
              <div className="modal action-modal" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
                <h2 id="action-modal-title">Select an Action</h2>
                <div className="modal-content">
                  <p className="action-modal-subtitle">
                    Choose what you would like to do with <strong>{selectedStaff?.name}</strong>.
                  </p>
                  
                  {/* The container that forces the vertical stacking */}
                  <div className="action-modal-buttons">
                    <button className="action-modal-btn btn-edit" onClick={handleSelectEdit}>
                      Edit
                    </button>
                    <button
                      className="action-modal-btn btn-archive"
                      onClick={handleSelectDeactivate}
                      disabled={selectedStaff?.status === 'Inactive'}
                    >
                      Deactivate
                    </button>
                    <button className="action-modal-btn btn-delete" onClick={handleSelectDelete}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleCloseActionModal}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Status Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true">
                <h2>Edit Staff Status</h2>
                <div className="modal-content">
                  <p><strong>Staff Member:</strong> {selectedStaff?.name}</p>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Deactivate Confirmation Modal */}
          {showDeactivateModal && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-modal-title">
                <h2 id="deactivate-modal-title">Deactivate Staff Member?</h2>
                <div className="modal-content">
                  <p>Are you sure you want to deactivate <strong>{selectedStaff?.name}</strong>?</p>
                  <p className="modal-warning-text">This action will revoke their access to the portal immediately.</p>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowDeactivateModal(false)}>Cancel</button>
                  <button className="btn-archive" onClick={handleConfirmDeactivate}>Deactivate Staff</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                <h2 id="delete-modal-title">Delete Staff Member?</h2>
                <div className="modal-content">
                  <p>Are you sure you want to delete <strong>{selectedStaff?.name}</strong>?</p>
                  <p className="modal-warning-text">This action will remove their access to the portal completely</p>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="btn-delete" onClick={handleConfirmDelete}>Delete Staff</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminStaffManagement;