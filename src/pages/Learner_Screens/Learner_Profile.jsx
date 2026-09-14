// src/pages/Learner/Learner_Profile.jsx
import React, { useState, useEffect } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_Profile.css';
import api from '../../services/api';

// ============================================
// PHONE INPUT LIMITER
// - Allows exactly 10 digits (e.g. 0821234567)
// - Or +27 followed by exactly 9 digits (e.g. +27821234567)
// - Or 27 followed by exactly 9 digits (e.g. 27821234567)
// - Blocks typing past the limit
// - Allows the user to type "+" at the start
// ============================================
const limitPhoneInput = (raw) => {
    if (raw == null) return '';

    // Allow only digits and "+"
    let cleaned = String(raw).replace(/[^\d+]/g, '');

    // Only one "+" allowed, and only at position 0
    if (cleaned.indexOf('+') > 0) {
        // Remove every "+" that isn't the first character
        cleaned = cleaned[0] + cleaned.slice(1).replace(/\+/g, '');
    }

    // If it starts with +27, cap total length at 12 characters (+27 + 9 digits)
    if (cleaned.startsWith('+27')) {
        return cleaned.slice(0, 12);
    }

    // If it starts with + but not +27 yet, allow it to grow up to 12 chars
    // (the user may still be typing "+2" before they reach "+27")
    if (cleaned.startsWith('+')) {
        return cleaned.slice(0, 12);
    }

    // If it starts with "27", cap at 11 digits (27 + 9)
    if (cleaned.startsWith('27')) {
        return cleaned.slice(0, 11);
    }

    // Otherwise cap at 10 digits
    return cleaned.slice(0, 10);
};

// Final validation on submit
const isValidSAPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // +27 followed by exactly 9 digits
    if (cleaned.startsWith('+27')) {
        return /^\+27\d{9}$/.test(cleaned);
    }

    // 27 followed by exactly 9 digits
    if (cleaned.startsWith('27')) {
        return /^27\d{9}$/.test(cleaned);
    }

    // Local: exactly 10 digits starting with 0
    if (cleaned.startsWith('0')) {
        return /^0\d{9}$/.test(cleaned);
    }

    return false;
};

