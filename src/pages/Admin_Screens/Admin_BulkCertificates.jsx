// src/pages/Admin_Screens/Admin_BulkUpload.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Header from '../../components/Admin/Admin_Header';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import '../../styles/Admin/Admin_BulkCertificates.css';
import api from '../../services/api';

const Admin_BulkUpload = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedProgramme, setSelectedProgramme] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('Completed');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [adminName, setAdminName] = useState('Admin');
    const [submitting, setSubmitting] = useState(false);
    const [issueDate, setIssueDate] = useState('');

    // Data from database
    const [programmes, setProgrammes] = useState([]);
    const [eligibleLearners, setEligibleLearners] = useState([]);
    const [filteredLearners, setFilteredLearners] = useState([]);
    const [allSelected, setAllSelected] = useState(false);

    // Preview & confirmation modals
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showIssueConfirmModal, setShowIssueConfirmModal] = useState(false);

    // Status options
    const statusOptions = ['All', 'Completed', 'In Progress', 'Withdrawn'];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // ============================================
    // PLURALIZATION HELPER
    // ============================================
    const pluralize = (count, singular, plural) => {
        return count === 1 ? singular : plural;
    };

    // Get user data from localStorage
    const getUserData = () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.name) {
                    const fullName = `${user.name} ${user.surname || ''}`.trim();
                    setAdminName(fullName || 'Admin');
                }
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    };

    // ============================================
    // FORMAT DATE HELPER
    // ============================================
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    // ============================================
    // FETCH PROGRAMMES
    // ============================================
    const fetchProgrammes = async () => {
        try {
            const response = await api.get('/admin/programmes');
            if (response.data.success) {
                setProgrammes(response.data.data || []);
                if (response.data.data.length > 0) {
                    setSelectedProgramme(response.data.data[0].Programme_id);
                }
            }
        } catch (err) {
            console.error('Error fetching programmes:', err);
        }
    };

    // ============================================
    // FETCH ELIGIBLE LEARNERS FROM ENROLMENT TABLE
    // ============================================
    const fetchEligibleLearners = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (selectedProgramme) params.append('programme_id', selectedProgramme);
            if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);

            console.log('Fetching eligible learners with params:', params.toString());

            const response = await api.get(`/admin/bulk-certificates/eligible?${params.toString()}`);

            if (response.data.success) {
                const learners = response.data.data || [];
                console.log('Eligible learners from Enrolment:', learners);

                const learnersWithSelection = learners.map((learner, index) => ({
                    ...learner,
                    selected: true,
                    formattedCompletionDate: formatDate(learner.Completion_date),
                    formattedEnrolmentDate: formatDate(learner.Enrolment_date),
                    certNumber: `CERT-${new Date().getFullYear()}-${String(learner.Enrolment_id || (1000 + index)).padStart(4, '0')}`
                }));

                setEligibleLearners(learnersWithSelection);
                setFilteredLearners(learnersWithSelection);
                setAllSelected(true);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching eligible learners:', err);
            setError('Failed to load eligible learners');
            setLoading(false);
        }
    };

    // ============================================
    // APPLY FILTERS (Triggers Backend Refetch)
    // ============================================
    const applyFilters = () => {
        fetchEligibleLearners();
    };

    // ============================================
    // HANDLE FILE SELECT — only one template PDF allowed
    // ============================================
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        if (files.length === 0) return;

        if (files.length > 1) {
            setError('Only one template PDF can be selected. Please pick a single file.');
            setTimeout(() => setError(null), 5000);
            e.target.value = '';
            setSelectedFiles([]);
            return;
        }

        const file = files[0];

        if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
            setError('Only PDF files are allowed');
            setTimeout(() => setError(null), 5000);
            e.target.value = '';
            setSelectedFiles([]);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File must be less than 10MB');
            setTimeout(() => setError(null), 5000);
            e.target.value = '';
            setSelectedFiles([]);
            return;
        }

        setSelectedFiles([file]);
        setSuccessMessage(`Template "${file.name}" selected successfully`);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    // ============================================
    // REMOVE SELECTED TEMPLATE
    // ============================================
    const handleRemoveTemplate = () => {
        setSelectedFiles([]);
        const fileInput = document.getElementById('bulkFileInput');
        if (fileInput) fileInput.value = '';
    };

    // ============================================
    // SELECT ALL ELIGIBLE
    // ============================================
    const handleSelectAllEligible = () => {
        setFilteredLearners(prev =>
            prev.map(learner => ({
                ...learner,
                selected: true
            }))
        );
        setAllSelected(true);
    };

    // ============================================
    // DESELECT ALL
    // ============================================
    const handleDeselectAll = () => {
        setFilteredLearners(prev =>
            prev.map(learner => ({
                ...learner,
                selected: false
            }))
        );
        setAllSelected(false);
    };

    // ============================================
    // SELECT INDIVIDUAL LEARNER
    // ============================================
    const handleSelectLearner = (id) => {
        setFilteredLearners(prev =>
            prev.map(learner =>
                learner.id === id
                    ? { ...learner, selected: !learner.selected }
                    : learner
            )
        );

        const allChecked = filteredLearners.every(l => l.selected);
        setAllSelected(allChecked);
    };

    // ============================================
    // SELECT ALL (header checkbox)
    // ============================================
    const handleSelectAll = () => {
        const allChecked = !allSelected;
        setAllSelected(allChecked);
        setFilteredLearners(prev =>
            prev.map(learner => ({
                ...learner,
                selected: allChecked
            }))
        );
    };

    // ============================================
    // OPEN PREVIEW MODAL
    // ============================================
    const handlePreview = () => {
        const selected = filteredLearners.filter(l => l.selected);
        if (selected.length === 0) {
            setError('No learners selected');
            setTimeout(() => setError(null), 5000);
            return;
        }
        setShowPreviewModal(true);
    };

    // ============================================
    // CLOSE PREVIEW MODAL
    // ============================================
    const closePreview = () => {
        setShowPreviewModal(false);
    };

    // ============================================
    // OPEN ISSUE CONFIRMATION MODAL
    // ============================================
    const handleOpenIssueConfirm = () => {
        const selected = filteredLearners.filter(l => l.selected);

        if (selected.length === 0) {
            setError('No learners selected');
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (selectedFiles.length === 0) {
            setError('Please upload a certificate template PDF first.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (!issueDate) {
            setError('Please select an issue date before issuing certificates.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        setShowIssueConfirmModal(true);
    };

    // ============================================
    // CANCEL ISSUE
    // ============================================
    const cancelIssue = () => {
        setShowIssueConfirmModal(false);
    };

    // ============================================
    // CONFIRM ISSUE — send template + certificates as multipart
    // ============================================
    const confirmIssue = async () => {
        setShowIssueConfirmModal(false);

        const selectedLearners = filteredLearners.filter(l => l.selected);

        if (selectedLearners.length === 0) {
            setError('No learners selected');
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (selectedFiles.length === 0) {
            setError('Please upload a certificate template PDF first.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        if (!issueDate) {
            setError('Please select an issue date before issuing certificates.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            setSubmitting(true);

            const certificatesToIssue = selectedLearners.map(learner => ({
                user_id: learner.id,
                programme_id: learner.Programme_id || selectedProgramme,
                issue_date: issueDate,
                expiry_date: null
            }));

            const formData = new FormData();
            formData.append('template', selectedFiles[0]);
            formData.append('certificates', JSON.stringify(certificatesToIssue));

            const response = await api.post('/admin/bulk-certificates/issue', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                const successful = response.data.data.successful.length;
                const failed = response.data.data.failed.length;
                const total = response.data.data.total;

                setSuccessMessage(
                    `Successfully issued ${successful} of ${total} certificates${failed > 0 ? ` (${failed} failed)` : ''}`
                );
                setTimeout(() => setSuccessMessage(''), 5000);

                setSelectedFiles([]);
                const fileInput = document.getElementById('bulkFileInput');
                if (fileInput) fileInput.value = '';
                handleDeselectAll();
                await fetchEligibleLearners();
            } else {
                setError(response.data.message || 'Failed to issue certificates');
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error('Error issuing certificates:', err);
            setError(err.response?.data?.message || 'Failed to issue certificates');
            setTimeout(() => setError(null), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // LOAD DATA ON MOUNT
    // ============================================
    useEffect(() => {
        getUserData();
        fetchProgrammes();
    }, []);

    // ============================================
    // REFETCH WHEN FILTERS CHANGE
    // ============================================
    useEffect(() => {
        if (selectedProgramme || selectedStatus) {
            fetchEligibleLearners();
        }
    }, [selectedProgramme, selectedStatus]);

    // Count selected learners
    const selectedCount = filteredLearners.filter(l => l.selected).length;

    // Loading state
    if (loading && eligibleLearners.length === 0) {
        return (
            <div className="admin-bulkupload-layout">
                <Admin_Header
                    adminName={adminName}
                    onMenuToggle={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                    notificationCount={0}
                />
                <div className="admin-bulkupload-body">
                    <Admin_Sidebar
                        active="certificates"
                        isMobileOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                    />
                    <main className="admin-bulkupload-content">
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <div className="loading-spinner" style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid #000',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 20px'
                            }}></div>
                            <p>Loading eligible learners from enrolments...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-bulkupload-layout">
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={0}
            />

            <div className="admin-bulkupload-body">
                <Admin_Sidebar
                    active="certificates"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <main className="admin-bulkupload-content">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="success-toast" style={{
                            position: 'fixed',
                            top: '80px',
                            right: '20px',
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            padding: '15px 25px',
                            borderRadius: '8px',
                            border: '1px solid #c3e6cb',
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            {successMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="error-toast" style={{
                            position: 'fixed',
                            top: '80px',
                            right: '20px',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            padding: '15px 25px',
                            borderRadius: '8px',
                            border: '1px solid #f5c6cb',
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            {error}
                        </div>
                    )}

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
                                    <option value="">All Programmes</option>
                                    {programmes.map((prog) => (
                                        <option key={prog.Programme_id} value={prog.Programme_id}>
                                            {prog.Programme_name}
                                        </option>
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
                                <button
                                    className="btn-apply-filters"
                                    onClick={applyFilters}
                                >
                                    <i className="fas fa-filter"></i> Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Upload Section — one template only */}
                    <div className="bulk-upload-section">
                        <h3>Certificate Template</h3>
                        <p>Upload one blank certificate template PDF. Each selected learner's name, ID, and programme will be overlaid onto this template.</p>

                        <div
                            className="bulk-file-upload-area"
                            onClick={() => document.getElementById('bulkFileInput').click()}
                        >
                            <i className="far fa-file-alt upload-doc-icon"></i>
                            <p>Upload one certificate template PDF</p>
                            <span className="upload-hint">One file only, max 10MB.</span>
                            <button className="btn-select-files" type="button">
                                <i className="fas fa-file-pdf"></i> Select Template PDF
                            </button>
                            <input
                                type="file"
                                id="bulkFileInput"
                                accept=".pdf"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="selected-files-info" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <i className="fas fa-check-circle"></i>
                                <span>Template selected: <strong>{selectedFiles[0].name}</strong></span>
                                <button
                                    type="button"
                                    onClick={handleRemoveTemplate}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#dc3545',
                                        fontWeight: 500,
                                        marginLeft: 'auto'
                                    }}
                                >
                                    Remove
                                </button>
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
                            <h3>
                                Filtered Recipient Preview & Verification
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 'normal',
                                    color: '#666',
                                    marginLeft: '10px'
                                }}>
                                    ({filteredLearners.length} {pluralize(filteredLearners.length, 'learner', 'learners')} eligible)
                                </span>
                            </h3>
                            <div className="preview-actions">
                                <span className="selected-count">
                                    {selectedCount} Selected
                                </span>
                                <button
                                    className="btn-select-all"
                                    onClick={handleSelectAllEligible}
                                >
                                    <i className="fas fa-check-double"></i> Select All Eligible
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
                                                checked={allSelected && filteredLearners.length > 0}
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
                                    {filteredLearners && filteredLearners.length > 0 ? (
                                        filteredLearners.map((learner) => (
                                            <tr key={learner.Enrolment_id || learner.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={learner.selected || false}
                                                        onChange={() => handleSelectLearner(learner.id)}
                                                    />
                                                </td>
                                                <td className="learner-name">
                                                    {learner.name} {learner.surname || ''}
                                                </td>
                                                <td className="learner-email">{learner.email}</td>
                                                <td>{learner.formattedCompletionDate || 'N/A'}</td>
                                                <td>
                                                    <span className={`status-badge ${
                                                        learner.Completion_status === 'Completed'
                                                            ? 'status-completed'
                                                            : learner.Completion_status === 'In Progress'
                                                                ? 'status-in-progress'
                                                                : 'status-withdrawn'
                                                    }`}>
                                                        {learner.Completion_status || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="no-results">
                                                <i className="fas fa-search"></i>
                                                <p>No learners found matching the filters</p>
                                            </td>
                                        </tr>
                                    )}
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
                            <button
                                className="btn-preview"
                                onClick={handlePreview}
                                disabled={selectedCount === 0}
                                style={{
                                    opacity: selectedCount === 0 ? 0.6 : 1,
                                    cursor: selectedCount === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <i className="fas fa-eye"></i> Preview Selected ({selectedCount})
                            </button>
                            <button
                                className="btn-issue-bulk"
                                onClick={handleOpenIssueConfirm}
                                disabled={submitting || selectedCount === 0}
                                style={{
                                    opacity: (submitting || selectedCount === 0) ? 0.6 : 1,
                                    cursor: (submitting || selectedCount === 0) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <i className="fas fa-certificate"></i>
                                {submitting ? 'Issuing...' : `Issue Certificates (${selectedCount})`}
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
                                    {filteredLearners.filter(l => l.selected).map((learner) => (
                                        <tr key={learner.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '6px 8px' }}>{learner.name}</td>
                                            <td style={{ padding: '6px 8px' }}>{learner.email}</td>
                                            <td style={{ padding: '6px 8px' }}>{learner.formattedCompletionDate}</td>
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
                                    {filteredLearners.filter(l => l.selected).map((learner) => (
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

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .status-badge.status-completed {
                    background: #d4edda;
                    color: #155724;
                    padding: 3px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-badge.status-in-progress {
                    background: #cce5ff;
                    color: #004085;
                    padding: 3px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-badge.status-withdrawn {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 3px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .no-results {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }
                .no-results i {
                    font-size: 32px;
                    margin-bottom: 10px;
                    display: block;
                }
                .selected-count {
                    font-weight: 500;
                    color: #1a237e;
                    padding: 5px 12px;
                    background: #e3f2fd;
                    border-radius: 12px;
                }
            `}</style>
        </div>
    );
};

export default Admin_BulkUpload;