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
  FaSync 
} from 'react-icons/fa';
import Footer from '../common/Footer';
import Input from '../common/Input';
import '../../styles/components/auth.css';
import logo from '../../assets/images/small Mki.png';

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
  
  // ===== CAPTCHA STATES =====
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const captchaInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ============================================
  // ✅ ROLE-BASED REDIRECT FUNCTION
  // ============================================
  const redirectBasedOnRole = (role, roleId) => {
    console.log('🔍 Redirecting based on role:', { role, roleId });
    
    if (roleId === 3 || role === 'Super Admin') {
      return '/admin-dashboard';
    } else if (roleId === 1 || role === 'ADMIN') {
      return '/admin-dashboard';
    } else {
      return '/learner-dashboard';
    }
  };

  // ============================================
  // ✅ FETCH CAPTCHA
  // ============================================
  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError('');
      
      const response = await fetch(`${API_URL}/api/auth/captcha`, {
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
      console.error('❌ Failed to fetch CAPTCHA:', error);
      setCaptchaError('Failed to load CAPTCHA. Please refresh.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  // ============================================
  // ✅ REFRESH CAPTCHA
  // ============================================
  const refreshCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      setCaptchaError('');
      
      const response = await fetch(`${API_URL}/api/auth/captcha/refresh`, {
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
      console.error('❌ Failed to refresh CAPTCHA:', error);
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
      setErrorType('invalid');
      return;
    }

    setError('');
    setSuccessMessage('');
    setErrorType('');
    setLoading(true);
    setLockTimeLeft(0);

    try {
      console.log('📤 Sending login request to:', `${API_URL}/api/auth/login-with-captcha`);
      console.log('📤 Email:', email.trim().toLowerCase());
      
      const response = await fetch(`${API_URL}/api/auth/login-with-captcha`, {
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
      console.log('📥 Login response status:', response.status);
      console.log('📥 Login response data:', data);

      if (response.ok && data.success) {
        console.log('🔍 Full response data:', JSON.stringify(data, null, 2));
        
        const token = data.data?.accessToken || 
                     data.data?.token || 
                     data.token || 
                     data.data?.access_token;
        
        const user = data.data?.user || data.user;
        
        console.log('🔑 Token found:', token ? '✅ Yes' : '❌ No');
        console.log('👤 User found:', user ? '✅ Yes' : '❌ No');
        
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('userRole', user.role || 'USER');
          localStorage.setItem('userRoleId', String(user.roleId || 2));
          
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }

          console.log('🔑 Stored token:', localStorage.getItem('token') ? '✅ Yes' : '❌ No');
          console.log('👤 Stored user:', localStorage.getItem('user') ? '✅ Yes' : '❌ No');

          const redirectPath = redirectBasedOnRole(user.role, user.roleId);
          console.log(`🔄 Redirecting to: ${redirectPath}`);
          
          setSuccessMessage(`Login Successfully, ${user.name}! `);
          setLoading(false);
          
          setTimeout(() => {
            navigate(redirectPath);
          }, 1500);
        } else {
          console.error('❌ Missing token or user in response:', data);
          setError('Login successful but missing token or user data. Please contact support.');
          setErrorType('error');
          setLoading(false);
          refreshCaptcha();
        }
        
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
      console.error('❌ Login error:', error);
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
    window.location.href = `${API_URL}/api/auth/google`;
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

          {/* Success Message */}
          {successMessage && (
            <div className="success-message">
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Messages */}
          {error && errorType === 'captcha' && (
            <div className="server-error captcha-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {error && errorType === 'invalid' && (
            <div className="server-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {error && errorType === 'unverified' && (
            <div className="verification-error">
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
            <div className="locked-error">
              <FaExclamationCircle />
              <span>
                {error}
                <br />
                {lockTimeLeft > 0 && (
                  <span className="lock-timer">
                    ⏰ {lockTimeLeft} minute{lockTimeLeft > 1 ? 's' : ''} remaining
                  </span>
                )}
                <Link to="/forgot-password" className="resend-link">
                  Reset your password
                </Link>
              </span>
            </div>
          )}

          {error && errorType === 'connection' && (
            <div className="server-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {error && !errorType && (
            <div className="server-error">
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
              placeholder="your@email.com"
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

            {/* ===== CAPTCHA SECTION - Using CSS Classes ===== */}
            <div className="form-group captcha-group">
              <label className="captcha-label">
                <span className="captcha-label-dot"></span>
                Human Verification
              </label>
              <div className="captcha-container">
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
                className={`captcha-input ${captchaError ? 'captcha-input-error' : ''}`}
                disabled={loading || errorType === 'locked'}
                autoComplete="off"
                maxLength="6"
              />
              {captchaError && (
                <span className="captcha-error-text">{captchaError}</span>
              )}
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

          <div className="auth-divider">
            <hr />
            <span>or continue with</span>
            <hr />
          </div>

          <button 
            className="btn-google" 
            onClick={handleGoogleLogin}
            disabled={loading || errorType === 'locked'}
          >
            <FaGoogle size={20} /> 
            {loading ? 'Loading...' : 'Continue with Google'}
          </button>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
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