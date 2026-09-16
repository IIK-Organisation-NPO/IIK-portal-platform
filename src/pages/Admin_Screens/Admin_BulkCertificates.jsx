// src/pages/Admin_Screens/Admin_BulkUpload.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Header from '../../components/Admin/Admin_Header';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import '../../styles/Admin/Admin_BulkCertificates.css';

const Admin_BulkUpload = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedProgramme, setSelectedProgramme] = useState('Digital Marketing');
    const [selectedStatus, setSelectedStatus] = useState('Completed');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [issueDate, setIssueDate] = useState('');

    const [selectedLearners, setSelectedLearners] = useState([
        { id: 1, name: 'Sibusiso Ndlovu', email: 'sibu.ndlovu@example.com', completionDate: '24 Feb 2026', status: 'Completed', selected: true },
        { id: 2, name: 'Chantel Fourie', email: 'chantel.f@outlook.com', completionDate: '23 Feb 2026', status: 'Completed', selected: true },
        { id: 3, name: 'Lindiwe Khumalo', email: 'lindi.khumalo@mweb.co.za', completionDate: '25 Feb 2026', status: 'Completed', selected: true },
        { id: 4, name: 'Pieter de Wet', email: 'pieter.dewet@telkomsa.net', completionDate: '22 Feb 2026', status: 'Completed', selected: true },
        { id: 5, name: 'Fatima Patel', email: 'fatima.p@gmail.com', completionDate: '25 Feb 2026', status: 'Completed', selected: false },
    ]);

    const [allSelected, setAllSelected] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showIssueConfirmModal, setShowIssueConfirmModal] = useState(false);

    const adminName = 'Admin User';

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 50) {
            alert('Maximum 50 files allowed');
            return;
        }
        setSelectedFiles(files);
    };

    const handleSelectAllEligible = () => {
        setSelectedLearners(prev => prev.map(l => ({ ...l, selected: true })));
        setAllSelected(true);
    };

    const handleDeselectAll = () => {
        setSelectedLearners(prev => prev.map(l => ({ ...l, selected: false })));
        setAllSelected(false);
    };

    const handleSelectLearner = (id) => {
        setSelectedLearners(prev =>
            prev.map(l => l.id === id ? { ...l, selected: !l.selected } : l)
        );
    };

    const handleSelectAll = () => {
        const allChecked = !allSelected;
        setAllSelected(allChecked);
        setSelectedLearners(prev => prev.map(l => ({ ...l, selected: allChecked })));
    };

    const selectedCount = selectedLearners.filter(l => l.selected).length;

    const handlePreviewSelected = () => {
        if (selectedCount === 0) { alert('No learners selected.'); return; }
        setShowPreviewModal(true);
    };

    const handleIssueCertificates = () => {
        if (selectedCount === 0) { alert('No learners selected.'); return; }
        setShowIssueConfirmModal(true);
    };

    const confirmIssue = () => {
        console.log('Issuing certificates for:', selectedLearners.filter(l => l.selected));
        console.log('Issue date:', issueDate);
        alert(`Certificates issued to ${selectedCount} learner(s)!`);
        setShowIssueConfirmModal(false);
        navigate('/admin/certificates');
    };

    const cancelIssue = () => setShowIssueConfirmModal(false);
    const closePreview = () => setShowPreviewModal(false);

    const programmes = ['Digital Literacy', 'Microsoft 365', 'Digital Marketing', 'Risk & Compliance Excellence', 'Data Analytics'];
    const statusOptions = ['All', 'Completed', 'In Progress', 'Pending', 'Not Started'];

    return (
        <div className="admin-bulkupload-layout">
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={3}
            />

            <div className="admin-bulkupload-body">
                <Admin_Sidebar
                    active="certificates"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <main className="admin-bulkupload-content">
                    {/* Page Header */}
                    <div className="bulkupload-page-header">
                        <h1>Bulk Certificate Issuance — By Course</h1>
                        <p>Select a programme and configure status filters to identify eligible learners. Match, preview, and dispatch standard credentials in mass.</p>
                    </div>

                    {/* Filter Section */}
                    <div className="filter-section">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>COURSE / PROGRAMME</label>
                                <select
                                    value={selectedProgramme}
                                    onChange={(e) => setSelectedProgramme(e.target.value)}
                                >
                                    {programmes.map((prog) => (
                                        <option key={prog} value={prog}>{prog}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>COMPLETION STATUS</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group filter-actions">
                                <button className="btn-apply-filters">Apply Filters</button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Upload Section */}
                    <div className="bulk-upload-section">
                        <h3>Bulk Upload Certificate PDFs</h3>

                        <div
                            className="bulk-file-upload-area"
                            onClick={() => document.getElementById('bulkFileInput').click()}
                        >
                            <i className="far fa-file-alt upload-doc-icon"></i>
                            <p>Upload certificate PDF files</p>
                            <span className="upload-hint">Max 50 files, 10MB each.</span>
                            <span className="upload-hint">Filenames must match recipient emails.</span>
                            <button className="btn-select-files">Select PDF Files</button>
                            <input
                                type="file"
                                id="bulkFileInput"
                                accept=".pdf"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="selected-files-info">
                                <i className="fas fa-check-circle"></i>
                                <span>{selectedFiles.length} file(s) selected</span>
                            </div>
                        )}

                        {/* Bottom row: Supported formats + Issue date */}
                        <div className="bulk-upload-footer">
                            <div className="supported-formats">
                                Supported formats: Standard PDF/A versions
                            </div>
                            <div className="issue-date-wrapper">
                                <input
                                    type="date"
                                    id="issueDate"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className={`issue-date-input ${issueDate ? 'has-value' : ''}`}
                                />
                                {!issueDate && (
                                    <span className="issue-date-placeholder">Issue date</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filtered Recipient Preview */}
                    <div className="recipient-preview-section">
                        <div className="preview-header">
                            <div className="preview-header-left">
                                <h3>Filtered Recipient Preview & Verification</h3>
                                <span className="selected-count">{selectedCount} Selected</span>
                            </div>
                            <div className="preview-actions">
                                <button className="btn-select-all" onClick={handleSelectAllEligible}>
                                    Select All Eligible
                                </button>
                                <button className="btn-deselect-all" onClick={handleDeselectAll}>
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="recipient-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Learner Name</th>
                                        <th>Email</th>
                                        <th>Completion Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedLearners.map((learner) => (
                                        <tr key={learner.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={learner.selected || false}
                                                    onChange={() => handleSelectLearner(learner.id)}
                                                />
                                            </td>
                                            <td className="learner-name">{learner.name}</td>
                                            <td className="learner-email">{learner.email}</td>
                                            <td>{learner.completionDate}</td>
                                            <td>
                                                <span className="status-badge status-completed">
                                                    {learner.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bulk-actions">
                        <button className="btn-back" onClick={() => navigate('/admin-certificates')}>
                            Back to Certificates
                        </button>
                        <div className="bulk-actions-right">
                            <button className="btn-preview" onClick={handlePreviewSelected}>
                                Preview Selected ({selectedCount})
                            </button>
                            <button className="btn-issue-bulk" onClick={handleIssueCertificates}>
                                Issue Certificates ({selectedCount})
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="modal-overlay" onClick={closePreview}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Preview Selected Learners</h2>
                        <p>The following learners are selected for certificate issuance:</p>
                        <div className="modal-details" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #eaeaea' }}>
                                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Name</th>
                                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Email</th>
                                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Completion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedLearners.filter(l => l.selected).map((learner) => (
                                        <tr key={learner.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '6px 8px' }}>{learner.name}</td>
                                            <td style={{ padding: '6px 8px' }}>{learner.email}</td>
                                            <td style={{ padding: '6px 8px' }}>{learner.completionDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel-btn" onClick={closePreview}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Confirmation Modal */}
            {showIssueConfirmModal && (
                <div className="modal-overlay" onClick={cancelIssue}>
                    <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirm Bulk Issuance</h2>
                        <p className="confirmation-question">
                            You are about to issue certificates to <strong>{selectedCount}</strong> learner(s).
                        </p>
                        <div className="modal-details" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #eaeaea' }}>
                                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Name</th>
                                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedLearners.filter(l => l.selected).map((learner) => (
                                        <tr key={learner.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '6px 8px' }}>{learner.name}</td>
                                            <td style={{ padding: '6px 8px' }}>{learner.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p style={{ marginTop: '12px' }}>This action cannot be undone. Proceed?</p>
                        <div className="modal-actions">
                            <button className="modal-btn cancel-btn" onClick={cancelIssue}>Cancel</button>
                            <button className="modal-btn confirm-btn" onClick={confirmIssue}>Yes, Issue Certificates</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin_BulkUpload;