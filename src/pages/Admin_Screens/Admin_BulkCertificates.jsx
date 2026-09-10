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
    const [selectedDateRange, setSelectedDateRange] = useState('Last 30 Days');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [adminName, setAdminName] = useState('Admin');
    const [submitting, setSubmitting] = useState(false);

    // Data from database
    const [programmes, setProgrammes] = useState([]);
    const [eligibleLearners, setEligibleLearners] = useState([]);
    const [filteredLearners, setFilteredLearners] = useState([]);
    const [allSelected, setAllSelected] = useState(false);

    // Status options
    const statusOptions = ['All', 'Completed', 'In Progress', 'Withdrawn'];
    const dateRanges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last Year'];

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
    // ✅ FORMAT DATE HELPER
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
    // ✅ FETCH PROGRAMMES
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
    // ✅ FETCH ELIGIBLE LEARNERS FROM ENROLMENT TABLE
    // ============================================
    const fetchEligibleLearners = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query params
            const params = new URLSearchParams();
            if (selectedProgramme) params.append('programme_id', selectedProgramme);
            if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);

            console.log('📡 Fetching eligible learners with params:', params.toString());

            const response = await api.get(`/admin/bulk-certificates/eligible?${params.toString()}`);

            if (response.data.success) {
                const learners = response.data.data || [];
                console.log('📋 Eligible learners from Enrolment:', learners);

                // Add selection property and format dates
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
    // ✅ APPLY FILTERS (Triggers Backend Refetch)
    // ============================================
    const applyFilters = () => {
        fetchEligibleLearners();
    };

    // ============================================
    // ✅ HANDLE FILE SELECT
    // ============================================
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 50) {
            setError('Maximum 50 files allowed');
            setTimeout(() => setError(null), 5000);
            return;
        }
        
        // Validate file types and sizes
        const invalidFiles = files.filter(file => file.type !== 'application/pdf');
        if (invalidFiles.length > 0) {
            setError('Only PDF files are allowed');
            setTimeout(() => setError(null), 5000);
            return;
        }

        const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            setError('Each file must be less than 10MB');
            setTimeout(() => setError(null), 5000);
            return;
        }

        setSelectedFiles(files);
        setSuccessMessage(`${files.length} file(s) selected successfully`);
        setTimeout(() => setSuccessMessage(''), 5000);
    };

    // ============================================
    // ✅ SELECT ALL ELIGIBLE
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
    // ✅ DESELECT ALL
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
    // ✅ SELECT INDIVIDUAL LEARNER
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
    // ✅ SELECT ALL
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
    // ✅ ISSUE BULK CERTIFICATES
    // ============================================
    const handleIssueBulk = async () => {
        const selectedLearners = filteredLearners.filter(l => l.selected);
        
        if (selectedLearners.length === 0) {
            setError('No learners selected');
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            setSubmitting(true);

            // Build certificate array for backend
            const certificatesToIssue = selectedLearners.map(learner => ({
                user_id: learner.id,
                programme_id: learner.Programme_id || selectedProgramme,
                issue_date: learner.Completion_date || new Date().toISOString().split('T')[0],
                expiry_date: null
            }));

            console.log('📤 Sending bulk certificates:', certificatesToIssue);

            const response = await api.post('/admin/bulk-certificates/issue', {
                certificates: certificatesToIssue
            });

            if (response.data.success) {
                const successful = response.data.data.successful.length;
                const failed = response.data.data.failed.length;
                const total = response.data.data.total;

                setSuccessMessage(
                    ` Successfully issued ${successful} of ${total} certificates${failed > 0 ? ` (${failed} failed)` : ''}`
                );
                setTimeout(() => setSuccessMessage(''), 5000);
                
                setSelectedFiles([]);
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
    // ✅ PREVIEW SELECTED
    // ============================================
    const handlePreview = () => {
        const selected = filteredLearners.filter(l => l.selected);
        if (selected.length === 0) {
            setError('No learners selected');
            setTimeout(() => setError(null), 5000);
            return;
        }
        alert(`Preview: ${selected.length} ${pluralize(selected.length, 'learner', 'learners')} selected`);
    };

    // ============================================
    // ✅ LOAD DATA ON MOUNT
    // ============================================
    useEffect(() => {
        getUserData();
        fetchProgrammes();
    }, []);

    // ============================================
    // ✅ REFETCH WHEN FILTERS CHANGE
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
                        <h1>Bulk Certificate Issuance – By Course</h1>
                        <p>Select a programme and configure status filters to identify eligible learners. Match, preview, and dispatch standard credentials in mass.</p>
                    </div>

                    {/* Filter Section */}
                    <div className="filter-section">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Course / Programme</label>
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
                                <label>Completion Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Date Range</label>
                                <select
                                    value={selectedDateRange}
                                    onChange={(e) => setSelectedDateRange(e.target.value)}
                                >
                                    {dateRanges.map((range) => (
                                        <option key={range} value={range}>{range}</option>
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

                    {/* Bulk Upload Section */}
                    <div className="bulk-upload-section">
                        <h3>Bulk Upload Certificate PDFs</h3>
                        <p>Upload certificate PDF files. Max 50 files, 10MB each.</p>

                        <div
                            className="bulk-file-upload-area"
                            onClick={() => document.getElementById('bulkFileInput').click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i>
                            <p>Upload certificate PDF files</p>
                            <span className="upload-hint">Max 50 files, 10MB each.</span>
                            <button className="btn-select-files">
                                <i className="fas fa-file-pdf"></i> Select PDF Files
                            </button>
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

                        <div className="supported-formats">
                            Supported formats: Standard PDF/A versions
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
                                <button
                                    className="btn-deselect-all"
                                    onClick={handleDeselectAll}
                                >
                                    <i className="fas fa-times"></i> Deselect All
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
                                        <th>Programme</th>
                                        <th>Centre</th>
                                        <th>Completion Date</th>
                                        <th>Certificate Number</th>
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
                                                <td>{learner.Programme_name || 'N/A'}</td>
                                                <td>{learner.center_name || 'N/A'}</td>
                                                <td>{learner.formattedCompletionDate || 'N/A'}</td>
                                                <td className="cert-number">{learner.certNumber || 'N/A'}</td>
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
                                            <td colSpan="8" className="no-results">
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
                        <button
                            className="btn-back"
                            onClick={() => navigate('/admin-certificates')}
                        >
                            <i className="fas fa-arrow-left"></i> Back to Certificates
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
                                onClick={handleIssueBulk}
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