const Learner_Profile = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Profile Data from Database
  const [learnerData, setLearnerData] = useState({
    userName: '',
    userEmail: '',
    memberSince: '',
    personalInfo: {
      firstName: '',
      lastName: '',
      idNumber: '',
      phone: '',
      address: ''
    },
    completedProgrammes: [],
    currentlyEnrolled: ''
  });

  //  Validation functions (same as signup)
  const validateName = (name) => {
    if (!name.trim()) {
      return { valid: false, message: 'Name is required' };
    }
    if (name.trim().length < 2) {
      return { valid: false, message: 'Name must be at least 2 characters' };
    }
    if (name.trim().length > 100) {
      return { valid: false, message: 'Name cannot exceed 100 characters' };
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }
    return { valid: true, message: 'Valid name' };
  };

  const validateSurname = (surname) => {
    if (!surname.trim()) {
      return { valid: false, message: 'Surname is required' };
    }
    if (surname.trim().length < 2) {
      return { valid: false, message: 'Surname must be at least 2 characters' };
    }
    if (surname.trim().length > 100) {
      return { valid: false, message: 'Surname cannot exceed 100 characters' };
    }
    if (!/^[a-zA-Z\s\-']+$/.test(surname.trim())) {
      return { valid: false, message: 'Surname can only contain letters, spaces, hyphens, and apostrophes' };
    }
    return { valid: true, message: 'Valid surname' };
  };

  const validatePhone = (phone) => {
    if (!phone) return { valid: false, message: 'Phone number is required' };

    // Strip spaces / dashes / brackets just in case
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // +27 format
    if (cleaned.startsWith('+27')) {
      const afterCode = cleaned.substring(3);
      if (afterCode.startsWith('0')) {
        return { valid: false, message: 'Invalid number. Please enter exactly 9 digits after +27 (e.g., +27821234567)' };
      }
      const digitsOnly = afterCode.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        return { valid: false, message: `Please enter exactly 9 digits after +27. You entered ${digitsOnly.length}.` };
      }
      return { valid: true, message: 'Valid phone number' };
    }

    // 27 format (without +)
    if (cleaned.startsWith('27')) {
      const afterCode = cleaned.substring(2);
      if (afterCode.startsWith('0')) {
        return { valid: false, message: 'Invalid number. Please enter exactly 9 digits after 27 (e.g., 27821234567)' };
      }
      const digitsOnly = afterCode.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        return { valid: false, message: `Please enter exactly 9 digits after 27. You entered ${digitsOnly.length}.` };
      }
      return { valid: true, message: 'Valid phone number' };
    }

    // Local format (starting with 0)
    if (cleaned.startsWith('0')) {
      const digitsOnly = cleaned.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return { valid: false, message: `Phone number must be exactly 10 digits. You entered ${digitsOnly.length}.` };
      }
      return { valid: true, message: 'Valid phone number' };
    }

    // Any other leading "+" that isn't +27
    if (cleaned.startsWith('+')) {
      return { valid: false, message: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' };
    }

    return { valid: false, message: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' };
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return { valid: false, message: 'Address is required' };
    }
    if (address.trim().length < 5) {
      return { valid: false, message: 'Address must be at least 5 characters' };
    }
    if (address.trim().length > 255) {
      return { valid: false, message: 'Address cannot exceed 255 characters' };
    }
    return { valid: true, message: 'Valid address' };
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // ============================================
  //  FETCH LEARNER PROFILE
  // ============================================
  const fetchLearnerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await api.get('/learner/profile');

      if (response.data.status === 'success') {
        const data = response.data.data;

        setLearnerData({
          userName: data.fullName || data.name + ' ' + data.surname,
          userEmail: data.email || '',
          memberSince: data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'January 2025',
          personalInfo: {
            firstName: data.name || '',
            lastName: data.surname || '',
            idNumber: data.idNumber || 'Not provided',
            phone: data.phone || data.phone_number || '',
            address: data.address || 'Not provided'
          },
          completedProgrammes: data.completedProgrammes || [],
          currentlyEnrolled: data.currentEnrollment || 'None'
        });
      } else {
        setError('Failed to load profile data');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Failed to load profile data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  //  UPDATE LEARNER PROFILE
  // ============================================
  const updateProfile = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return false;
      }

      // Map frontend field names to backend field names
      const fieldMap = {
        firstName: 'name',
        lastName: 'surname',
        phone: 'phone',
        address: 'address'
      };

      const backendField = fieldMap[field] || field;

      // Build update object
      const updateData = {};

      if (field === 'firstName') {
        updateData.name = value;
        updateData.surname = learnerData.personalInfo.lastName;
      } else if (field === 'lastName') {
        updateData.name = learnerData.personalInfo.firstName;
        updateData.surname = value;
      } else if (field === 'phone') {
        updateData.phone = value;
      } else if (field === 'address') {
        updateData.address = value;
      }

      const response = await api.put('/learner/profile', updateData);

      if (response.data.status === 'success') {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        return true;
      } else {
        if (response.data.errors) {
          setFieldErrors(response.data.errors);
        } else {
          setError(response.data.message || 'Failed to update profile');
        }
        setTimeout(() => {
          setFieldErrors({});
          setError(null);
        }, 5000);
        return false;
      }
    } catch (err) {
      console.error('Error updating profile:', err);

      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        setTimeout(() => setFieldErrors({}), 5000);
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
        setTimeout(() => setError(null), 5000);
      }
      return false;
    }
  };

  const handleEditClick = (field, value) => {
    setFieldErrors({});
    setEditingField(field);
    setEditValue(value);
  };

  const handleEditSave = async () => {
    if (editingField) {
      let validation;
      let errorField = editingField;

      switch (editingField) {
        case 'firstName':
          validation = validateName(editValue);
          errorField = 'name';
          break;
        case 'lastName':
          validation = validateSurname(editValue);
          errorField = 'surname';
          break;
        case 'phone':
          validation = validatePhone(editValue);
          errorField = 'phone';
          break;
        case 'address':
          validation = validateAddress(editValue);
          errorField = 'address';
          break;
        default:
          validation = { valid: true };
          break;
      }

      if (!validation.valid) {
        setFieldErrors({ [errorField]: validation.message });
        setTimeout(() => setFieldErrors({}), 5000);
        return;
      }

      setFieldErrors({});

      const oldValue = learnerData.personalInfo[editingField];
      const newLearnerData = { ...learnerData };

      if (editingField === 'firstName' || editingField === 'lastName') {
        const firstName = editingField === 'firstName' ? editValue : newLearnerData.personalInfo.firstName;
        const lastName = editingField === 'lastName' ? editValue : newLearnerData.personalInfo.lastName;
        newLearnerData.userName = `${firstName} ${lastName}`;
      }

      newLearnerData.personalInfo = {
        ...newLearnerData.personalInfo,
        [editingField]: editValue
      };

      setLearnerData(newLearnerData);

      const success = await updateProfile(editingField, editValue);

      if (success) {
        setEditingField(null);
        setEditValue('');
      } else {
        setLearnerData({
          ...learnerData,
          personalInfo: {
            ...learnerData.personalInfo,
            [editingField]: oldValue
          }
        });
      }
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue('');
    setFieldErrors({});
  };

  // ============================================
  //  PHONE-SPECIFIC HANDLERS
  // ============================================
  const handlePhoneChange = (e) => {
    const limited = limitPhoneInput(e.target.value);
    setEditValue(limited);

    // Clear error while typing
    if (fieldErrors.phone) {
      setFieldErrors({});
    }
  };

  const handlePhoneKeyDown = (e) => {
    // Allow control / navigation keys
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Tab', 'Home', 'End', 'Enter', 'Escape'
    ];
    if (allowedKeys.includes(e.key)) return;

    // Allow Ctrl/Cmd combos (copy, paste, select all, etc.)
    if (e.ctrlKey || e.metaKey) return;

    // Allow digits and "+"
    if (!/^[\d+]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Block a second "+" if one already exists
    if (e.key === '+' && editValue.includes('+')) {
      e.preventDefault();
      return;
    }

    // Block "+" unless it's at the start
    if (e.key === '+' && editValue.length > 0) {
      e.preventDefault();
      return;
    }
  };

  // ============================================
  //  LOAD PROFILE ON MOUNT
  // ============================================
  useEffect(() => {
    fetchLearnerProfile();
  }, []);

  // Render editable field
  const renderEditableField = (label, field, value) => {
    const isEditing = editingField === field;
    const fieldError = fieldErrors[field] || fieldErrors[field === 'firstName' ? 'name' : field === 'lastName' ? 'surname' : field];

    // Don't allow editing of ID Number
    if (field === 'idNumber') {
      return (
        <div className="info-item">
          <label>{label}</label>
          <div className="info-value-wrapper">
            <p>{value}</p>
          </div>
        </div>
      );
    }

    const isPhoneField = field === 'phone';

    return (
      <div className="info-item">
        <label>{label}</label>
        <div className="info-value-wrapper">
          {isEditing ? (
            <div className="edit-mode">
              {isPhoneField ? (
                <input
                  type="tel"
                  value={editValue}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={12}
                  className={`edit-input ${fieldError ? 'error' : ''}`}
                  autoFocus
                  placeholder="0821234567 or +27821234567"
                  inputMode="tel"
                />
              ) : (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => {
                    setEditValue(e.target.value);
                    if (fieldErrors[field] || fieldErrors[field === 'firstName' ? 'name' : field === 'lastName' ? 'surname' : field]) {
                      setFieldErrors({});
                    }
                  }}
                  className={`edit-input ${fieldError ? 'error' : ''}`}
                  autoFocus
                  placeholder=""
                />
              )}
              {fieldError && (
                <span className="field-error">{fieldError}</span>
              )}
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

  // Loading state
  if (loading) {
    return (
      <div className="profile-layout">
        <Learner_Header
          userName="Loading..."
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="profile-body">
          <Learner_SideBar
            active="profile"
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
          <main className="learner-profile">
            <div className="loading-spinner" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p>Loading your profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !learnerData.userEmail) {
    return (
      <div className="profile-layout">
        <Learner_Header
          userName="Error"
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="profile-body">
          <Learner_SideBar
            active="profile"
            isMobileOpen={isMobileMenuOpen}
            onClose={closeMobileMenu}
          />
          <main className="learner-profile">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ color: '#dc3545' }}>{error}</p>
              <button
                onClick={fetchLearnerProfile}
                style={{
                  marginTop: '20px',
                  padding: '10px 30px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-layout">
      <Learner_Header
        userName={learnerData.userName}
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="profile-body">
        <Learner_SideBar
          active="profile"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="learner-profile">
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

          {error && !Object.keys(fieldErrors).length && (
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

          <div className="profile-header">
            <div className="profile-user-info">
              <h1>{learnerData.userName}</h1>
              <p className="user-email">{learnerData.userEmail}</p>
              <p className="member-since">Member Since: {learnerData.memberSince}</p>
            </div>
          </div>

          {/* Personal Information Section */}
          <section className="profile-section">
            <h2>Personal Information</h2>
            <div className="profile-info-list">
              {renderEditableField('First Name', 'firstName', learnerData.personalInfo.firstName)}
              {renderEditableField('Last Name', 'lastName', learnerData.personalInfo.lastName)}

              <div className="info-item">
                <label>ID Number / Passport</label>
                <div className="info-value-wrapper">
                  <p>{learnerData.personalInfo.idNumber}</p>
                </div>
              </div>

              {renderEditableField('Phone Number', 'phone', learnerData.personalInfo.phone)}
              {renderEditableField('Physical Address', 'address', learnerData.personalInfo.address)}
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
                  {learnerData.completedProgrammes && learnerData.completedProgrammes.length > 0 ? (
                    learnerData.completedProgrammes.map((programme, index) => (
                      <tr key={index}>
                        <td>{programme.name}</td>
                        <td>{programme.completionDate ? new Date(programme.completionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</td>
                        <td>
                          <span className="status-badge">{programme.certificateStatus || 'Issued'}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                        No completed programmes yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Currently Enrolled Section */}
          <section className="profile-section">
            <h2>Currently Enrolled</h2>
            <div className="enrolled-card">
              <div className="enrolled-item">
                <span>{learnerData.currentlyEnrolled || 'None'}</span>
              </div>
            </div>
          </section>

          {/* POPIA Notice */}
          <div className="popia-notice">
            <p>
              <strong>POPIA Notice:</strong> All personal information shown on this profile is processed in compliance with the South African Protection of Personal Information Act (POPIA).
              Your ID and contact details are fully encrypted and only used for verified academic credential issuing.
            </p>
          </div>
        </main>
      </div>

      {/* Animation styles */}
      <style>{`
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
        .edit-input.error {
          border-color: #dc3545 !important;
        }
        .field-error {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        .edit-mode {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .edit-mode .edit-input {
          flex: 1;
          min-width: 150px;
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .edit-mode .edit-input:focus {
          outline: none;
          border-color: #1a237e;
        }
        .edit-mode .field-error {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Learner_Profile;