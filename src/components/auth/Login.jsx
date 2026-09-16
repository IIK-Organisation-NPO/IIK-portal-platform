// src/components/auth/Login.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaExclamationCircle } from 'react-icons/fa';
import Footer from '../common/Footer';
import Input from '../common/Input';
import '../../styles/components/auth.css';
import logo from '../../assets/images/small Mki.png';

const Login = () => {
  const [email, setEmail] = useState('sarah@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // ============================================================
  // TOAST STATE (Referenced from Admin_AccountSettings)
  // ============================================================
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const toastCleanupRef = useRef(null);

  // ============================================================
  // INLINE ERROR STATE (For Captcha & Server Errors)
  // ============================================================
  const [serverError, setServerError] = useState('');
  const [showCaptchaError, setShowCaptchaError] = useState(false);

  const navigate = useNavigate();

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);
    };
  }, []);

  /**
   * Displays a toast popup (Referenced from Admin_AccountSettings)
   */
  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastCleanupRef.current) clearTimeout(toastCleanupRef.current);

    setToastMessage(message);
    setToastVisible(true);

    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      toastCleanupRef.current = setTimeout(() => {
        setToastMessage('');
      }, 400);
    }, 2500);
  };

  const validateForm = () => {
    // Reset inline errors
    setServerError('');
    setShowCaptchaError(false);

    // 1. Basic Validation -> Show as Toast
    if (!email.trim()) {
      showToast('Email address is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid email address');
      return false;
    }
    if (!password) {
      showToast('Password is required');
      return false;
    }

    // 2. Simulated CAPTCHA Check -> Show as Inline Error (Critical Security)
    // In a real app, this would check a captcha token
    const captchaRequired = false; // Set to true to test the inline error
    if (captchaRequired) {
      setShowCaptchaError(true);
      // Scroll to the error if needed
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Login attempt with:', { email, password, rememberMe });
    
    // Simulate API Call failure for demonstration
    // If you want to test the server error, uncomment the lines below
    /*
    setServerError('Cannot connect to server. Please try again later.');
    return;
    */

    navigate('/learner-dashboard');
  };

  return (
    <div className="login-page">
      {/* Header */}
      <header className="login-header">
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

      {/* Login Form */}
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">Enter your credentials to access your portal dashboard</p>

          {/* ==================== INLINE ERROR (Server/Captcha Only) ==================== */}
          {serverError && (
            <div className="server-error">
              <FaExclamationCircle />
              <span style={{ whiteSpace: 'pre-line' }}>{serverError}</span>
            </div>
          )}

          {showCaptchaError && (
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
              <FaExclamationCircle />
              <span>Security verification required. Please complete the CAPTCHA.</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email Address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (serverError) setServerError('');
              }}
              placeholder="your@email.com"
              icon={FaEnvelope}
              required
            />

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (serverError) setServerError('');
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="btn-primary">
              Login
            </button>
          </form>

          <div className="auth-divider">
            <hr />
            <span>or continue with</span>
            <hr />
          </div>

          <button className="btn-google">
            <FaGoogle size={20} /> Google
          </button>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* ==================== TOAST POPUP ==================== */}
      {toastMessage && (
        <div className={`toast-message ${toastVisible ? 'toast-enter' : 'toast-exit'}`}>
          {toastMessage}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Login;