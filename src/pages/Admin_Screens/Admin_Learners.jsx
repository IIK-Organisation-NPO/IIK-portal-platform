// src/pages/Admin_Screens/Admin_Learners.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Admin_Sidebar from "../../components/Admin/Admin_Sidebar";
import Admin_Header from "../../components/Admin/Admin_Header";
import "../../styles/Admin/Admin_Learners.css";

const Admin_Learners = () => {
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNav] = useState("learners");
  
  // State for edit mode - tracks which row is being edited (by index)
  const [editingIndex, setEditingIndex] = useState(null);
  
  // State for edited learner data
  const [editedLearner, setEditedLearner] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // State for deactivate confirmation modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null); // Stores the index of learner to deactivate
  
  // State to track which learner is being deactivated (for visual feedback)
  const [deactivatingIndex, setDeactivatingIndex] = useState(null);

  // Sample learner data
  const [learners, setLearners] = useState([
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
  ]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const stats = [
    { label: "Total Learners", value: learners.length },
    { label: "Active Enrolments", value: learners.filter(l => l.status === "Active").length },
    { label: "Completed Programmes", value: learners.filter(l => l.status === "Completed").length },
  ];

  // Handle Edit button click - enables editing mode for a specific row
  const handleEditClick = (index) => {
    setEditingIndex(index);
    // Pre-fill the edit form with current learner data
    setEditedLearner({
      name: learners[index].name,
      email: learners[index].email,
      phone: learners[index].phone
    });
  };

  // Handle Cancel edit - exits editing mode without saving changes
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedLearner({
      name: '',
      email: '',
      phone: ''
    });
  };

  // Handle Save edit - saves the changes made to the learner
  const handleSaveEdit = (index) => {
    const updatedLearners = [...learners];
    updatedLearners[index] = {
      ...updatedLearners[index],
      name: editedLearner.name,
      email: editedLearner.email,
      phone: editedLearner.phone
    };
    setLearners(updatedLearners);
    setEditingIndex(null); // Exit edit mode after saving
    setEditedLearner({
      name: '',
      email: '',
      phone: ''
    });
  };

  // Handle input changes in the edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLearner({
      ...editedLearner,
      [name]: value
    });
  };

  // Open deactivate confirmation modal
  const handleDeactivateClick = (index) => {
    setDeactivateTarget(index);
    setShowDeactivateModal(true);
  };

  // Confirm deactivation - changes status to Inactive, shows visual feedback, then removes after 3 seconds
  const confirmDeactivate = () => {
    if (deactivateTarget !== null) {
      // First, update the status to Inactive
      const updatedLearners = [...learners];
      updatedLearners[deactivateTarget] = {
        ...updatedLearners[deactivateTarget],
        status: "Inactive"
      };
      setLearners(updatedLearners);
      
      // Set the deactivating index to show visual feedback (row will highlight)
      setDeactivatingIndex(deactivateTarget);
      
      // Close the modal
      setShowDeactivateModal(false);
      
      // After 3 seconds, remove the deactivated learner from the list
      setTimeout(() => {
        // Filter out the deactivated learner
        const filteredLearners = learners.filter((_, index) => index !== deactivateTarget);
        setLearners(filteredLearners);
        setDeactivatingIndex(null); // Clear the deactivating state
        setDeactivateTarget(null); // Clear the target
      }, 3000); // 3 seconds delay
    }
  };

  // Close deactivate modal without deactivating
  const cancelDeactivate = () => {
    setShowDeactivateModal(false);
    setDeactivateTarget(null);
  };

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

          {/* Toolbar */}
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
                  <tr 
                    key={index} 
                    className={deactivatingIndex === index ? "deactivating-row" : ""}
                  >
                    {/* Name column - editable when in edit mode */}
                    <td>
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="name"
                          value={editedLearner.name}
                          onChange={handleInputChange}
                          className="edit-input"
                          placeholder="Enter name"
                        />
                      ) : (
                        learner.name
                      )}
                    </td>
                    
                    {/* Email column - editable when in edit mode */}
                    <td>
                      {editingIndex === index ? (
                        <input
                          type="email"
                          name="email"
                          value={editedLearner.email}
                          onChange={handleInputChange}
                          className="edit-input"
                          placeholder="Enter email"
                        />
                      ) : (
                        learner.email
                      )}
                    </td>
                    
                    {/* Phone column - editable when in edit mode */}
                    <td>
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="phone"
                          value={editedLearner.phone}
                          onChange={handleInputChange}
                          className="edit-input"
                          placeholder="Enter phone"
                        />
                      ) : (
                        learner.phone
                      )}
                    </td>
                    
                    <td>{learner.programme}</td>
                    <td>{learner.date}</td>
                    <td>
                      <span
                        className={`status-badge ${learner.status.toLowerCase()}`}
                      >
                        {learner.status}
                      </span>
                    </td>
                    
                    {/* Actions column - shows different buttons based on edit mode */}
                    <td>
                      {editingIndex === index ? (
                        // Show Save and Cancel buttons when in edit mode
                        <>
                          <button 
                            className="action-btn save" 
                            onClick={() => handleSaveEdit(index)}
                          >
                            Save
                          </button>
                          <button 
                            className="action-btn cancel" 
                            onClick={handleCancelEdit}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        // Show Edit and Deactivate buttons when not in edit mode
                        <>
                          <button 
                            className="action-btn edit" 
                            onClick={() => handleEditClick(index)}
                          >
                            Edit
                          </button>
                          <button 
                            className="action-btn deactivate" 
                            onClick={() => handleDeactivateClick(index)}
                            disabled={deactivatingIndex === index}
                          >
                            {deactivatingIndex === index ? "Deactivating..." : "Deactivate"}
                          </button>
                        </>
                      )}
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

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Deactivation</h2>
            <p>Are you sure you want to deactivate this student?</p>
            <p className="modal-warning">
              This action will change the student's status to "Inactive" and remove them from the list after 3 seconds.
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={cancelDeactivate}>
                Cancel
              </button>
              <button className="modal-btn confirm-btn" onClick={confirmDeactivate}>
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Learners;