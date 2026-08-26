// src/pages/Admin_Screens/Admin_Learners.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Already imported
import Admin_Sidebar from "../../components/Admin/Admin_Sidebar";
import Admin_Header from "../../components/Admin/Admin_Header";
import "../../styles/Admin/Admin_Learners.css";

const Admin_Learners = () => {
  // ✅ Initialize useNavigate here (this was missing!)
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav] = useState("learners");

  // Sample learner data
  const learners = [
    {
      name: "Sibusiso Ndlovu",
      email: "sibundlo.",
      phone: "+27 82 456 7890",
      programme: "Digital Marketing",
      date: "Jan 12, 2026",
      status: "Active",
    },
    {
      name: "Chanel Fourie",
      email: "chanelf.",
      phone: "+27 71 890 1234",
      programme: "Digital Literacy",
      date: "Jan 15, 2026",
      status: "Completed",
    },
    {
      name: "Lindlwe Khumalo",
      email: "lindluh.",
      phone: "+27 83 234 5678",
      programme: "Microsoft 365",
      date: "Feb 02, 2026",
      status: "Active",
    },
    {
      name: "David Botha",
      email: "davidbot.",
      phone: "+27 82 789 0123",
      programme: "Digital Marketing",
      date: "Feb 10, 2026",
      status: "Inactive",
    },
    {
      name: "Fatima Patel",
      email: "fatima.p.",
      phone: "+27 61 345 6789",
      programme: "Digital Literacy",
      date: "Feb 14, 2026",
      status: "Active",
    },
    {
      name: "Thabo Mokoena",
      email: "thabom.",
      phone: "+27 73 901 2345",
      programme: "Microsoft 365",
      date: "Feb 22, 2026",
      status: "Completed",
    },
    {
      name: "Zanele Disarmi",
      email: "zanele.d.",
      phone: "+27 82 567 8901",
      programme: "Digital Marketing",
      date: "Mar 01, 2026",
      status: "Active",
    },
    {
      name: "Johan Smuts",
      email: "johanam.",
      phone: "+27 79 123 4567",
      programme: "Digital Literacy",
      date: "Mar 05, 2026",
      status: "Active",
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const stats = [
    { label: "Total Learners", value: 247 },
    { label: "Active Enrolments", value: 198 },
    { label: "Completed Programmes", value: 49 },
  ];

  return (
    <div className="admin-learners-layout">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="admin-learners-body">
        <Admin_Sidebar
          active={activeNav}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <div className="admin-learners-content">
          {/* Page Header */}
          <div className="admin-learners-header">
            <h1>Learner Management</h1>
            <p>
              Manage corporate professionals, track enrolment progression, and
              monitor profile accessibility.
            </p>
          </div>

          {/* Stats */}
          <div className="admin-learners-stats">
            {stats.map((stat, index) => (
              <div className="admin-learners-stat-card" key={index}>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Toolbar – now includes "Interested Learners" button */}
          <div className="admin-learners-toolbar">
            <div className="toolbar-left">
              <button className="btn-outline">Export Records</button>
              <button
                className="btn-solid"
                onClick={() => navigate("/admin/interested-learners")}
              >
                Interested Learners
              </button>
            </div>
            <div className="toolbar-right">
              <select className="filter-select">
                <option>Prog: All</option>
                <option>Digital Literacy</option>
                <option>Microsoft 365</option>
                <option>Digital Marketing</option>
              </select>
              <select className="filter-select">
                <option>Status: All</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Inactive</option>
              </select>
              <input
                type="text"
                placeholder="Search name or email..."
                className="search-input"
              />
            </div>
          </div>

          {/* Table */}
          <div className="admin-learners-table-wrapper">
            <table className="admin-learners-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>PROGRAMME</th>
                  <th>ENROLMENT DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner, index) => (
                  <tr key={index}>
                    <td>{learner.name}</td>
                    <td>{learner.email}</td>
                    <td>{learner.phone}</td>
                    <td>{learner.programme}</td>
                    <td>{learner.date}</td>
                    <td>
                      <span
                        className={`status-badge ${learner.status.toLowerCase()}`}
                      >
                        {learner.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn edit">Edit</button>
                      <button className="action-btn deactivate">
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-learners-pagination">
            <button className="pagination-btn prev">Previous</button>
            <span className="pagination-numbers">
              <button className="pagination-num active">1</button>
              <button className="pagination-num">2</button>
            </span>
            <button className="pagination-btn next">Next</button>
          </div>

          {/* POPIA Notice */}
          <div className="admin-learners-notice">
            <p>
              <strong>POPIA Compliance Notice:</strong> Under South African
              Protection of Personal Information Act rules, this database is
              restricted to authorised credentials management. Deactivation
              obscures public-facing records immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin_Learners;