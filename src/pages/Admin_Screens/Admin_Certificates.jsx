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

    // Certificate Form State
    const [certificateForm, setCertificateForm] = useState({
        learner: '',
        programme: '',
        issueDate: '',
        expiryDate: '',
        neverExpires: false,
        certificateFile: null,
    });

    // Sample certificate data
    const [certificates] = useState([
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
            status: 'pending',
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

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCertificateForm({
            ...certificateForm,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCertificateForm({
                ...certificateForm,
                certificateFile: file,
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            setCertificateForm({
                ...certificateForm,
                certificateFile: file,
            });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmitCertificate = (e) => {
        e.preventDefault();
        console.log('Certificate issued:', certificateForm);
        setCertificateForm({
            learner: '',
            programme: '',
            issueDate: '',
            expiryDate: '',
            neverExpires: false,
            certificateFile: null,
        });
    };

    // Filter certificates
    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = cert.learner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || cert.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-certificates-layout">
            {/* Header */}
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={3}
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
                        {/* Left: Upload Area (resized) */}
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

                        {/* Right: Assign Certificate Details */}
                        <div className="assign-column">
                            <h3 className="assign-section-title">2. Assign Certificate Details</h3>

                            <form onSubmit={handleSubmitCertificate}>
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
                                        <option value="Digital Literacy">Digital Literacy</option>
                                        <option value="Microsoft 365">Microsoft 365</option>
                                        <option value="Digital Marketing">Digital Marketing</option>
                                        <option value="Risk & Compliance Excellence">Risk & Compliance Excellence</option>
                                        <option value="Data Analytics">Data Analytics</option>
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

                    {/* 3. Recently Issued Certificates Table */}
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
                                    {filteredCertificates.length > 0 ? (
                                        filteredCertificates.map((cert) => (
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
                                                    <button className="action-btn view-btn" title="View">
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className="action-btn edit-btn" title="Edit">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="action-btn delete-btn" title="Delete">
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
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
        </div>
    );
};

export default Admin_Certificates;