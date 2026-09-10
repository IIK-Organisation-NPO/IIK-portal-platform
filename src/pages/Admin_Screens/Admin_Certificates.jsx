// src/pages/Admin_Screens/Admin_Certificates.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Header from '../../components/Admin/Admin_Header';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import '../../styles/Admin/Admin_Certificates.css';

const Admin_Certificates = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Certificate Form State (for issuance)
    const [certificateForm, setCertificateForm] = useState({
        learner: '',
        programme: '',
        issueDate: '',
        expiryDate: '',
        neverExpires: false,
        certificateFile: null,
    });

    // Confirmation modal for issuance
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmData, setConfirmData] = useState(null);

    // ---- Edit Modal State ----
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCert, setEditingCert] = useState(null);
    const [editFormData, setEditFormData] = useState({
        learner: '',
        programme: '',
        issueDate: '',
        expiryDate: '',
        neverExpires: false,
    });

    // ---- Delete Modal State ----
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCert, setDeletingCert] = useState(null);

    // Programmes list (reusable)
    const programmes = [
        'Digital Literacy',
        'Microsoft 365',
        'Digital Marketing',
        'Risk & Compliance Excellence',
        'Data Analytics',
    ];

    // Sample certificate data
    const [certificates, setCertificates] = useState([
        {
            id: 'CERT-2026-9024',
            learner: 'Sibusiso Ndlovu',
            programme: 'Digital Marketing',
            issueDate: 'Jan 12, 2026',
            status: 'Issued',
        },
        {
            id: 'CERT-2026-8199',
            learner: 'Chantel Fourie',
            programme: 'Digital Literacy',
            issueDate: 'Jan 15, 2026',
            status: 'Pending',
        },
        {
            id: 'CERT-2026-7243',
            learner: 'Lindiwe Khumalo',
            programme: 'Microsoft 365',
            issueDate: 'Feb 02, 2026',
            status: 'Issued',
        },
        {
            id: 'CERT-2026-6122',
            learner: 'Thabo Mokoena',
            programme: 'Microsoft 365',
            issueDate: 'Feb 22, 2026',
            status: 'Issued',
        },
        {
            id: 'CERT-2026-5512',
            learner: 'Zanele Dlamini',
            programme: 'Digital Marketing',
            issueDate: 'Mar 01, 2026',
            status: 'Issued',
        },
    ]);

    const adminName = 'Admin User';
    const navigate = useNavigate();

    // ---- Helper: format date for display ----
    const formatDateForDisplay = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // ---- Helper: parse display date to YYYY-MM-DD ----
    const parseDateForInput = (displayDate) => {
        if (!displayDate) return '';
        const d = new Date(displayDate);
        if (isNaN(d)) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ---- Toggle mobile ----
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // ---- Issuance Handlers ----
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCertificateForm({
            ...certificateForm,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setCertificateForm({ ...certificateForm, certificateFile: file });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setCertificateForm({ ...certificateForm, certificateFile: file });
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!certificateForm.learner || !certificateForm.programme || !certificateForm.issueDate) {
            alert('Please fill in all required fields.');
            return;
        }
        setConfirmData({ ...certificateForm });
        setShowConfirmModal(true);
    };

    const handleConfirmIssue = () => {
        const newCert = {
            id: `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            learner: confirmData.learner,
            programme: confirmData.programme,
            issueDate: formatDateForDisplay(confirmData.issueDate),
            status: 'Issued',
        };
        setCertificates([newCert, ...certificates]);
        setCertificateForm({
            learner: '',
            programme: '',
            issueDate: '',
            expiryDate: '',
            neverExpires: false,
            certificateFile: null,
        });
        setShowConfirmModal(false);
        setConfirmData(null);
        alert('Certificate issued successfully!');
    };

    const handleCancelIssue = () => {
        setShowConfirmModal(false);
        setConfirmData(null);
    };

    // ---- Edit Handlers ----
    const handleEditClick = (cert) => {
        setEditingCert(cert);
        const issueDateInput = parseDateForInput(cert.issueDate);
        const expiryDateInput = cert.expiryDate ? parseDateForInput(cert.expiryDate) : '';
        setEditFormData({
            learner: cert.learner,
            programme: cert.programme,
            issueDate: issueDateInput,
            expiryDate: expiryDateInput,
            neverExpires: cert.neverExpires || false,
        });
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleEditSave = () => {
        const issueDisplay = formatDateForDisplay(editFormData.issueDate);
        const expiryDisplay = editFormData.neverExpires ? 'Never' : formatDateForDisplay(editFormData.expiryDate) || 'Not set';

        const updatedCertificates = certificates.map(cert =>
            cert.id === editingCert.id
                ? {
                    ...cert,
                    learner: editFormData.learner,
                    programme: editFormData.programme,
                    issueDate: issueDisplay,
                    expiryDate: expiryDisplay,
                    neverExpires: editFormData.neverExpires,
                }
                : cert
        );
        setCertificates(updatedCertificates);
        setShowEditModal(false);
        setEditingCert(null);
        alert('Certificate updated successfully!');
    };

    const handleEditCancel = () => {
        setShowEditModal(false);
        setEditingCert(null);
    };

    // ---- Delete Handlers ----
    const handleDeleteClick = (cert) => {
        setDeletingCert(cert);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        setCertificates(certificates.filter(cert => cert.id !== deletingCert.id));
        setShowDeleteModal(false);
        setDeletingCert(null);
        alert('Certificate deleted successfully!');
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeletingCert(null);
    };

    // ---- Filter ----
    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = cert.learner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || cert.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-certificates-layout">
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={3}
            />

            <div className="admin-certificates-body">
                <Admin_Sidebar
                    active="certificates"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <main className="admin-certificates-content">
                    {/* Page Header */}
                    <div className="certificates-page-header">
                        <div className="page-header-left">
                            <h1>Certificate Management</h1>
                            <p>Upload, issue, and audit official learner certification credentials.</p>
                        </div>
                        <div className="page-header-actions">
                            <button
                                className="btn-bulk-upload"
                                onClick={() => navigate('/admin-bulkCertificates')}
                            >
                                <i className="fas fa-upload"></i> Bulk Issue & Upload
                            </button>
                        </div>
                    </div>

                    {/* Upload & Assign - Side by Side */}
                    <div className="certificates-two-column">
                        <div className="upload-column">
                            <div
                                className={`file-upload-area ${certificateForm.certificateFile ? 'has-file' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => document.getElementById('fileInput').click()}
                            >
                                {certificateForm.certificateFile ? (
                                    <div className="file-info">
                                        <i className="fas fa-file-pdf"></i>
                                        <span>{certificateForm.certificateFile.name}</span>
                                        <button
                                            type="button"
                                            className="file-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCertificateForm({ ...certificateForm, certificateFile: null });
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        <p>Drag and drop certificate PDF</p>
                                        <span className="file-upload-hint">or click to browse (Max 10MB)</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="assign-column">
                            <h3 className="assign-section-title">2. Assign Certificate Details</h3>
                            <form onSubmit={handleSubmit}>
                                <div className="assign-form-group">
                                    <label>Select Learner Profile</label>
                                    <select
                                        name="learner"
                                        value={certificateForm.learner}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Enter name, email or Learner ID...</option>
                                        <option value="Sibusiso Ndlovu">Sibusiso Ndlovu</option>
                                        <option value="Chantel Fourie">Chantel Fourie</option>
                                        <option value="Lindiwe Khumalo">Lindiwe Khumalo</option>
                                        <option value="Thabo Mokoena">Thabo Mokoena</option>
                                        <option value="Zanele Dlamini">Zanele Dlamini</option>
                                    </select>
                                </div>

                                <div className="assign-form-group">
                                    <label>Academic Programme</label>
                                    <select
                                        name="programme"
                                        value={certificateForm.programme}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">e.g. Risk & Compliance Excellence</option>
                                        {programmes.map((prog) => (
                                            <option key={prog} value={prog}>{prog}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="assign-form-row">
                                    <div className="assign-form-group">
                                        <label>Date of Issue</label>
                                        <input
                                            type="date"
                                            name="issueDate"
                                            value={certificateForm.issueDate}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="assign-form-group">
                                        <label>Expiry Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={certificateForm.expiryDate}
                                            onChange={handleFormChange}
                                            disabled={certificateForm.neverExpires}
                                        />
                                    </div>
                                </div>

                                <div className="assign-form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="neverExpires"
                                            checked={certificateForm.neverExpires}
                                            onChange={handleFormChange}
                                        />
                                        Never Expires
                                    </label>
                                </div>

                                <button type="submit" className="btn-assign-certificate">
                                    <i className="fas fa-certificate"></i> Assign & Issue Certificate
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Recently Issued Certificates Table */}
                    <div className="certificates-table-wrapper">
                        <div className="table-header">
                            <h3>Recently Issued Certificates</h3>
                            <div className="table-filters">
                                <select
                                    className="filter-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="issued">Issued</option>
                                    <option value="pending">Pending</option>
                                    <option value="revoked">Revoked</option>
                                    <option value="expired">Expired</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Search certificates..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="admin-table-responsive">
                            <table className="certificates-table">
                                <thead>
                                    <tr>
                                        <th>Certificate No.</th>
                                        <th>Learner</th>
                                        <th>Accredited Programme</th>
                                        <th>Issue Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCertificates.map((cert) => (
                                        <tr key={cert.id}>
                                            <td className="certificate-no">{cert.id}</td>
                                            <td className="certificate-learner">{cert.learner}</td>
                                            <td className="certificate-programme">{cert.programme}</td>
                                            <td className="certificate-date">{cert.issueDate}</td>
                                            <td>
                                                <span className={`status-badge status-${cert.status.toLowerCase()}`}>
                                                    {cert.status}
                                                </span>
                                            </td>
                                            <td className="certificate-actions">
                                                <button className="action-btn view-btn" title="View" onClick={() => alert(`View ${cert.id}`)}>
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="action-btn edit-btn" title="Edit" onClick={() => handleEditClick(cert)}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="action-btn delete-btn" title="Delete" onClick={() => handleDeleteClick(cert)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* === ISSUANCE CONFIRMATION MODAL === */}
            {showConfirmModal && confirmData && (
                <div className="modal-overlay" onClick={handleCancelIssue}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirm Certificate Issuance</h2>
                        <p>Please review the details below before issuing the certificate.</p>
                        <div className="modal-details">
                            <div className="detail-row">
                                <span className="detail-label">Learner:</span>
                                <span className="detail-value">{confirmData.learner}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Programme:</span>
                                <span className="detail-value">{confirmData.programme}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date of Issue:</span>
                                <span className="detail-value">{formatDateForDisplay(confirmData.issueDate)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Expiry Date:</span>
                                <span className="detail-value">
                                    {confirmData.neverExpires ? 'Never Expires' : formatDateForDisplay(confirmData.expiryDate) || 'Not set'}
                                </span>
                            </div>
                            {confirmData.certificateFile && (
                                <div className="detail-row">
                                    <span className="detail-label">Certificate File:</span>
                                    <span className="detail-value">{confirmData.certificateFile.name}</span>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel-btn" onClick={handleCancelIssue}>Cancel</button>
                            <button className="modal-btn confirm-btn" onClick={handleConfirmIssue}>Confirm & Issue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === EDIT MODAL === */}
            {showEditModal && editingCert && (
                <div className="modal-overlay" onClick={handleEditCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Certificate</h2>
                        <p>Update the certificate details below.</p>
                        <div className="modal-details">
                            <div className="detail-row">
                                <span className="detail-label">Certificate No:</span>
                                <span className="detail-value">{editingCert.id}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Learner:</span>
                                <input
                                    type="text"
                                    name="learner"
                                    value={editFormData.learner}
                                    onChange={handleEditFormChange}
                                    className="modal-input"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Programme:</span>
                                <select
                                    name="programme"
                                    value={editFormData.programme}
                                    onChange={handleEditFormChange}
                                    className="modal-input"
                                >
                                    {programmes.map((prog) => (
                                        <option key={prog} value={prog}>{prog}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Issue Date:</span>
                                <input
                                    type="date"
                                    name="issueDate"
                                    value={editFormData.issueDate}
                                    onChange={handleEditFormChange}
                                    className="modal-input"
                                />
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Expiry Date:</span>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={editFormData.expiryDate}
                                    onChange={handleEditFormChange}
                                    className="modal-input"
                                    disabled={editFormData.neverExpires}
                                />
                            </div>
                            <div className="detail-row" style={{ borderBottom: 'none' }}>
                                <span className="detail-label"></span>
                                <label className="checkbox-label" style={{ marginLeft: '4px' }}>
                                    <input
                                        type="checkbox"
                                        name="neverExpires"
                                        checked={editFormData.neverExpires}
                                        onChange={handleEditFormChange}
                                    />
                                    Never Expires
                                </label>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel-btn" onClick={handleEditCancel}>Cancel</button>
                            <button className="modal-btn confirm-btn" onClick={handleEditSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* === DELETE CONFIRMATION MODAL === */}
            {showDeleteModal && deletingCert && (
                <div className="modal-overlay" onClick={handleDeleteCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete this certificate?</p>
                        <div className="modal-details">
                            <div className="detail-row">
                                <span className="detail-label">Certificate No:</span>
                                <span className="detail-value">{deletingCert.id}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Learner:</span>
                                <span className="detail-value">{deletingCert.learner}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Programme:</span>
                                <span className="detail-value">{deletingCert.programme}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Issue Date:</span>
                                <span className="detail-value">{deletingCert.issueDate}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">{deletingCert.status}</span>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel-btn" onClick={handleDeleteCancel}>Cancel</button>
                            <button className="modal-btn confirm-btn" onClick={handleDeleteConfirm}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin_Certificates;