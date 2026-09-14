// src/pages/Learner_Screens/Learner_Certificates.jsx
import React, { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";
import Learner_Sidebar from "../../components/Learner/Learner_SideBar";
import Learner_Header from "../../components/Learner/Learner_Header";
import "../../styles/Learner/Learner_Certificates.css";
import api from "../../services/api";

const Learner_Certificates = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeNav] = useState("certificates");

    // ---- FILTER STATE ----
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // ---- DATA STATE ----
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // ============================================
    // FORMAT DATE
    // ============================================
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // ============================================
    // FETCH CERTIFICATES
    // ============================================
    const fetchCertificates = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                setError('You are not signed in. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await api.get('/learner/certificates');

            if (response.data.success) {
                const raw = response.data.data || [];
                const mapped = raw.map((c) => ({
                    id: c.id || c.certificateId,
                    certificateId: c.certificateId || c.id,
                    programme: c.programme || 'Unknown Programme',
                    status: c.status || 'Issued',
                    metaLine: c.dateIssued
                        ? `Issued: ${formatDate(c.dateIssued)}`
                        : 'Issued',
                    certNumber: c.certificateNumber
                        ? `No: ${c.certificateNumber}`
                        : `No: CERT-${c.certificateId || c.id}`
                }));
                setCertificates(mapped);
            } else {
                setError(response.data.message || 'Failed to load certificates');
            }
        } catch (err) {
            console.error('Error fetching certificates:', err);
            setError(
                err.response?.data?.message ||
                'Failed to load certificates. Please try again later.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    // ---- FILTERING LOGIC ----
    const filteredCertificates = certificates.filter((cert) => {
        const matchesStatus = statusFilter === "All" || cert.status === statusFilter;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || cert.programme.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    // ============================================
    // VIEW CERTIFICATE - opens the PDF in a new tab
    // ============================================
    const handleViewCertificate = async (cert) => {
        try {
            const response = await api.get(
                `/learner/certificates/${cert.certificateId}/download`,
                { responseType: 'blob' }
            );

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            window.open(url, '_blank');

            // Release the blob URL after the new tab has had time to load it
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error('Error viewing certificate:', err);
            alert('Could not open the certificate. Please try again.');
        }
    };

    // ============================================
    // DOWNLOAD CERTIFICATE AS PDF
    // ============================================
    const handleDownloadPdf = async (cert) => {
        try {
            const response = await api.get(
                `/learner/certificates/${cert.certificateId}/download`,
                { responseType: 'blob' }
            );

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `Certificate_${cert.programme.replace(/\s/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading certificate:', err);
            alert('Could not download the certificate. Please try again.');
        }
    };

    // ---- LOADING STATE (keeps the same page shell) ----
    if (loading) {
        return (
            <div className="learner-certificates-layout">
                <Learner_Header
                    onMenuToggle={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                />

                <div className="learner-certificates-body">
                    <Learner_Sidebar
                        active={activeNav}
                        isMobileOpen={isMobileMenuOpen}
                        onClose={closeMobileMenu}
                    />

                    <div className="learner-certificates-content">
                        <div className="learner-certificates-header">
                            <h1>My Certificates</h1>
                            <p>View, verify, and download your accredited academic certificates.</p>
                        </div>
                        <div className="cert-no-results">Loading your certificates...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="learner-certificates-layout">
            <Learner_Header
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
            />

            <div className="learner-certificates-body">
                <Learner_Sidebar
                    active={activeNav}
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <div className="learner-certificates-content">
                    {/* Page Header */}
                    <div className="learner-certificates-header">
                        <h1>My Certificates</h1>
                        <p>View, verify, and download your accredited academic certificates.</p>
                    </div>

                    {/* Error banner (only if the API call failed) */}
                    {error && (
                        <div className="cert-no-results" style={{ color: '#dc3545' }}>
                            {error}
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="learner-certificates-toolbar">
                        <input
                            type="text"
                            placeholder="Search certificates..."
                            className="cert-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                            className="cert-status-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">Status: All</option>
                            <option value="Issued">Issued</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>

                    {/* Certificate Cards */}
                    <div className="learner-certificates-grid">
                        {filteredCertificates.length === 0 ? (
                            <div className="cert-no-results">
                                {certificates.length === 0
                                    ? "You don't have any certificates yet."
                                    : "No certificates match your filters."}
                            </div>
                        ) : (
                            filteredCertificates.map((cert) => {
                                const isIssued = cert.status === "Issued";
                                return (
                                    <div className="cert-card" key={cert.id}>
                                        <div className={`cert-preview ${isIssued ? "" : "unavailable"}`}>
                                            <span>{isIssued ? "CERTIFICATE PREVIEW" : "NOT AVAILABLE YET"}</span>
                                        </div>

                                        <div className="cert-card-body">
                                            <div className="cert-card-title-row">
                                                <h3>{cert.programme}</h3>
                                                <span className={`cert-badge ${isIssued ? "issued" : "pending"}`}>
                                                    {cert.status}
                                                </span>
                                            </div>

                                            <p className="cert-meta-line">{cert.metaLine}</p>
                                            <p className="cert-number-line">{cert.certNumber}</p>

                                            {isIssued ? (
                                                <div className="cert-card-actions">
                                                    <button
                                                        className="cert-btn view"
                                                        onClick={() => handleViewCertificate(cert)}
                                                    >
                                                        View Certificate
                                                    </button>
                                                    <button
                                                        className="cert-btn pdf"
                                                        onClick={() => handleDownloadPdf(cert)}
                                                        aria-label="Download PDF"
                                                    >
                                                        <FaDownload />
                                                        <span>PDF</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="cert-card-actions">
                                                    <button className="cert-btn in-progress" disabled>
                                                        In Progress
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer notice */}
                    <div className="learner-certificates-notice">
                        <p>Complete more programmes to earn additional certificates.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Learner_Certificates;