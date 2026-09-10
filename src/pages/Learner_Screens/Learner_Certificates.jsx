// src/pages/Learner_Screens/Learner_Certificates.jsx
import React, { useState } from "react";
import { FaDownload } from "react-icons/fa";
import Learner_Sidebar from "../../components/Learner/Learner_SideBar";
import Learner_Header from "../../components/Learner/Learner_Header";
import "../../styles/Learner/Learner_Certificates.css";

const Learner_Certificates = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeNav] = useState("certificates");

    // ---- FILTER STATE ----
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Sample certificate data — swap for a real API call once the
    // certificates endpoint exists (e.g. GET /api/learner/certificates)
    const [certificates] = useState([
        {
            id: 1,
            programme: "Digital Literacy",
            status: "Issued",
            metaLine: "Completed: 15 Nov 2025",
            certNumber: "No: IIK-DL-2025-99824",
        },
        {
            id: 2,
            programme: "Microsoft 365",
            status: "Pending",
            metaLine: "Estimated: March 2026",
            certNumber: "No: IIK-M365-Pending",
        },
    ]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // ---- FILTERING LOGIC ----
    const filteredCertificates = certificates.filter((cert) => {
        const matchesStatus = statusFilter === "All" || cert.status === statusFilter;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || cert.programme.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    const handleViewCertificate = (cert) => {
        // TODO: open the certificate viewer/modal once that flow is built
        console.log("View certificate:", cert.programme);
    };

    const handleDownloadPdf = (cert) => {
        // TODO: wire up real download (e.g. GET /api/certificates/:id/pdf)
        console.log("Download PDF for:", cert.programme);
    };

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
                            <div className="cert-no-results">No certificates match your filters.</div>
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