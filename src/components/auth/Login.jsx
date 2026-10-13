// src/components/auth/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaSpinner,
  FaExclamationCircle,
  FaSync,
  FaBars
} from 'react-icons/fa';
import Footer from '../common/Footer';
import Input from '../common/Input';
import '../../styles/components/auth.css';
import '../../styles/components/mobile-nav.css';
import logo from '../../assets/images/small Mki.png';
import { API } from '../../config/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // ===== CAPTCHA STATES =====
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const captchaInputRef = useRef(null);

  // ============================================
  // ROLE-BASED REDIRECT FUNCTION
  // ============================================
  const redirectBasedOnRole = (role, roleId) => {
    console.log('Redirecting based on role:', { role, roleId });

    if (roleId === 3 || role === 'Super Admin') {
      return '/admin-dashboard';
    } else if (roleId === 1 || role === 'ADMIN') {
      return '/admin-dashboard';
    } else {
      return '/learner-dashboard';
    }
  };

  // ============================================
  // FETCH CAPTCHA
  // ============================================
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError('');

      const response = await fetch(API.auth.captcha, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'image/svg+xml'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load CAPTCHA');
      }

      const svgText = await response.text();
      setCaptchaImage(svgText);
      setCaptcha('');
      if (captchaInputRef.current) {
        captchaInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to fetch CAPTCHA:', error);
      setCaptchaError('Failed to load CAPTCHA. Please refresh.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // ============================================
  // REFRESH CAPTCHA
  // ============================================
  const refreshCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError('');

      const response = await fetch(API.auth.captchaRefresh, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to refresh CAPTCHA');
      }

      const data = await response.json();
      if (data.success) {
        setCaptchaImage(data.data);
        setCaptcha('');
        if (captchaInputRef.current) {
          captchaInputRef.current.value = '';
        }
      } else {
        throw new Error(data.message || 'Failed to refresh CAPTCHA');
      }
    } catch (error) {
      console.error('Failed to refresh CAPTCHA:', error);
      setCaptchaError('Failed to refresh CAPTCHA. Please try again.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // Check for messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch CAPTCHA on mount
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Countdown timer for lock
  useEffect(() => {
    if (lockTimeLeft > 0 && errorType === 'locked') {
      const timer = setInterval(() => {
        setLockTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorType('');
            setError('');
            fetchCaptcha();
            return 0;
          }
          return prev - 1;
        });
      }, 60000);

      return () => clearInterval(timer);
    }
  }, [lockTimeLeft, errorType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      setErrorType('invalid');
      return;
    }

    if (!captcha) {
      setError('Please enter the CAPTCHA code');
      setErrorType('captcha');
      return;
    }

    setError('');
    setSuccessMessage('');
    setErrorType('');
    setLoading(true);
    setLockTimeLeft(0);

    try {
      console.log('Sending login request to:', API.auth.loginWithCaptcha);
      console.log('Email:', email.trim().toLowerCase());

      const response = await fetch(API.auth.loginWithCaptcha, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
          captcha: captcha
        })
      });

      const data = await response.json();
      console.log('Login response status:', response.status);
      console.log('Login response data:', data);

      if (response.ok && data.success) {
        console.log('Full response data:', JSON.stringify(data, null, 2));

        const token =
          data.data?.accessToken ||
          data.data?.token ||
          data.data?.access_token ||
          data.token ||
          data.accessToken;

        const user = data.data?.user || data.user;

        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('User found:', user ? 'Yes' : 'No');

        const isInvalidToken =
          !token ||
          typeof token !== 'string' ||
          token === 'undefined' ||
          token === 'null' ||
          token.length < 20;

        if (isInvalidToken || !user) {
          console.error('Backend did not return a valid token/user. Response:', data);
          setError('Login succeeded but the server did not return a valid session. Please contact support.');
          setErrorType('error');
          setLoading(false);
          refreshCaptcha();
          return;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role || 'USER');
        localStorage.setItem('userRoleId', String(user.roleId || 2));
        localStorage.setItem('userType', user.userType || (user.roleId === 1 || user.roleId === 3 ? 'admin' : 'user'));

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        console.log('Stored token (first 30 chars):', token.slice(0, 30));
        console.log('Stored user:', user);

        const redirectPath = redirectBasedOnRole(user.role, user.roleId);
        console.log(`Redirecting to: ${redirectPath}`);

        setSuccessMessage(`Login Successfully, ${user.name}! `);
        setLoading(false);

        setTimeout(() => {
          navigate(redirectPath);
        }, 1500);

      } else if (response.status === 400 && data.message?.toLowerCase().includes('captcha')) {
        setError(data.message || 'Invalid CAPTCHA. Please try again.');
        setErrorType('captcha');
        setLoading(false);
        refreshCaptcha();

      } else if (response.status === 403 && data.requiresVerification) {
        setError('Please verify your email first. Check your email for the verification link.');
        setErrorType('unverified');
        setLoading(false);
        refreshCaptcha();

      } else if (response.status === 403 && data.locked) {
        const timeLeft = data.timeLeft || 15;
        setLockTimeLeft(timeLeft);
        setError(data.error || `Your account is locked. Please try again in ${timeLeft} minutes.`);
        setErrorType('locked');
        setLoading(false);

      } else {
        let errorMessage = data.error || data.message || 'Invalid email or password. Please try again.';
        if (data.remainingAttempts !== undefined && data.remainingAttempts > 0) {
          errorMessage += ` (${data.remainingAttempts} attempts remaining)`;
        }
        setError(errorMessage);
        setErrorType('invalid');
        setLoading(false);
        refreshCaptcha();
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please make sure the backend is running.');
        setErrorType('connection');
      } else {
        setError(`Error: ${error.message}`);
        setErrorType('error');
      }
      setLoading(false);
      refreshCaptcha();
    }
  };

  // ============ GOOGLE LOGIN ============
  const handleGoogleLogin = () => {
    window.location.href = API.auth.googleAuth;
  };

  const isCaptchaError = Boolean(
    (error && errorType === 'captcha') || captchaError
  );

  return (
    <div className="login-page">
      <header className="login-header site-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <button
            type="button"
            className="site-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <FaBars size={22} />
          </button>
          <nav className={`header-nav ${menuOpen ? 'mobile-open' : ''}`}>
            <a href="https://www.iik.co.za/Home">Home</a>
            
            <Link to="/BlogPage">Blog</Link>
          </nav>
        </div>
      </header>

      <div className="auth-container">
        <div className="auth-card">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>Welcome Back</h2>
          <p className="subtitle">Enter your credentials to access your portal dashboard</p>

          {successMessage && (
            <div className="success-message">
              <span>{successMessage}</span>
            </div>
          )}

          {error && errorType === 'captcha' && (
            <div className="server-error captcha-error login-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {error && errorType === 'invalid' && (
            <div className="server-error login-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {error && errorType === 'unverified' && (
            <div className="verification-error login-error">
              <FaExclamationCircle />
              <span>
                {error}
                <br />
                <Link to="/verify-email" state={{ email: email, from: 'login' }} className="resend-link">
                  Resend verification email
                </Link>
              </span>
            </div>
          )}

          {error && errorType === 'locked' && (
            <div className="locked-error login-error">
              <FaExclamationCircle />
              <span>
                {error}
                <br />
                {lockTimeLeft > 0 && (
                  <span className="lock-timer">
                    {lockTimeLeft} minute{lockTimeLeft > 1 ? 's' : ''} remaining -
                  </span>
                )}
                <Link to=" /forgot-password" className="resend-link">
                    Reset your password
                </Link>
              </span>
            </div>
          )}

          {error && errorType === 'connection' && (
            <div className="server-error login-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {error && !errorType && (
            <div className="server-error login-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                setErrorType('');
              }}
              placeholder="Enter your email"
              icon={FaEnvelope}
              required
              disabled={loading || errorType === 'locked'}
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
                    setError('');
                    setErrorType('');
                  }}
                  placeholder="Enter your password"
                  required
                  disabled={loading || errorType === 'locked'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  disabled={loading || errorType === 'locked'}
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
                  disabled={loading || errorType === 'locked'}
                />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {/* CAPTCHA SECTION */}
            <div className="form-group captcha-group">
              <label className="captcha-label">
                <span className="captcha-label-dot"></span>
                Human Verification
              </label>
              <div className={`captcha-container ${isCaptchaError ? 'input-error' : ''}`}>
                <div
                  className="captcha-image-wrapper"
                  dangerouslySetInnerHTML={{ __html: captchaImage }}
                />
                <button
                  type="button"
                  className="captcha-refresh-btn"
                  onClick={refreshCaptcha}
                  disabled={loading || captchaLoading || errorType === 'locked'}
                >
                  <FaSync className={captchaLoading ? 'spinning' : ''} />
                </button>
              </div>
              <input
                ref={captchaInputRef}
                type="text"
                value={captcha}
                onChange={(e) => {
                  setCaptcha(e.target.value);
                  setCaptchaError('');
                  setError('');
                  setErrorType('');
                }}
                placeholder="Enter the code above"
                className={`captcha-input ${isCaptchaError ? 'captcha-input-error input-error' : ''}`}
                disabled={loading || errorType === 'locked'}
                autoComplete="off"
                maxLength="6"
              />
              {captchaError && (
                <span className="captcha-error-text login-error-text">{captchaError}</span>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading || errorType === 'locked'}>
              {loading ? (
                <>
                  <FaSpinner className="spinner" />
                  Logging in...
                </>
              ) : errorType === 'locked' ? (
                'Account Locked'
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/*
          <div className="auth-divider">
            <hr />
            <span>or continue with</span>
            <hr />
          </div>
          */}

          {/* Google login will be implemented later - it does not currently work for now */}
          {/* 
          <button
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={loading || errorType === 'locked'}
          >
            <FaGoogle size={20} />
            {loading ? 'Loading...' : 'Continue with Google'}
          </button> */}

          <p className="auth-footer-text">
            View <Link to="/terms_and_conditions">Terms and Conditions </Link>
           
          or Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>

      <Footer />

      {/* Spinning animation for refresh icon */}
      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;