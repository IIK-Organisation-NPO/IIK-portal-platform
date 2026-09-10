// src/components/auth/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Footer from '../common/Footer';
import '../../styles/components/forgotpassword.css';
import logo from '../../assets/images/small Mki.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get resetToken and email from navigation state
  const resetToken = location.state?.resetToken || '';
  const email = location.state?.email || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Password requirements
  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'lowercase', label: 'At least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'uppercase', label: 'At least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'number', label: 'At least one number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', label: 'At least one special character (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) }
  ];

  // Check if all password requirements are met
  const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));

  // Show requirements only when:
  // 1. Password field is focused AND requirements are NOT all met
  // OR
  // 2. Password has value AND requirements are NOT all met AND confirm password is NOT focused
  const showRequirements = (!allRequirementsMet) && (passwordFocused || (newPassword && !confirmPasswordFocused));

  // Check if resetToken exists, if not redirect
  useEffect(() => {
    if (!resetToken) {
      setServerError('Invalid reset session. Please request a new OTP.');
      setTimeout(() => {
        navigate('/forgot-password');
      }, 3000);
    }
  }, [resetToken, navigate]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (@$!%*?&)' };
    }
    return { valid: true, message: 'Strong password' };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else {
      const validation = validatePassword(newPassword);
      if (!validation.valid) {
        newErrors.newPassword = validation.message;
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setServerError('');
    
    if (!validateForm()) {
      return;
    }

    if (!resetToken) {
      setServerError('Invalid reset session. Please request a new OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setServerError('');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successfully! Please login with your new password.' 
            } 
          });
        }, 3000);
      } else {
        setServerError(data.error || 'Failed to reset password. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setServerError('Failed to connect to server. Please check your connection.');
      setIsLoading(false);
    }
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
  };

  const handleConfirmPasswordFocus = () => {
    setConfirmPasswordFocused(true);
  };

  const handleConfirmPasswordBlur = () => {
    setConfirmPasswordFocused(false);
  };

  return (
    <div className="reset-password-page">
      {/* Header */}
      <header className="reset-password-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>IIK Portal</span>
          </div>
        </div>
      </header>

      {/* Reset Password Form */}
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>Reset Password</h2>
          <p className="subtitle">
            Create a new password for your account.
          </p>

          {email && (
            <div className="email-display">
              <strong>Email:</strong> {email}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <FaCheckCircle />
              <span>Password reset successfully! Redirecting to login...</span>
            </div>
          )}

          {/* Error Message */}
          {serverError && !success && (
            <div className="server-error">
              <FaExclamationCircle />
              <span>{serverError}</span>
            </div>
          )}

          {!success && (
            <form className="reset-password-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors(prev => ({ ...prev, newPassword: '' }));
                      }
                      if (serverError) setServerError('');
                    }}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    placeholder="Min. 8 characters"
                    className={errors.newPassword ? 'error' : ''}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label="Toggle password visibility"
                    disabled={isLoading}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                
                {/* Password Requirements - Show only when not all met and conditions are right */}
                {showRequirements && (
                  <div className="password-requirements">
                    <p className="requirements-title">Password must contain:</p>
                    <ul className="requirements-list">
                      {passwordRequirements.map((req) => {
                        const met = req.test(newPassword);
                        return (
                          <li key={req.id} className={met ? 'met' : 'unmet'}>
                            {met ? (
                              <FaCheckCircle className="req-icon met-icon" />
                            ) : (
                              <span className="req-icon unmet-icon">○</span>
                            )}
                            {req.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Show success message when all requirements are met */}
                {allRequirementsMet && newPassword && (
                  <div className="valid-text" style={{ marginTop: '4px' }}>
                    ✓ Password meets all requirements
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }
                      if (serverError) setServerError('');
                    }}
                    onFocus={handleConfirmPasswordFocus}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder="Re-enter password"
                    className={errors.confirmPassword ? 'error' : ''}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle password visibility"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                {newPassword && confirmPassword && newPassword === confirmPassword && !errors.confirmPassword && (
                  <span className="valid-text">✓ Passwords match</span>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="back-to-login">
            <Link to="/login">
              <FaArrowLeft style={{ marginRight: '0.5rem' }} />
              Back to login
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPassword;