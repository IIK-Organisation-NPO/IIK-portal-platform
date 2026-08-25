import React, { useState } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Profile.css';

const Learner_Profile = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const userName = 'Sarah Khumalo';
  const userEmail = 'sarah.khumalo@example.com';
  const memberSince = 'January 2025';
  
  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    name: 'Sarah Khumalo',
    idNumber: '940214 5123 084',
    phone: '+27 82 123 4567',
    address: '12 Rosebank Road, Johannesburg, 2196'
  });

  // Completed Programmes
  const completedProgrammes = [
    {
      name: 'Digital Literacy',
      completionDate: '15 Nov 2025',
      status: 'Issued'
    }
  ];

  // Currently Enrolled
  const currentlyEnrolled = 'Microsoft 365';

  const handleEditClick = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleEditSave = () => {
    if (editingField) {
      setPersonalInfo({
        ...personalInfo,
        [editingField]: editValue
      });
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Render non-editable field (Name & Surname, ID Number)
  const renderNonEditableField = (label, value) => {
    return (
      <div className="info-item">
        <label>{label}</label>
        <div className="info-value-wrapper">
          <p>{value}</p>
        </div>
      </div>
    );
  };

  // Render editable field (Phone Number, Physical Address)
  const renderEditableField = (label, field, value) => {
    const isEditing = editingField === field;
    
    return (
      <div className="info-item">
        <label>{label}</label>
        <div className="info-value-wrapper">
          {isEditing ? (
            <div className="edit-mode">
              <input 
                type="text" 
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)}
                className="edit-input"
                autoFocus
              />
              <button onClick={handleEditSave} className="edit-save-btn">
                <i className="fas fa-check"></i>
              </button>
              <button onClick={handleEditCancel} className="edit-cancel-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <>
              <p>{value}</p>
              <button 
                className="edit-icon-btn" 
                onClick={() => handleEditClick(field, value)}
                aria-label={`Edit ${label}`}
              >
                <i className="fas fa-pen"></i>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="profile-layout">
      {/* Header - Always on top */}
      <Learner_Header 
        userName={userName}
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <div className="profile-body">
        {/* Sidebar - Below header */}
        <Learner_SideBar 
          active="profile" 
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
        
        {/* Main Content */}
        <main className="learner-profile">
          <div className="profile-header">
            <div className="profile-user-info">
              <h1>{userName}</h1>
              <p className="user-email">{userEmail}</p>
              <p className="member-since">Member Since: {memberSince}</p>
            </div>
          </div>

          {/* Personal Information Section */}
          <section className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-info-list">
              {/* Name & Surname - Not Editable */}
              {renderNonEditableField('Name & Surname', personalInfo.name)}
              
              {/* ID Number / Passport - Not Editable */}
              {renderNonEditableField('ID Number / Passport', personalInfo.idNumber)}
              
              {/* Phone Number - Editable */}
              {renderEditableField('Phone Number', 'phone', personalInfo.phone)}
              
              {/* Physical Address - Editable */}
              {renderEditableField('Physical Address', 'address', personalInfo.address)}
            </div>
          </section>

          {/* Completed Programmes Section */}
          <section className="profile-section">
            <h2>Completed Programmes</h2>
            <div className="table-responsive">
              <table className="programmes-table">
                <thead>
                  <tr>
                    <th>Programme Name</th>
                    <th>Completion Date</th>
                    <th>Certificate Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedProgrammes.map((programme, index) => (
                    <tr key={index}>
                      <td>{programme.name}</td>
                      <td>{programme.completionDate}</td>
                      <td>
                        <span className="status-badge issued">{programme.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Currently Enrolled Section */}
          <section className="profile-section">
            <h2>Currently Enrolled</h2>
            <div className="enrolled-card">
              <div className="enrolled-item">
                <i className="fas fa-book-open"></i>
                <span>{currentlyEnrolled}</span>
              </div>
            </div>
          </section>

          {/* POPIA Notice */}
          <div className="popia-notice">
            <i className="fas fa-shield-alt"></i>
            <p>
              <strong>POPIA Notice:</strong> All personal information shown on this profile is processed in compliance with the South African Protection of Personal Information Act (POPIA). 
              Your ID and contact details are fully encrypted and only used for verified academic credential issuing.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Learner_Profile;