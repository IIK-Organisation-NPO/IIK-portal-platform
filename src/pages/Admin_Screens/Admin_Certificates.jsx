// src/pages/Admin_Screens/Admin_Certificates.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Header from '../../components/Admin/Admin_Header';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import '../../styles/Admin/Admin_Certificates.css';
import api from '../../services/api';

const Admin_Certificates = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [adminName, setAdminName] = useState('Admin');

    // Certificate Form State
    const [certificateForm, setCertificateForm] = useState({
        learner_id: '',
        programme_id: '',
        learner_name: '',
        programme_name: '',
        issueDate: '',
        expiryDate: '',
        neverExpires: false,
        certificateFile: null,
    });

    // Certificate data from database
    const [certificates, setCertificates] = useState([]);
    const [learners, setLearners] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCertificate, setDeletingCertificate] = useState(null);
    const [viewPdfUrl, setViewPdfUrl] = useState('');

    const navigate = useNavigate();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
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
    // FORMAT DATE - FIXED
    // ============================================
    const formatDate = (dateString) => {
        if (!dateString) {
            return 'N/A';
        }
        
        try {
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const parts = dateString.split('-');
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months[parseInt(parts[1]) - 1];
                const day = parseInt(parts[2]);
                const year = parseInt(parts[0]);
                return `${month} ${day}, ${year}`;
            }
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'N/A';
            }
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'N/A';
        }
    };

    // ============================================
    // FORMAT DATE FOR INPUT (YYYY-MM-DD)
    // ============================================
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            return '';
        }
    };

    // ============================================
    // FETCH CERTIFICATES FROM DATABASE
    // ============================================
    const fetchCertificates = async () => {
        try {
            const response = await api.get('/admin/certificates');
            if (response.data.success) {
                const formattedCerts = response.data.data.map((cert) => {
                    let formattedDate = 'N/A';
                    if (cert.Date_issued) {
                        formattedDate = formatDate(cert.Date_issued);
                    }
                    
                    return {
                        ...cert,
                        formattedDate: formattedDate,
                        certificateNumber: cert.Certificate_id || 'N/A',
                        status: 'Active'
                    };
                });
                setCertificates(formattedCerts);
            }
        } catch (err) {
            console.error('Error fetching certificates:', err);
        }
    };

    // ============================================
    // FETCH LEARNERS FROM DATABASE
    // ============================================
    const fetchLearners = async () => {
        try {
            const response = await api.get('/admin/learners?limit=1000');
            if (response.data.success) {
                setLearners(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching learners:', err);
        }
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
        }
    };

    // ============================================
    // FETCH ALL DATA
    // ============================================
    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            await Promise.all([
                fetchCertificates(),
                fetchLearners(),
                fetchProgrammes()
            ]);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again.');
            setLoading(false);
        }
    };

    // ============================================
    // UPLOAD CERTIFICATE WITH FILE
    // ============================================
    const uploadCertificate = async (formData) => {
        try {
            const response = await api.post('/admin/certificates/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (err) {
            console.error('Error uploading certificate:', err);
            throw err;
        }
    };

    // ============================================
    // HANDLE FORM CHANGE
    // ============================================
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'learner_id') {
            const selectedLearner = learners.find(l => l.id === parseInt(value));
            setCertificateForm({
                ...certificateForm,
                learner_id: value,
                learner_name: selectedLearner ? `${selectedLearner.name} ${selectedLearner.surname}` : ''
            });
        } else if (name === 'programme_id') {
            const selectedProgramme = programmes.find(p => p.Programme_id === parseInt(value));
            setCertificateForm({
                ...certificateForm,
                programme_id: value,
                programme_name: selectedProgramme ? selectedProgramme.Programme_name : ''
            });
        } else if (name === 'neverExpires') {
            setCertificateForm({
                ...certificateForm,
                [name]: checked,
                expiryDate: checked ? '' : certificateForm.expiryDate
            });
        } else {
            setCertificateForm({
                ...certificateForm,
                [name]: type === 'checkbox' ? checked : value,
            });
        }
    };

    // ============================================
    // HANDLE FILE CHANGE
    // ============================================
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a PDF, JPEG, or PNG file');
                setTimeout(() => setError(null), 5000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                setTimeout(() => setError(null), 5000);
                return;
            }
            setCertificateForm({
                ...certificateForm,
                certificateFile: file,
            });
        }
    };

    // ============================================
    // HANDLE DROP
    // ============================================
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a PDF, JPEG, or PNG file');
                setTimeout(() => setError(null), 5000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                setTimeout(() => setError(null), 5000);
                return;
            }
            setCertificateForm({
                ...certificateForm,
                certificateFile: file,
            });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // ============================================
    // HANDLE SUBMIT CERTIFICATE
    // ============================================
    const handleSubmitCertificate = async (e) => {
        e.preventDefault();
        
        if (!certificateForm.learner_id) {
            setError('Please select a learner');
            setTimeout(() => setError(null), 5000);
            return;
        }
        if (!certificateForm.programme_id) {
            setError('Please select a programme');
            setTimeout(() => setError(null), 5000);
            return;
        }
        if (!certificateForm.issueDate) {
            setError('Please select an issue date');
            setTimeout(() => setError(null), 5000);
            return;
        }
        if (!certificateForm.certificateFile) {
            setError('Please upload a certificate file (PDF, JPEG, or PNG)');
            setTimeout(() => setError(null), 5000);
            return;
        }

        try {
            setSubmitting(true);
            
            const formData = new FormData();
            formData.append('user_id', certificateForm.learner_id);
            formData.append('programme_id', certificateForm.programme_id);
            formData.append('issue_date', certificateForm.issueDate);
            formData.append('expiry_date', certificateForm.neverExpires ? '' : certificateForm.expiryDate);
            formData.append('certificateFile', certificateForm.certificateFile);

            const result = await uploadCertificate(formData);
            
            if (result.success) {
                setSuccessMessage('Certificate issued and uploaded successfully!');
                setTimeout(() => setSuccessMessage(''), 5000);
                
                setCertificateForm({
                    learner_id: '',
                    programme_id: '',
                    learner_name: '',
                    programme_name: '',
                    issueDate: '',
                    expiryDate: '',
                    neverExpires: false,
                    certificateFile: null,
                });
                
                const fileInput = document.getElementById('fileInput');
                if (fileInput) fileInput.value = '';
                
                await fetchCertificates();
            } else {
                setError(result.message || 'Failed to issue certificate');
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error('Error issuing certificate:', err);
            setError(err.response?.data?.message || 'Failed to issue certificate');
            setTimeout(() => setError(null), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================
    // HANDLE DELETE CERTIFICATE - Opens Confirmation Modal
    // ============================================
    const handleDeleteClick = (cert) => {
        setDeletingCertificate(cert);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingCertificate) return;
        
        try {
            const result = await api.delete(`/admin/certificates/${deletingCertificate.Certificate_id}`);
            if (result.data.success) {
                setSuccessMessage('Certificate deleted successfully!');
                setTimeout(() => setSuccessMessage(''), 5000);
                setShowDeleteModal(false);
                setDeletingCertificate(null);
                await fetchCertificates();
            } else {
                setError(result.data.message || 'Failed to delete certificate');
                setTimeout(() => setError(null), 5000);
                setShowDeleteModal(false);
                setDeletingCertificate(null);
            }
        } catch (err) {
            console.error('Error deleting certificate:', err);
            setError('Failed to delete certificate');
            setTimeout(() => setError(null), 5000);
            setShowDeleteModal(false);
            setDeletingCertificate(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setDeletingCertificate(null);
    };

    // ============================================
    // HANDLE VIEW CERTIFICATE
    // ============================================
    const handleViewCertificate = (cert) => {
        setSelectedCertificate(cert);
        const url = `${api.defaults.baseURL}/admin/certificates/view/${cert.Certificate_id}`;
        setViewPdfUrl(url);
        setShowViewModal(true);
    };

    // ============================================
    // HANDLE EDIT CERTIFICATE - Opens Edit Modal
    // ============================================
    const handleEditCertificate = (cert) => {
        setSelectedCertificate(cert);
        setShowEditModal(true);
    };

// ============================================
// HANDLE UPDATE CERTIFICATE - FIXED
// ============================================
const handleUpdateCertificate = async (e) => {
    e.preventDefault();
    
    //  DEBUG: See what's being sent
    console.log('🔍 selectedCertificate:', selectedCertificate);
    console.log('🔍 Certificate_id:', selectedCertificate?.Certificate_id);
    console.log('🔍 Programme_id:', selectedCertificate?.Programme_id);
    console.log('🔍 Expire_date:', selectedCertificate?.Expire_date);
    
    try {
        //  FIXED: Include Programme_id in the update data
        const updateData = {
            Programme_id: selectedCertificate.Programme_id,
            Expire_date: selectedCertificate.neverExpires ? null : selectedCertificate.Expire_date,
            neverExpires: selectedCertificate.neverExpires || false
        };

        console.log('📤 Sending to backend:', updateData);
        console.log('📤 URL:', `/admin/certificates/${selectedCertificate.Certificate_id}`);

        const response = await api.put(
            `/admin/certificates/${selectedCertificate.Certificate_id}`, 
            updateData
        );
        
        console.log('📥 Backend response:', response.data);
        
        if (response.data.success) {
            setSuccessMessage('Certificate updated successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
            setShowEditModal(false);
            setSelectedCertificate(null);
            await fetchCertificates();
        }
    } catch (err) {
        console.error(' Error updating certificate:', err);
        console.error(' Error response:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to update certificate');
        setTimeout(() => setError(null), 5000);
    }
};

    // ============================================
    // LOAD DATA ON MOUNT
    // ============================================
    useEffect(() => {
        getUserData();
        fetchAllData();
    }, []);

    // ============================================
    // GET STATUS CLASS
    // ============================================
    const getStatusClass = (status) => {
        if (!status) return 'active';
        const statusLower = status.toLowerCase();
        if (statusLower === 'issued' || statusLower === 'active') return 'issued';
        if (statusLower === 'pending') return 'pending';
        if (statusLower === 'revoked') return 'revoked';
        if (statusLower === 'expired') return 'expired';
        return 'active';
    };

    // ============================================
    // GET STATUS LABEL
    // ============================================
    const getStatusLabel = (status) => {
        if (!status) return 'Active';
        const statusLower = status.toLowerCase();
        if (statusLower === 'issued' || statusLower === 'active') return 'Issued';
        if (statusLower === 'pending') return 'Pending';
        if (statusLower === 'revoked') return 'Revoked';
        if (statusLower === 'expired') return 'Expired';
        return status;
    };

    // ============================================
    // FILTER CERTIFICATES
    // ============================================
    const filteredCertificates = certificates.filter(cert => {
        const learnerName = `${cert.learner_name || ''} ${cert.learner_surname || ''}`.toLowerCase();
        const matchesSearch = learnerName.includes(searchTerm.toLowerCase()) ||
            (cert.certificateNumber && String(cert.certificateNumber).toLowerCase().includes(searchTerm.toLowerCase()));
        
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            const certStatus = (cert.status || 'Active').toLowerCase();
            matchesStatus = certStatus === statusFilter.toLowerCase() ||
                            (statusFilter === 'issued' && certStatus === 'active') ||
                            (statusFilter === 'active' && certStatus === 'issued');
        }
        
        return matchesSearch && matchesStatus;
    });

    // Loading state
    if (loading && certificates.length === 0) {
        return (
            <div className="admin-certificates-layout">
                <Admin_Header
                    adminName={adminName}
                    onMenuToggle={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                    notificationCount={0}
                />
                <div className="admin-certificates-body">
                    <Admin_Sidebar
                        active="certificates"
                        isMobileOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                    />
                    <main className="admin-certificates-content">
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
                            <p>Loading certificates...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-certificates-layout">
            {/* Header */}
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={0}
            />

            <div className="admin-certificates-body">
                {/* Sidebar */}
                <Admin_Sidebar
                    active="certificates"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                {/* Main Content */}
                <main className="admin-certificates-content">
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

                    {/* 1. Page Header with Action Buttons */}
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

                    {/* 2. Upload & Assign - Side by Side */}
                    <div className="certificates-two-column">
                        {/* Left: Upload Area */}
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
                                        <p>Drag and drop certificate file</p>
                                        <span className="file-upload-hint">PDF, JPEG, PNG (Max 10MB)</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Right: Assign Certificate Details */}
                        <div className="assign-column">
                            <h3 className="assign-section-title">2. Assign Certificate Details</h3>

                            <form onSubmit={handleSubmitCertificate}>
                                <div className="assign-form-group">
                                    <label>Select Learner Profile</label>
                                    <select
                                        name="learner_id"
                                        value={certificateForm.learner_id}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select a learner...</option>
                                        {learners.map((learner) => (
                                            <option key={learner.id} value={learner.id}>
                                                {learner.name} {learner.surname} - {learner.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="assign-form-group">
                                    <label>Academic Programme</label>
                                    <select
                                        name="programme_id"
                                        value={certificateForm.programme_id}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Select a programme...</option>
                                        {programmes.map((programme) => (
                                            <option key={programme.Programme_id} value={programme.Programme_id}>
                                                {programme.Programme_name}
                                            </option>
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

                                <button 
                                    type="submit" 
                                    className="btn-assign-certificate"
                                    disabled={submitting}
                                >
                                    <i className="fas fa-certificate"></i> 
                                    {submitting ? 'Issuing...' : 'Assign & Issue Certificate'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 3. Recently Issued Certificates Table */}
                    <div className="certificates-table-wrapper">
                        <div className="table-header">
                            <h3>
                                Recently Issued Certificates 
                                <span style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 'normal', 
                                    color: '#666',
                                    marginLeft: '10px'
                                }}>
                                    ({filteredCertificates.length} {filteredCertificates.length === 1 ? 'certificate' : 'certificates'})
                                </span>
                            </h3>
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
                                    {filteredCertificates.length > 0 ? (
                                        filteredCertificates.map((cert) => {
                                            const statusDisplay = getStatusLabel(cert.status);
                                            const statusClass = getStatusClass(cert.status);
                                            
                                            return (
                                                <tr key={cert.Certificate_id}>
                                                    <td className="certificate-no">
                                                        {cert.certificateNumber || cert.Certificate_id || 'N/A'}
                                                    </td>
                                                    <td className="certificate-learner">
                                                        {cert.learner_name || ''} {cert.learner_surname || ''}
                                                    </td>
                                                    <td className="certificate-programme">
                                                        {cert.Programme_name || cert.programme_name || 'N/A'}
                                                    </td>
                                                    <td className="certificate-date">
                                                        {cert.formattedDate}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${statusClass}`}>
                                                            {statusDisplay}
                                                        </span>
                                                    </td>
                                                    <td className="certificate-actions">
                                                        <button 
                                                            className="action-btn view-btn" 
                                                            title="View Certificate"
                                                            onClick={() => handleViewCertificate(cert)}
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button 
                                                            className="action-btn edit-btn" 
                                                            title="Edit"
                                                            onClick={() => handleEditCertificate(cert)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button 
                                                            className="action-btn delete-btn" 
                                                            title="Delete"
                                                            onClick={() => handleDeleteClick(cert)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="no-results">
                                                <i className="fas fa-search"></i>
                                                <p>No certificates found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* ===== VIEW CERTIFICATE MODAL ===== */}
            {showViewModal && selectedCertificate && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
                        <h2 style={{ marginBottom: '8px' }}>
                            <i className="fas fa-file-pdf" style={{ color: '#dc3545', marginRight: '10px' }}></i>
                            Certificate - {selectedCertificate.certificateNumber}
                        </h2>
                        <p>{selectedCertificate.learner_name} {selectedCertificate.learner_surname || ''}</p>
                        
                        <div style={{ 
                            width: '100%', 
                            height: '500px', 
                            marginBottom: '20px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#f5f5f5'
                        }}>
                            <iframe
                                src={viewPdfUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                                title="Certificate PDF"
                            />
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="modal-btn cancel-btn" 
                                onClick={() => window.open(viewPdfUrl, '_blank')}
                            >
                                <i className="fas fa-download"></i> Download
                            </button>
                            <button 
                                className="modal-btn confirm-btn" 
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== EDIT CERTIFICATE MODAL - WITH FULL EDIT FORM ===== */}
{showEditModal && selectedCertificate && (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Certificate</h2>
            <p>Update the certificate details below.</p>
            
            <div className="modal-details">
                <div className="detail-row">
                    <span className="detail-label">Certificate No:</span>
                    <span className="detail-value">{selectedCertificate.certificateNumber}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Learner:</span>
                    <input
                        type="text"
                        value={selectedCertificate.learner_name 
                            ? `${selectedCertificate.learner_name} ${selectedCertificate.learner_surname || ''}`.trim() 
                            : ''}
                        className="modal-input"
                        onChange={(e) => {
                            const [firstName, ...rest] = e.target.value.split(' ');
                            setSelectedCertificate({
                                ...selectedCertificate,
                                learner_name: firstName || '',
                                learner_surname: rest.join(' ') || ''
                            });
                        }}
                    />
                </div>
                <div className="detail-row">
    <span className="detail-label">Programme:</span>
    <select
        value={selectedCertificate.Programme_id || ''}
        className="modal-input"
        onChange={(e) => {
            const selectedProg = programmes.find(
                p => p.Programme_id === parseInt(e.target.value)
            );
            setSelectedCertificate({
                ...selectedCertificate,
                Programme_id: selectedProg ? selectedProg.Programme_id : '',
                Programme_name: selectedProg ? selectedProg.Programme_name : ''
            });
        }}
    >
        <option value="">Select a programme...</option>
        {programmes.map((programme) => (
            <option key={programme.Programme_id} value={programme.Programme_id}>
                {programme.Programme_name}
            </option>
        ))}
    </select>
</div>
                <div className="detail-row">
                    <span className="detail-label">Issue Date:</span>
                    <input
                        type="date"
                        value={selectedCertificate.Date_issued ? formatDateForInput(selectedCertificate.Date_issued) : ''}
                        className="modal-input"
                        onChange={(e) => setSelectedCertificate({
                            ...selectedCertificate,
                            Date_issued: e.target.value
                        })}
                    />
                </div>
                <div className="detail-row">
                    <span className="detail-label">Expiry Date:</span>
                    <input
                        type="date"
                        value={selectedCertificate.Expire_date ? formatDateForInput(selectedCertificate.Expire_date) : ''}
                        className="modal-input"
                        onChange={(e) => setSelectedCertificate({
                            ...selectedCertificate,
                            Expire_date: e.target.value
                        })}
                        disabled={selectedCertificate.neverExpires}
                    />
                </div>
                <div className="detail-row" style={{ borderBottom: 'none', justifyContent: 'flex-end' }}>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={selectedCertificate.neverExpires || false}
                            onChange={(e) => setSelectedCertificate({
                                ...selectedCertificate,
                                neverExpires: e.target.checked,
                                Expire_date: e.target.checked ? '' : selectedCertificate.Expire_date
                            })}
                        />
                        Never Expires
                    </label>
                </div>
            </div>

            <div className="modal-actions">
                <button 
                    className="modal-btn cancel-btn" 
                    onClick={() => setShowEditModal(false)}
                >
                    Cancel
                </button>
                <button 
                    className="modal-btn confirm-btn" 
                    onClick={handleUpdateCertificate}
                >
                    Save Changes
                </button>
            </div>
        </div>
    </div>
)}
            {/* ===== DELETE CONFIRMATION MODAL - NEW DESIGN ===== */}
            {showDeleteModal && deletingCertificate && (
                <div className="modal-overlay" onClick={handleDeleteCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirm Deletion</h2>
                        <p>Are you sure you want to delete this certificate?</p>
                        
                        <div className="modal-details">
                            <div className="detail-row">
                                <span className="detail-label">Certificate No:</span>
                                <span className="detail-value">{deletingCertificate.certificateNumber}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Learner:</span>
                                <span className="detail-value">
                                    {deletingCertificate.learner_name} {deletingCertificate.learner_surname || ''}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Programme:</span>
                                <span className="detail-value">
                                    {deletingCertificate.Programme_name || deletingCertificate.programme_name || 'N/A'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Issue Date:</span>
                                <span className="detail-value">{deletingCertificate.formattedDate}</span>
                            </div>
                            <div className="detail-row" style={{ borderBottom: 'none' }}>
                                <span className="detail-label">Status:</span>
                                <span className="detail-value">{getStatusLabel(deletingCertificate.status)}</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="modal-btn cancel-btn" 
                                onClick={handleDeleteCancel}
                            >
                                Cancel
                            </button>
                            <button 
                                className="modal-btn confirm-btn" 
                                onClick={handleDeleteConfirm}
                            >
                                Yes, Delete
                            </button>
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
                .status-badge.status-issued {
                    background: #d4edda;
                    color: #155724;
                }
                .status-badge.status-active {
                    background: #d4edda;
                    color: #155724;
                }
                .status-badge.status-pending {
                    background: #fff3cd;
                    color: #856404;
                }
                .status-badge.status-revoked {
                    background: #f8d7da;
                    color: #721c24;
                }
                .status-badge.status-expired {
                    background: #f8d7da;
                    color: #721c24;
                }
                .action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .action-btn.view-btn {
                    color: #17a2b8;
                }
                .action-btn.view-btn:hover {
                    background: #e2f0f2;
                }
                .action-btn.edit-btn {
                    color: #ffc107;
                }
                .action-btn.edit-btn:hover {
                    background: #fff3cd;
                }
                .action-btn.delete-btn {
                    color: #dc3545;
                }
                .action-btn.delete-btn:hover {
                    background: #f8d7da;
                }
            `}</style>
        </div>
    );
};

export default Admin_Certificates;