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
    const [selectedDateRange, setSelectedDateRange] = useState('Last 30 Days');
    const [selectedFiles, setSelectedFiles] = useState([]);

    // selected property to each learner
    const [selectedLearners, setSelectedLearners] = useState([
        {
            id: 1,
            name: 'Sibusiso Ndlovu',
            email: 'sibundlovu@example.com',
            completionDate: '24 Feb 2026',
            certNumber: 'CERT-2026-9024',
            status: 'Completed',
            selected: true,
        },
        {
            id: 2,
            name: 'Chantel Fourie',
            email: 'chantel.f@outlook.com',
            completionDate: '23 Feb 2026',
            certNumber: 'CERT-2026-1213',
            status: 'Completed',
            selected: true,
        },
        {
            id: 3,
            name: 'Lindiwe Khumalo',
            email: 'lindi.khumalo@mweb.co.za',
            completionDate: '25 Feb 2026',
            certNumber: 'CERT-2026-6534',
            status: 'Completed',
            selected: true,
        },
        {
            id: 4,
            name: 'Pieter de Wet',
            email: 'pieter.dewet@telkomsa.net',
            completionDate: '22 Feb 2026',
            certNumber: 'CERT-2026-9876',
            status: 'Completed',
            selected: true,
        },
        {
            id: 5,
            name: 'Fatima Patel',
            email: 'fatima.p@gmail.com',
            completionDate: '25 Feb 2026',
            certNumber: 'CERT-2026-6530',
            status: 'Completed',
            selected: true,
        },
    ]);

    const [allSelected, setAllSelected] = useState(true);

    const adminName = 'Admin User';

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 50) {
            alert('Maximum 50 files allowed');
            return;
        }
        setSelectedFiles(files);
    };


    const handleSelectAllEligible = () => {
        setSelectedLearners(prev =>
            prev.map(learner => ({
                ...learner,
                selected: true
            }))
        );
        setAllSelected(true);
    };

    // Deselect all learners
    const handleDeselectAll = () => {
        setSelectedLearners(prev =>
            prev.map(learner => ({
                ...learner,
                selected: false
            }))
        );
        setAllSelected(false);
    };


    const handleSelectLearner = (id) => {
        setSelectedLearners(prev =>
            prev.map(learner =>
                learner.id === id
                    ? { ...learner, selected: !learner.selected }
                    : learner
            )
        );
    };


    const handleSelectAll = () => {
        const allChecked = !allSelected;
        setAllSelected(allChecked);
        setSelectedLearners(prev =>
            prev.map(learner => ({
                ...learner,
                selected: allChecked
            }))
        );
    };

    //  Count selected learners
    const selectedCount = selectedLearners.filter(l => l.selected).length;

    const programmes = ['Digital Literacy', 'Microsoft 365', 'Digital Marketing', 'Risk & Compliance Excellence', 'Data Analytics'];
    const statusOptions = ['All', 'Completed', 'In Progress', 'Pending', 'Not Started'];
    const dateRanges = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last Year'];

    return (
        <div className="admin-bulkupload-layout">
            {/* Header */}
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={3}
            />

            <div className="admin-bulkupload-body">
                {/* Sidebar */}
                <Admin_Sidebar
                    active="certificates"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                {/* Main Content */}
                <main className="admin-bulkupload-content">
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
                                    {programmes.map((prog) => (
                                        <option key={prog} value={prog}>{prog}</option>
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
                                <button className="btn-apply-filters">
                                    <i className="fas fa-filter"></i> Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Upload Section */}
                    <div className="bulk-upload-section">
                        <h3>Bulk Upload Certificate PDFs</h3>
                        <p>Upload certificate PDF files. Max 50 files, 10MB each. Filename must match recipient emails.</p>

                        <div
                            className="bulk-file-upload-area"
                            onClick={() => document.getElementById('bulkFileInput').click()}
                        >
                            <i className="fas fa-cloud-upload-alt"></i>
                            <p>Upload certificate PDF files</p>
                            <span className="upload-hint">Max 50 files, 10MB each.</span>
                            <span className="upload-hint">Filename must match recipient emails.</span>
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
                            <h3>Filtered Recipient Preview & Verification</h3>
                            <div className="preview-actions">
                                <span className="selected-count">{selectedCount} Selected</span>
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
                                                checked={allSelected}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>Learner Name</th>
                                        <th>Email</th>
                                        <th>Completion Date</th>
                                        <th>Certificate Number</th>
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
                                            <td className="cert-number">{learner.certNumber}</td>
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
                        <button
                            className="btn-back"
                            onClick={() => navigate('/admin-certificates')}
                        >
                            <i className="fas fa-arrow-left"></i> Back to Certificates
                        </button>
                        <div className="bulk-actions-right">
                            <button className="btn-preview">
                                <i className="fas fa-eye"></i> Preview Selected ({selectedCount})
                            </button>
                            <button className="btn-issue-bulk">
                                <i className="fas fa-certificate"></i> Issue Certificates ({selectedCount})
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Admin_BulkUpload;