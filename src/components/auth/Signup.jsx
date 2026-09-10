// src/components/auth/Signup.jsx
import React, { useState, useEffect } from 'react';
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
  FaSpinner,
  FaExclamationCircle,
  FaArrowLeft,
  FaCheckCircle,
  FaShieldAlt // ✅ ADDED: For security badge
} from 'react-icons/fa';
import Footer from '../common/Footer';
import '../../styles/components/auth.css';
import logo from '../../assets/images/small Mki.png';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone_number: '',
    gender_id: '',
    id_number: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms_accepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleInitialized, setIsGoogleInitialized] = useState(false);
  const [genders, setGenders] = useState([]);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ===== SECURITY FEATURE 1: CAPTCHA TRACKING =====
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const GOOGLE_CLIENT_ID = '993718508487-6pfj9lrar0rvjkuum65s1m1jb1oeq6rf.apps.googleusercontent.com';

  // Password requirements
  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'lowercase', label: 'At least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'uppercase', label: 'At least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'number', label: 'At least one number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', label: 'At least one special character (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) }
  ];

  // Check if all password requirements are met
  const allRequirementsMet = passwordRequirements.every(req => req.test(formData.password));

  // ===== SECURITY FEATURE 2: SHOW CAPTCHA AFTER 3 FAILED ATTEMPTS =====
  useEffect(() => {
    if (failedAttempts >= 3) {
      setShowCaptcha(true);
    }
  }, [failedAttempts]);

  // Fetch genders from database
  useEffect(() => {
    const fetchGenders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/genders`);
        const data = await response.json();
        if (data.success) {
          setGenders(data.data);
        }
      } catch (error) {
        console.error('Error fetching genders:', error);
        setGenders([
          { id: 1, value: 'male', label: 'Male' },
          { id: 2, value: 'female', label: 'Female' },
          { id: 3, value: 'other', label: 'Other' },
          { id: 4, value: 'prefer_not', label: 'Prefer not to say' }
        ]);
      }
    };
    fetchGenders();
  }, [API_URL]);

  // ===== VALIDATION FUNCTIONS =====
  
  // ===== SECURITY FEATURE 3: ENHANCED EMAIL VALIDATION WITH DISPOSABLE EMAIL BLOCKING =====
  const validateEmail = (email) => {
    if (!email.trim()) {
      return { valid: false, message: 'Email address is required' };
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    
    // ✅ SECURITY: Block disposable/temporary email domains
    const disposableDomains = [
      'tempmail.com', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'throwawaymail.com', 'temp-mail.org',
      'yopmail.com', 'spamgourmet.com', 'trashmail.com',
      'mytemp.email', 'fakeinbox.com', 'mailnator.com'
    ];
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
      return { valid: false, message: 'Please use a permanent email address' };
    }
    
    return { valid: true, message: 'Valid email address' };
  };

  const validateSAID = (idNumber) => {
    if (!idNumber) return { valid: false, message: 'ID number is required' };
    idNumber = idNumber.replace(/[\s-]/g, '');
    if (!/^\d{13}$/.test(idNumber)) {
      return { valid: false, message: 'South African ID must be exactly 13 digits' };
    }
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    const currentYear = new Date().getFullYear();
    const fullYear = year > 20 ? 1900 + year : 2000 + year;
    const date = new Date(fullYear, month - 1, day);
    if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return { valid: false, message: 'Invalid birth date in ID number' };
    }
    const age = (currentYear - fullYear);
    if (age < 18) {
      return { valid: false, message: 'You must be 18 years or older' };
    }
    let sum = 0;
    let alternate = false;
    for (let i = idNumber.length - 1; i >= 0; i--) {
      let n = parseInt(idNumber.charAt(i));
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      sum += n;
      alternate = !alternate;
    }
    if (sum % 10 !== 0) {
      return { valid: false, message: 'Invalid South African ID number' };
    }
    return { valid: true, message: 'Valid South African ID' };
  };

  const validatePhone = (phone) => {
    if (!phone) return { valid: false, message: 'Phone number is required' };
    
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    const localPattern = /^0\d{9}$/;
    const intlWithPlusPattern = /^\+\d{11}$/;
    const intlWithoutPlusPattern = /^27\d{9}$/;
    
    if (localPattern.test(cleaned) || 
        intlWithPlusPattern.test(cleaned) || 
        intlWithoutPlusPattern.test(cleaned)) {
      return { valid: true, message: 'Valid phone number' };
    }
    
    const digitsOnly = cleaned.replace(/\D/g, '');
    if ((digitsOnly.length === 10 || digitsOnly.length === 11) && 
        (digitsOnly.startsWith('0') || digitsOnly.startsWith('27'))) {
      return { valid: true, message: 'Valid phone number' };
    }
    
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      return { valid: false, message: 'Phone number is too short (minimum 10 digits)' };
    }
    if (digitsOnly.length > 11) {
      return { valid: false, message: 'Phone number is too long (maximum 11 digits)' };
    }
    
    return { valid: false, message: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' };
  };

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

  const validatePassword = (password) => {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
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

  // Load Google OAuth library
  useEffect(() => {
    const loadGoogleLibrary = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('✅ Google OAuth library loaded');
          renderGoogleButton();
        };
        document.head.appendChild(script);
      } else {
        renderGoogleButton();
      }
    };
    loadGoogleLibrary();
  }, []);

  const renderGoogleButton = () => {
    try {
      if (window.google && window.google.accounts && !isGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        setIsGoogleInitialized(true);
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: 350,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );
        console.log('✅ Google Sign-In button rendered');
      }
    } catch (error) {
      console.error('Error rendering Google button:', error);
    }
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    
    let cleaned = value.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+27')) {
      let afterCode = cleaned.substring(3);
      let digitsOnly = afterCode.replace(/\D/g, '');
      if (digitsOnly.length > 9) {
        return;
      }
      cleaned = '+27' + digitsOnly;
    } 
    else if (cleaned.startsWith('27')) {
      let afterCode = cleaned.substring(2);
      let digitsOnly = afterCode.replace(/\D/g, '');
      if (digitsOnly.length > 9) {
        return;
      }
      cleaned = '27' + digitsOnly;
    }
    else if (cleaned.startsWith('0')) {
      let digitsOnly = cleaned.replace(/\D/g, '');
      if (digitsOnly.length > 10) {
        return;
      }
      cleaned = digitsOnly;
    }
    else if (cleaned.length > 0) {
      if (!cleaned.match(/^[0-9+]/)) {
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: cleaned
    }));
    
    if (errors.phone_number) {
      setErrors(prev => ({
        ...prev,
        phone_number: ''
      }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handlePhoneBlur = (e) => {
    setTouched(prev => ({
      ...prev,
      phone_number: true
    }));
    
    const phone = formData.phone_number;
    if (!phone) {
      setErrors(prev => ({
        ...prev,
        phone_number: 'Phone number is required'
      }));
      return;
    }
    
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+27')) {
      let afterCode = cleaned.substring(3);
      let digitsOnly = afterCode.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        setErrors(prev => ({
          ...prev,
          phone_number: 'Please enter exactly 9 digits after +27 (e.g., +27821234567)'
        }));
        return;
      }
    } 
    else if (cleaned.startsWith('27')) {
      let afterCode = cleaned.substring(2);
      let digitsOnly = afterCode.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        setErrors(prev => ({
          ...prev,
          phone_number: 'Please enter exactly 9 digits after 27 (e.g., 27821234567)'
        }));
        return;
      }
    } 
    else if (cleaned.startsWith('0')) {
      let digitsOnly = cleaned.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        setErrors(prev => ({
          ...prev,
          phone_number: 'Phone number must be exactly 10 digits (e.g., 0821234567)'
        }));
        return;
      }
    } 
    else {
      setErrors(prev => ({
        ...prev,
        phone_number: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)'
      }));
      return;
    }
    
    setErrors(prev => ({
      ...prev,
      phone_number: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      handlePhoneChange(e);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    if (name === 'password') {
      setPasswordFocused(false);
    }
    
    if (name === 'phone_number') {
      handlePhoneBlur(e);
      return;
    }
    
    validateField(name, value);
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
  };

  const validateField = (name, value) => {
    let result;
    switch (name) {
      case 'name':
        result = validateName(value);
        break;
      case 'surname':
        result = validateSurname(value);
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'id_number':
        result = validateSAID(value);
        break;
      case 'password':
        result = validatePassword(value);
        break;
      case 'confirmPassword':
        if (!value) {
          result = { valid: false, message: 'Please confirm your password' };
        } else if (value !== formData.password) {
          result = { valid: false, message: 'Passwords do not match' };
        } else {
          result = { valid: true, message: 'Passwords match' };
        }
        break;
      default:
        result = { valid: true, message: '' };
    }
    if (!result.valid) {
      setErrors(prev => ({
        ...prev,
        [name]: result.message
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    return result.valid;
  };

  const validateForm = () => {
    const fields = ['name', 'surname', 'email', 'phone_number', 'gender_id', 'id_number', 'password', 'confirmPassword'];
    let isValid = true;
    const newErrors = {};
    fields.forEach(field => {
      setTouched(prev => ({
        ...prev,
        [field]: true
      }));
      let result;
      switch (field) {
        case 'name':
          result = validateName(formData[field]);
          break;
        case 'surname':
          result = validateSurname(formData[field]);
          break;
        case 'email':
          result = validateEmail(formData[field]);
          break;
        case 'phone_number':
          result = validatePhone(formData[field]);
          break;
        case 'id_number':
          result = validateSAID(formData[field]);
          break;
        case 'password':
          result = validatePassword(formData[field]);
          break;
        case 'confirmPassword':
          if (!formData[field]) {
            result = { valid: false, message: 'Please confirm your password' };
          } else if (formData[field] !== formData.password) {
            result = { valid: false, message: 'Passwords do not match' };
          } else {
            result = { valid: true, message: '' };
          }
          break;
        case 'gender_id':
          if (!formData[field]) {
            result = { valid: false, message: 'Please select your gender' };
          } else {
            result = { valid: true, message: '' };
          }
          break;
        default:
          result = { valid: true, message: '' };
      }
      if (!result.valid) {
        isValid = false;
        newErrors[field] = result.message;
      }
    });
    if (!terms_accepted) {
      newErrors.terms = 'You must agree to the Terms of Service';
      isValid = false;
    }
    
    // ===== SECURITY FEATURE 4: CHECK CAPTCHA IF SHOWN =====
    if (showCaptcha && !captchaToken) {
      newErrors.captcha = 'Please complete the CAPTCHA verification';
      isValid = false;
    }
    
    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setServerError('');
    setConnectionStatus('');
    if (!validateForm()) {
      const firstError = Object.keys(errors).find(key => errors[key]);
      if (firstError) {
        const element = document.getElementById(firstError);
        if (element) {
          element.focus();
        }
      }
      return;
    }
    setLoading(true);
    setConnectionStatus('⏳ Creating your account...');
    try {
      const signupData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim(),
        gender_id: parseInt(formData.gender_id),
        id_number: formData.id_number.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        terms_accepted: terms_accepted,
        captchaToken: captchaToken // ===== SECURITY FEATURE 5: SEND CAPTCHA TOKEN =====
      };
      console.log('📤 Sending signup data:', signupData);
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      });
      const data = await response.json();
      console.log('📥 Signup response:', data);
      if (response.ok && data.success) {
        setConnectionStatus('✅ Account created! Redirecting to verification...');
        setLoading(false);
        if (data.data?.token) {
          localStorage.setItem('token', data.data.token);
        }
        if (data.data?.requiresVerification) {
          setTimeout(() => {
            navigate('/verify-email', { 
              state: { 
                email: formData.email,
                fullName: `${formData.name} ${formData.surname}`,
                userId: data.data?.userId,
                verificationSent: data.data?.verificationSent || true,
                isGoogleUser: false
              } 
            });
          }, 1500);
        } else {
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } else {
        // ===== SECURITY FEATURE 6: TRACK FAILED ATTEMPTS FOR CAPTCHA =====
        setFailedAttempts(prev => prev + 1);
        
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors = {};
          data.errors.forEach(err => {
            const field = err.field || err.param || err.path;
            if (field) {
              fieldErrors[field] = err.message || err.msg;
            }
          });
          setErrors(prev => ({
            ...prev,
            ...fieldErrors
          }));
          setServerError('Please fix the errors above.');
        } else {
          setServerError(data.message || data.error || 'Signup failed. Please try again.');
        }
        setLoading(false);
        setConnectionStatus('❌ Failed');
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      setConnectionStatus(`❌ Error: ${error.message}`);
      // ===== SECURITY FEATURE 7: INCREMENT FAILED ATTEMPTS ON NETWORK ERROR =====
      setFailedAttempts(prev => prev + 1);
      
      if (error.message === 'Failed to fetch') {
        setServerError(
          '❌ Cannot connect to server!\n\n' +
          'Please make sure:\n' +
          '1. Backend is running: cd backend && npm run dev\n' +
          '2. Backend is on port 5000'
        );
      } else {
        setServerError(`Error: ${error.message}`);
      }
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setGoogleLoading(true);
      const googleToken = response.credential;
      console.log('✅ Google credential received');
      const apiResponse = await fetch(`${API_URL}/api/auth/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ googleToken })
      });
      const data = await apiResponse.json();
      console.log('📥 Google auth response:', data);
      if (apiResponse.status === 409) {
        setServerError('⚠️ ' + (data.error || 'This email is already registered. Please login instead.'));
        setGoogleLoading(false);
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'This email is already registered. Please login instead.'
            }
          });
        }, 3000);
        return;
      }
      if (apiResponse.ok && data.success) {
        if (data.data?.requiresVerification) {
          console.log('📧 Redirecting to email verification');
          navigate('/verify-email', { 
            state: { 
              email: data.data.email,
              fullName: data.data.fullName || `${data.data.name || ''} ${data.data.surname || ''}`,
              isGoogleUser: true,
              userId: data.data.userId,
              alreadyExists: data.data.alreadyExists || false,
              verificationSent: true
            } 
          });
          setGoogleLoading(false);
        } else {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          navigate('/dashboard');
        }
      } else {
        setServerError(data.error || 'Google sign-in failed');
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google credential error:', error);
      setServerError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const hasError = (field) => {
    return errors[field] && touched[field];
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
            <Link to="/Homepage">Home</Link>
            <a
              href="https://www.iik.co.za/contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
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
          <p className="subtitle">
            Enter your details below to set up your learner profile
          </p>

          {serverError && !errors.email && !errors.name && !errors.phone_number && !errors.id_number && (
            <div className="server-error">
              <FaExclamationCircle />
              <span style={{ whiteSpace: 'pre-line' }}>{serverError}</span>
            </div>
          )}

          {/* ===== SECURITY FEATURE 9: CAPTCHA NOTICE ===== */}
          {showCaptcha && (
            <div className="captcha-notice" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              marginBottom: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <FaShieldAlt />
              <span>Security verification required. Please complete the CAPTCHA below.</span>
            </div>
          )}

          <form className="auth-form signup-form" onSubmit={handleSubmit} noValidate>
            {/* Name and Surname */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Sarah"
                    className={hasError('name') ? 'error' : ''}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {hasError('name') && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="surname">Surname <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Krumac"
                    className={hasError('surname') ? 'error' : ''}
                    disabled={loading}
                  />
                </div>
                {hasError('surname') && <span className="error-text">{errors.surname}</span>}
              </div>
            </div>

            {/* Email and Phone */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. sarah@example.com"
                    className={hasError('email') ? 'error' : ''}
                    disabled={loading}
                  />
                </div>
                {hasError('email') && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">Phone Number <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. 0821234567 or +27821234567"
                    className={hasError('phone_number') ? 'error' : ''}
                    disabled={loading}
                    maxLength={13}
                  />
                </div>
                {hasError('phone_number') && <span className="error-text">{errors.phone_number}</span>}
              </div>
            </div>

            {/* Gender */}
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="gender_id">Gender <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaVenusMars className="input-icon" />
                  <select
                    id="gender_id"
                    name="gender_id"
                    value={formData.gender_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={hasError('gender_id') ? 'error' : ''}
                    disabled={loading}
                  >
                    <option value="">Select gender</option>
                    {genders.map((gender) => (
                      <option key={gender.id} value={gender.id}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                </div>
                {hasError('gender_id') && <span className="error-text">{errors.gender_id}</span>}
              </div>
            </div>

            {/* ID Number */}
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="id_number">ID Number / Passport Number <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaIdCard className="input-icon" />
                  <input
                    type="text"
                    id="id_number"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="13-digit South African ID (e.g. 9001015800080)"
                    className={hasError('id_number') ? 'error' : ''}
                    disabled={loading}
                    maxLength="13"
                  />
                </div>
                {hasError('id_number') && <span className="error-text">{errors.id_number}</span>}
              </div>
            </div>

            {/* Password with Requirements */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handlePasswordFocus}
                    placeholder="Min. 8 characters"
                    className={hasError('password') ? 'error' : ''}
                    disabled={loading}
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
                {hasError('password') && <span className="error-text">{errors.password}</span>}
                
                {/* Password Requirements - Show only when focused and not all met */}
                {passwordFocused && !allRequirementsMet && formData.password && (
                  <div className="password-requirements">
                    <p className="requirements-title">Password must contain:</p>
                    <ul className="requirements-list">
                      {passwordRequirements.map((req) => {
                        const met = req.test(formData.password);
                        return (
                          <li key={req.id} className={met ? 'met' : 'unmet'}>
                            {met ? <FaCheckCircle className="req-icon met-icon" /> : <span className="req-icon unmet-icon">○</span>}
                            {req.label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Re-enter password"
                    className={hasError('confirmPassword') ? 'error' : ''}
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
                {hasError('confirmPassword') && <span className="error-text">{errors.confirmPassword}</span>}
                {formData.confirmPassword && formData.password === formData.confirmPassword && !hasError('confirmPassword') && (
                  <span className="valid-text">✓ Passwords match</span>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="form-row">
              <div className="form-group full-width terms-group">
                <label className={`checkbox-label ${hasError('terms') ? 'error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={terms_accepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({
                          ...prev,
                          terms: ''
                        }));
                      }
                    }}
                    disabled={loading}
                  />
                  <span>I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link> (POPIA compliant).</span>
                </label>
                {hasError('terms') && <span className="error-text">{errors.terms}</span>}
              </div>
            </div>

            {/* ===== SECURITY FEATURE 10: CAPTCHA FIELD ===== */}
            {showCaptcha && (
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Security Verification <span className="required">*</span></label>
                  <div className="captcha-container" style={{ padding: '10px 0' }}>
                    {/* This is where you'd add your CAPTCHA component */}
                    {/* For now, it's a placeholder */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #dee2e6'
                    }}>
                      <FaShieldAlt style={{ color: '#004085', fontSize: '20px' }} />
                      <span style={{ color: '#666' }}>
                        CAPTCHA verification required. Please complete the security check.
                      </span>
                    </div>
                    {hasError('captcha') && <span className="error-text">{errors.captcha}</span>}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <hr />
            <span>or continue with</span>
            <hr />
          </div>

          <div 
            id="google-signin-button" 
            style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '15px',
              width: '100%',
              minHeight: '50px'
            }}
          ></div>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>

          <div className="signup-disclaimer">
            <p>
              Your personal information is secure with us. IIK respects your
              privacy and manages all collected personal information strictly in
              accordance with the Protection of Personal Information Act
              (POPIA), Act No. 4 of 2013.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;