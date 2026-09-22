// src/pages/Admin_Screens/Admin_StaffManagement.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/admin_StaffManagement.css';

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  import.meta.env?.VITE_API_URL ||
  'http://localhost:5000';

// ---------------------------------------------------------------------------
// Password requirements (drives the live checklist panel)
// ---------------------------------------------------------------------------
const PASSWORD_REQUIREMENTS = [
  { id: 'length',    label: 'At least 8 characters',                    test: (p) => p.length >= 8 },
  { id: 'lowercase', label: 'At least one lowercase letter',            test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'At least one uppercase letter',            test: (p) => /[A-Z]/.test(p) },
  { id: 'number',    label: 'At least one number',                      test: (p) => /\d/.test(p) },
  { id: 'special',   label: 'At least one special character (@$!%*?&)', test: (p) => /[@$!%*?&]/.test(p) }
];

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const validateName = (value, label = 'Name') => {
  const v = (value || '').trim();
  if (!v) return `${label} is required`;
  if (v.length < 2) return `${label} must be at least 2 characters`;
  if (v.length > 50) return `${label} must be less than 50 characters`;
  if (!/^[A-Za-z\s\-']+$/.test(v)) return `${label} can only contain letters, spaces, hyphens, and apostrophes`;
  return '';
};

const validateEmail = (value) => {
  const v = (value || '').trim();
  if (!v) return 'Email is required';
  if (!/^\S+@\S+\.\S+$/.test(v)) return 'Please enter a valid email address';
  if (v.length > 100) return 'Email must be less than 100 characters';
  return '';
};

const normalizePhone = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw).replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+27')) cleaned = '0' + cleaned.slice(3);
  else if (cleaned.startsWith('27')) cleaned = '0' + cleaned.slice(2);
  return cleaned.replace(/\D/g, '');
};

const validatePhone = (value) => {
  if (!value) return '';
  const digits = normalizePhone(value);
  if (digits.length === 0) return '';
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
  if (!digits.startsWith('0')) return 'Phone number must start with 0';
  return '';
};

const validatePassword = (value) => {
  if (!value) return 'Password is required';
  const unmet = PASSWORD_REQUIREMENTS.filter(r => !r.test(value));
  if (unmet.length === PASSWORD_REQUIREMENTS.length) return 'Password must be at least 8 characters';
  if (unmet.length > 0) return 'Password does not meet all the requirements';
  return '';
};

const limitPhoneInput = (raw) => {
  if (raw == null) return '';
  let cleaned = String(raw).replace(/[^\d+]/g, '');
  if (cleaned.indexOf('+') > 0) {
    cleaned = cleaned[0] + cleaned.slice(1).replace(/\+/g, '');
  }
  if (cleaned.startsWith('+27')) return cleaned.slice(0, 12);
  if (cleaned.startsWith('+'))   return cleaned.slice(0, 12);
  if (cleaned.startsWith('27'))  return cleaned.slice(0, 11);
  return cleaned.slice(0, 10);
};

// ---------------------------------------------------------------------------
// Table row helpers
// ---------------------------------------------------------------------------
const roleLabelFromId = (roleId) => {
  switch (String(roleId)) {
    case '1': return 'Administrator';
    case '2': return 'Manager';
    case '3': return 'Super Admin';
    case '4': return 'Viewer';
    default:  return 'Staff';
  }
};

const normalizeStaff = (row = {}) => {
  const firstName = row.Name ?? row.name ?? '';
  const lastName  = row.Surname ?? row.surname ?? '';
  const isActive  = row.Is_active === 0 ? false : true;

  return {
    id: row.Admin_ID ?? row.id ?? Date.now(),
    name: `${firstName} ${lastName}`.trim() || 'Unnamed',
    email: row.Email_address ?? row.email ?? '',
    role: row.role_type || roleLabelFromId(row.role_ID),
    dateRegistered: row.created_at
      ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—',
    lastLogin: row.last_login_at ? new Date(row.last_login_at).toLocaleString() : 'Never',
    status: isActive ? 'Active' : 'Inactive'
  };
};

