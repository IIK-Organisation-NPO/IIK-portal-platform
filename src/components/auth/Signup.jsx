// src/components/auth/Signup.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaVenusMars,
  FaSpinner
} from 'react-icons/fa';
import Footer from '../common/Footer';
import Input from '../common/Input';
import '../../styles/components/auth.css';
import logo from '../../assets/images/small Mki.png';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    idNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    if (name === 'idNumber') {
      formattedValue = value.replace(/\D/g, '').slice(0, 13);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 200) {
      newErrors.fullName = 'Full name must be less than 200 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (formData.phone.trim().length > 10) {
      newErrors.phone = 'Phone number cannot exceed 10 digits';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID/Passport number is required';
    } else if (formData.idNumber.trim().length < 13) {
      newErrors.idNumber = 'ID number must be exactly 13 digits';
    } else if (formData.idNumber.trim().length > 13) {
      newErrors.idNumber = 'ID number cannot exceed 13 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    
    if (!validateForm()) {
      const firstError = document.querySelector('.error-text');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setLoading(true);
      
      const registrationData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        idNumber: formData.idNumber.trim(),
        gender: formData.gender,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        agreeTerms: agreeTerms
      };
      
      console.log('📤 Sending registration data:', registrationData);
      
      const response = await axios.post(`${API_URL}/auth/register`, registrationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Registration response:', response.data);
      
      if (response.data.status === 'success') {
        setSuccessMessage(response.data.message || 'Registration successful! Please check your email to verify your account.');
        
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          gender: '',
          idNumber: '',
          password: '',
          confirmPassword: ''
        });
        setAgreeTerms(false);
        
        setTimeout(() => {
          navigate('/verify-email', { 
            state: { 
              email: formData.email,
              message: response.data.message 
            } 
          });
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage = errorData.message || 'Registration failed. Please try again.';
        
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).join('. ');
          setServerError(errorMessages);
          setErrors(errorData.errors);
        } else if (errorData.field) {
          setServerError(errorMessage);
          setErrors(prev => ({
            ...prev,
            [errorData.field]: errorMessage
          }));
        } else {
          setServerError(errorMessage);
        }
      } else if (error.request) {
        setServerError('Unable to connect to server. Please make sure the backend is running on port 5000.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <header className="auth-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <nav className="header-nav">
            <Link to="/learner/homepage">Home</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/Blog">Blog</Link>
          </nav>
        </div>
      </header>

      <div className="auth-container">
        <div className="auth-card auth-card-wide">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>Create Your Account</h2>
          <p className="subtitle">Enter your details below to set up your learner profile</p>

          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}

          {serverError && (
            <div className="alert alert-error">{serverError}</div>
          )}

          <form className="auth-form signup-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Sarah Krumac"
                    className={errors.fullName ? 'error' : ''}
                    disabled={loading}
                  />
                </div>
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. sarah@example.com"
                    className={errors.email ? 'error' : ''}
                    disabled={loading}
                    maxLength={255}
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 0821234567 (10 digits)"
                    className={errors.phone ? 'error' : ''}
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="gender">Gender</label>
                <div className="input-wrapper">
                  <FaVenusMars className="input-icon" />
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={errors.gender ? 'error' : ''}
                    disabled={loading}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="idNumber">ID Number / Passport Number</label>
                <div className="input-wrapper">
                  <FaIdCard className="input-icon" />
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="13-digit South African ID"
                    className={errors.idNumber ? 'error' : ''}
                    disabled={loading}
                    maxLength={13}
                  />
                </div>
                {errors.idNumber && <span className="error-text">{errors.idNumber}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={errors.password ? 'error' : ''}
                    disabled={loading}
                    maxLength={100}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
                <div className="password-hint">
                  Password must contain at least 8 characters, one uppercase, one lowercase, and one number
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={errors.confirmPassword ? 'error' : ''}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle password visibility"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width terms-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                    disabled={loading}
                  />
                  <span>
                    I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link> (POPIA compliant).
                  </span>
                </label>
                {errors.terms && <span className="error-text">{errors.terms}</span>}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">
            <hr />
            <span>or continue with</span>
            <hr />
          </div>

          <button className="btn-google" disabled={loading}>
            <FaGoogle size={20} /> Google
          </button>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>

          <div className="signup-disclaimer">
            <p>
              Your personal information is secure with us. IIK respects your privacy and manages all collected personal information strictly in accordance with the Protection of Personal Information Act (POPIA), Act No. 4 of 2013.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;