const AdminStaffManagement = () => {
  const navigate = useNavigate();

  // --- UI State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone_number: '',
    role_id: '',
    password: '',
    confirmPassword: ''
  });

  // --- Field errors / touched / submission state ---
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const serverErrorTimerRef = useRef(null);

  // --- Table Data State (loaded from DB) ---
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffLoadError, setStaffLoadError] = useState('');

  // --- Roles State (from the role table, filtered to 1 & 3) ---
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // --- Modal State ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  // --- Derived: password requirements met? ---
  const allPasswordRequirementsMet = useMemo(
    () => PASSWORD_REQUIREMENTS.every(r => r.test(formData.password)),
    [formData.password]
  );

  // --- Fetch staff from the backend ---
  const fetchStaff = async () => {
    setStaffLoading(true);
    setStaffLoadError('');
    try {
      const res = await fetch(`${API_BASE}/api/staff`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load staff members.');
      }

      setStaffMembers((data.data || []).map(normalizeStaff));
    } catch (err) {
      console.error('Fetch staff error:', err);
      setStaffLoadError(err.message || 'Failed to load staff members.');
    } finally {
      setStaffLoading(false);
    }
  };

  // --- Fetch assignable roles (role_id 1 and 3) ---
  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/staff/roles`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setRoles(data.data);
      } else {
        setRoles([
          { role_id: 1, role_type: 'ADMIN' },
          { role_id: 3, role_type: 'Super Admin' }
        ]);
      }
    } catch (err) {
      console.error('Fetch roles error:', err);
      setRoles([
        { role_id: 1, role_type: 'ADMIN' },
        { role_id: 3, role_type: 'Super Admin' }
      ]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const validateField = (field, value) => {
    switch (field) {
      case 'name':            return validateName(value, 'Name');
      case 'surname':         return validateName(value, 'Surname');
      case 'email':           return validateEmail(value);
      case 'phone_number':    return validatePhone(value);
      case 'role_id':         return value ? '' : 'Please select a role';
      case 'password':        return validatePassword(value);
      case 'confirmPassword':
        if (!value) return 'Please confirm the password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default: return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'phone_number' ? limitPhoneInput(value) : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (touched[name]) {
      const err = validateField(name, finalValue);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: validateField('confirmPassword', formData.confirmPassword)
      }));
    }
    if (serverError) setServerError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
    if (name === 'password') setPasswordFocused(false);
  };

  const validateForm = () => {
    const fields = ['name', 'surname', 'email', 'phone_number', 'role_id', 'password', 'confirmPassword'];
    const newErrors = {};
    fields.forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    setTouched({
      name: true, surname: true, email: true, phone_number: true,
      role_id: true, password: true, confirmPassword: true
    });
    return Object.keys(newErrors).length === 0;
  };

  // --- Register (POST /api/staff) ---
  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          email: formData.email.trim().toLowerCase(),
          phone_number: formData.phone_number.trim() || null,
          role_id: parseInt(formData.role_id, 10),
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (Array.isArray(data.errors)) {
          const fieldErrors = {};
          data.errors.forEach(err => {
            if (err.field) fieldErrors[err.field] = err.message;
          });
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          setServerError('Please fix the errors above.');
        } else {
          setServerError(data.message || 'Failed to register staff member.');
        }

        if (serverErrorTimerRef.current) {
          clearTimeout(serverErrorTimerRef.current);
        }
        serverErrorTimerRef.current = setTimeout(() => {
          setServerError('');
        }, 5000);

        return;
      }

      const created = data.data;
      setStaffMembers(prev => [
        normalizeStaff({
          Admin_ID: created.id,
          Name: created.name,
          Surname: created.surname,
          Email_address: created.email,
          Phone_number: created.phone_number,
          role_ID: created.role_id
        }),
        ...prev
      ]);

      setSuccessMessage('Staff member registered successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);

      setFormData({
        name: '', surname: '', email: '', phone_number: '',
        role_id: '', password: '', confirmPassword: ''
      });
      setErrors({});
      setTouched({});
    } catch (err) {
      console.error('Register staff error:', err);
      setServerError(err.message === 'Failed to fetch'
        ? 'Cannot reach the server. Please try again.'
        : (err.message || 'Something went wrong.'));
    } finally {
      setSubmitting(false);
    }
  };

  // --- Action modal (hub) ---
  const handleOpenActionModal = (staff) => {
    setSelectedStaff(staff);
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setSelectedStaff(null);
  };

  const handleSelectEdit = () => {
    if (!selectedStaff) return;
    setEditStatus(selectedStaff.status);
    setShowActionModal(false);
    setShowEditModal(true);
  };

  const handleSelectDeactivate = () => {
    if (!selectedStaff) return;
    setShowActionModal(false);
    setShowDeactivateModal(true);
  };

  const handleSelectDelete = () => {
    if (!selectedStaff) return;
    setShowActionModal(false);
    setShowDeleteModal(true);
  };

  // --- Edit modal (direct entry point kept too) ---
  const handleEditClick = (staff) => {
    setSelectedStaff(staff);
    setEditStatus(staff.status);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStaff) return;

    const newStatus = editStatus;
    const previous = staffMembers;

    setStaffMembers(prev =>
      prev.map(s => (s.id === selectedStaff.id ? { ...s, status: newStatus } : s))
    );
    setShowEditModal(false);

    try {
      const res = await fetch(`${API_BASE}/api/staff/${selectedStaff.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus === 'Active' })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStaffMembers(previous);
        setServerError(data.message || 'Failed to update staff status.');
        setTimeout(() => setServerError(''), 5000);
        return;
      }
    } catch (err) {
      console.error('Update status error:', err);
      setStaffMembers(previous);
      setServerError('Cannot reach the server. Please try again.');
      setTimeout(() => setServerError(''), 5000);
    } finally {
      setSelectedStaff(null);
    }
  };

  // --- Deactivate modal ---
  const handleDeactivateClick = (staff) => {
    setSelectedStaff(staff);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedStaff) return;

    const previous = staffMembers;

    setStaffMembers(prev =>
      prev.map(s => (s.id === selectedStaff.id ? { ...s, status: 'Inactive' } : s))
    );
    setShowDeactivateModal(false);

    try {
      const res = await fetch(`${API_BASE}/api/staff/${selectedStaff.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStaffMembers(previous);
        setServerError(data.message || 'Failed to deactivate staff member.');
        setTimeout(() => setServerError(''), 5000);
        return;
      }
    } catch (err) {
      console.error('Deactivate staff error:', err);
      setStaffMembers(previous);
      setServerError('Cannot reach the server. Please try again.');
      setTimeout(() => setServerError(''), 5000);
    } finally {
      setSelectedStaff(null);
    }
  };

  // --- Delete modal ---
  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;

    const previous = staffMembers;

    // Optimistic remove
    setStaffMembers(prev => prev.filter(s => s.id !== selectedStaff.id));
    setShowDeleteModal(false);

    try {
      const res = await fetch(`${API_BASE}/api/staff/${selectedStaff.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStaffMembers(previous);
        setServerError(data.message || 'Failed to delete staff member.');
        setTimeout(() => setServerError(''), 5000);
        return;
      }

      setSuccessMessage('Staff member deleted successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Delete staff error:', err);
      setStaffMembers(previous);
      setServerError('Cannot reach the server. Please try again.');
      setTimeout(() => setServerError(''), 5000);
    } finally {
      setSelectedStaff(null);
    }
  };

  const showError = (field) => touched[field] && errors[field];

  return (
    <div className="app-container">
      <Admin_Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="main-layout">
        <Admin_Sidebar
          active="staff"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="admin-content">
          {/* Page Header */}
          <div className="page-header">
            <h1>Staff Management</h1>
            <p>Register administrative staff, delegate functional access roles, and audit operational activity.</p>
          </div>

          {/* ACL banner */}
          <div className="acl-banner">
            <svg className="acl-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p><strong>Access Control Level (ACL):</strong> Creating staff accounts issues temporary access codes. New staff must authenticate within 24 hours of invitation.</p>
          </div>

          {/* Success / server error banners */}
          {successMessage && (
            <div className="success-toast" style={{
              position: 'fixed', top: '80px', right: '20px',
              backgroundColor: '#d4edda', color: '#155724',
              padding: '15px 25px', borderRadius: '8px',
              border: '1px solid #c3e6cb', zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>{successMessage}</div>
          )}
          {serverError && (
            <div className="error-toast" style={{
              position: 'fixed', top: '80px', right: '20px',
              backgroundColor: '#f8d7da', color: '#721c24',
              padding: '15px 25px', borderRadius: '8px',
              border: '1px solid #f5c6cb', zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>{serverError}</div>
          )}

          {/* Register New Staff Member */}
          <div className="card form-card">
            <h2>Register New Staff Member</h2>
            <form onSubmit={handleRegisterStaff} className="register-form" noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label>NAME</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter name..."
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={showError('name') ? 'error' : ''}
                    disabled={submitting}
                  />
                  {showError('name') && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>SURNAME</label>
                  <input
                    type="text"
                    name="surname"
                    placeholder="Enter surname..."
                    value={formData.surname}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={showError('surname') ? 'error' : ''}
                    disabled={submitting}
                  />
                  {showError('surname') && <span className="field-error">{errors.surname}</span>}
                </div>

                <div className="form-group">
                  <label>EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="username@uk.co.za"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={showError('email') ? 'error' : ''}
                    disabled={submitting}
                  />
                  {showError('email') && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>PHONE NUMBER</label>
                  <input
                    type="tel"
                    name="phone_number"
                    placeholder="e.g. 0821234567"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={showError('phone_number') ? 'error' : ''}
                    inputMode="tel"
                    disabled={submitting}
                  />
                  {showError('phone_number') && <span className="field-error">{errors.phone_number}</span>}
                </div>

                <div className="form-group">
                  <label>ASSIGN SYSTEM ROLE</label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={showError('role_id') ? 'error' : ''}
                    disabled={submitting || rolesLoading}
                  >
                    <option value="">
                      {rolesLoading ? 'Loading roles...' : 'Select Role...'}
                    </option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_type === 'ADMIN' ? 'Administrator' :
                         r.role_type === 'Super Admin' ? 'Super Admin' :
                         r.role_type}
                      </option>
                    ))}
                  </select>
                  {showError('role_id') && <span className="field-error">{errors.role_id}</span>}
                </div>

                <div className="form-group">
                  <label>TEMPORARY PASSWORD</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      onFocus={() => setPasswordFocused(true)}
                      className={showError('password') ? 'error' : ''}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)', background: 'transparent',
                        border: 0, cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {showError('password') && <span className="field-error">{errors.password}</span>}

                  {passwordFocused && formData.password && !allPasswordRequirementsMet && (
                    <div className="password-requirements">
                      <p className="requirements-title">Password must contain:</p>
                      <ul className="requirements-list">
                        {PASSWORD_REQUIREMENTS.map(req => {
                          const met = req.test(formData.password);
                          return (
                            <li key={req.id} className={met ? 'met' : 'unmet'}>
                              {met ? '●' : '○'} {req.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>CONFIRM PASSWORD</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={showError('confirmPassword') ? 'error' : ''}
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      aria-label="Toggle confirm password visibility"
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)', background: 'transparent',
                        border: 0, cursor: 'pointer'
                      }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {showError('confirmPassword') && <span className="field-error">{errors.confirmPassword}</span>}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && !showError('confirmPassword') && (
                    <span className="valid-text" style={{ color: '#0a7d28', fontSize: 12 }}>Passwords match</span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Staff Member'}
                </button>
              </div>
            </form>
          </div>

          {/* Current Staff Members Table */}
          <div className="card table-card">
            <h2>Current Staff Members</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>STAFF MEMBER</th>
                  <th>SYSTEM ROLE / EMAIL</th>
                  <th>DATE REGISTERED</th>
                  <th>LAST LOGIN</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {staffLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      Loading staff members...
                    </td>
                  </tr>
                ) : staffLoadError ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#dc2626' }}>
                      {staffLoadError}{' '}
                      <button className="btn-secondary" onClick={fetchStaff} style={{ marginLeft: 8 }}>
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                      No staff members registered yet.
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((staff) => (
                    <tr key={staff.id}>
                      <td className="staff-name-cell"><strong>{staff.name}</strong></td>
                      <td className="staff-role-cell">
                        <span>{staff.role}</span>
                        <small>{staff.email}</small>
                      </td>
                      <td>{staff.dateRegistered}</td>
                      <td>{staff.lastLogin}</td>
                      <td>
                        <span className={`status-badge status-${staff.status.toLowerCase()}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleOpenActionModal(staff)}
                          >
                            Actions
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- MODALS --- */}

          {/* Action Selection Modal */}
          {showActionModal && (
            <div className="modal-overlay">
              <div className="modal action-modal" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
                <h2 id="action-modal-title">Select an Action</h2>
                <div className="modal-content">
                  <p className="action-modal-subtitle">
                    Choose what you would like to do with <strong>{selectedStaff?.name}</strong>.
                  </p>

                  <div className="action-modal-buttons">
                    <button className="action-modal-btn btn-edit" onClick={handleSelectEdit}>
                      Edit
                    </button>
                    <button
                      className="action-modal-btn btn-archive"
                      onClick={handleSelectDeactivate}
                      disabled={selectedStaff?.status === 'Inactive'}
                    >
                      Deactivate
                    </button>
                    <button className="action-modal-btn btn-delete" onClick={handleSelectDelete}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleCloseActionModal}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Status Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true">
                <h2>Edit Staff Status</h2>
                <div className="modal-content">
                  <p><strong>Staff Member:</strong> {selectedStaff?.name}</p>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedStaff(null); }}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* Deactivate Confirmation Modal */}
          {showDeactivateModal && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true" aria-labelledby="deactivate-modal-title">
                <h2 id="deactivate-modal-title">Deactivate Staff Member?</h2>
                <div className="modal-content">
                  <p>Are you sure you want to deactivate <strong>{selectedStaff?.name}</strong>?</p>
                  <p className="modal-warning-text">This action will revoke their access to the portal immediately.</p>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => { setShowDeactivateModal(false); setSelectedStaff(null); }}>Cancel</button>
                  <button className="btn-archive" onClick={handleConfirmDeactivate}>Deactivate Staff</button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="modal-overlay">
              <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                <h2 id="delete-modal-title">Delete Staff Member?</h2>
                <div className="modal-content">
                  <p>Are you sure you want to delete <strong>{selectedStaff?.name}</strong>?</p>
                  <p className="modal-warning-text">This action will remove their access to the portal completely</p>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => { setShowDeleteModal(false); setSelectedStaff(null); }}>Cancel</button>
                  <button className="btn-delete" onClick={handleConfirmDelete}>Delete Staff</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AdminStaffManagement;