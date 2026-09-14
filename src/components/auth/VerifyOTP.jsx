// src/components/auth/VerifyOTP.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaClock } from 'react-icons/fa';
import Footer from '../common/Footer';
import '../../styles/components/forgotpassword.css';
import logo from '../../assets/images/small Mki.png';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const fullName = location.state?.fullName || '';
  const isGoogleUser = location.state?.isGoogleUser || false;
  const purpose = location.state?.purpose || 'password_reset';
  const userId = location.state?.userId || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!email) {
      if (purpose === 'signup') {
        navigate('/signup');
      } else {
        navigate('/forgot-password');
      }
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email, navigate, purpose]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setError('');
    setSuccess(false);
    
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.replace(/\D/g, '').split('');

    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    setOtp(newOtp);

    const nextIndex = digits.length < 6 ? digits.length : 5;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);
    setMessage('');

    try {
      let endpoint = '';
      let body = {};
      
      if (purpose === 'signup') {
        setError('Signup verification uses email link, not OTP. Please check your email.');
        setIsLoading(false);
        return;
      } else {
        endpoint = `${API_URL}/api/auth/verify-password-reset-otp`;
        body = { email, otpCode };
      }

      console.log(`📤 Verifying OTP for purpose: ${purpose}`);
      console.log(`📤 Endpoint: ${endpoint}`);
      console.log(`📤 Body:`, body);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage('OTP verified successfully!');
        setIsLoading(false);
        
        setTimeout(() => {
          navigate('/reset-password', { 
            state: { 
              resetToken: data.data?.resetToken,
              email: email,
              userId: data.data?.userId
            } 
          });
        }, 2000);
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
        setIsLoading(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Failed to verify OTP. Please check your connection.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess(false);
    setMessage('');

    try {
      let endpoint = '';
      
      if (purpose === 'signup') {
        endpoint = `${API_URL}/api/auth/resend-verification`;
      } else {
        endpoint = `${API_URL}/api/auth/resend-password-reset-otp`;
      }

      console.log(`📤 Resending for purpose: ${purpose}`);
      console.log(`📤 Endpoint: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (purpose === 'signup') {
          setMessage('New verification link sent to your email! Please check your inbox.');
        } else {
          setMessage('New OTP sent to your email!');
        }
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Failed to resend');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const getTitle = () => {
    if (purpose === 'signup') {
      return 'Verify Your Email';
    }
    return 'Verify OTP';
  };

  const getSubtitle = () => {
    if (purpose === 'signup') {
      return 'Check your email for the verification link to complete registration';
    }
    return 'Enter the 6-digit code sent to your email address to reset your password';
  };

  const getButtonText = () => {
    if (purpose === 'signup') {
      return 'Check Email';
    }
    return 'Verify Code';
  };

  const isSignup = purpose === 'signup';

  return (
    <div className="verify-otp-page">
      <header className="verify-otp-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>IIK Portal</span>
          </div>
        </div>
      </header>

      <div className="verify-otp-container">
        <div className="verify-otp-card">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>{getTitle()}</h2>
          <p className="subtitle">
            {getSubtitle()}
          </p>

          {isGoogleUser && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#e8f0fe',
              padding: '6px 14px',
              borderRadius: '20px',
              marginBottom: '10px',
              fontSize: '14px',
              color: '#667eea',
              textAlign: 'center',
              width: '100%',
              justifyContent: 'center'
            }}>
              <span>🔵 Signed in with Google</span>
            </div>
          )}

          <div className="otp-email-display">
            {isSignup ? 'Verification link sent to' : 'Code sent to'} <strong>{email}</strong>
          </div>

          {/* Success Message - No icon */}
          {success && (
            <div className="success-message" style={{ 
              background: '#d4edda', 
              color: '#155724', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '1px solid #c3e6cb'
            }}>
              <span>{message}</span>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="server-error">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Info Message - No icon */}
          {message && !success && !error && (
            <div className="info-message" style={{ 
              background: '#e3f2fd', 
              color: '#0d47a1', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '1px solid #90caf9'
            }}>
              <span>{message}</span>
            </div>
          )}

          {!success && (
            <>
              {isSignup ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '30px',
                    color: 'white'
                  }}>
                    <span>✉️</span>
                  </div>
                  <p style={{ color: '#555', marginBottom: '15px' }}>
                    We've sent a verification link to <strong>{email}</strong>
                  </p>
                  <p style={{ color: '#888', fontSize: '14px' }}>
                    Please check your email and click the verification link to complete your registration.
                  </p>
                  <div style={{
                    background: '#fff3cd',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    margin: '20px 0',
                    border: '1px solid #ffc107',
                    textAlign: 'left',
                    fontSize: '14px'
                  }}>
                    <strong>💡 Didn't receive the email?</strong>
                    <ul style={{ margin: '10px 0 0 20px', color: '#856404' }}>
                      <li>Check your <strong>spam folder</strong></li>
                      <li>Wait a few minutes and try again</li>
                      <li>Click "Resend Verification" below</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <form className="verify-otp-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Secure Verification Code</label>
                    <div className="otp-input-container">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          className={`otp-input-box ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
                          disabled={isLoading || resendLoading}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    {error && <span className="error-text" style={{ textAlign: 'center' }}>{error}</span>}
                    <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '8px' }}>
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <div className="resend-section">
                    <FaClock className="timer-icon" />
                    Didn't receive the code?{' '}
                    {canResend ? (
                      <button 
                        type="button"
                        onClick={handleResend} 
                        className="resend-btn"
                        disabled={resendLoading}
                      >
                        {resendLoading ? <FaSpinner className="spinner" /> : 'Resend Code'}
                      </button>
                    ) : (
                      <span>
                        Resend in <span className="timer">{String(timer).padStart(2, '0')}s</span>
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isLoading || otp.join('').length !== 6 || resendLoading}
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="spinner" />
                        Verifying...
                      </>
                    ) : (
                      getButtonText()
                    )}
                  </button>
                </form>
              )}

              {isSignup && (
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <button 
                    type="button"
                    onClick={handleResend} 
                    className="resend-btn"
                    disabled={resendLoading || !canResend}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: canResend ? '#667eea' : '#999',
                      fontSize: '14px',
                      cursor: canResend ? 'pointer' : 'not-allowed',
                      padding: '8px 16px'
                    }}
                  >
                    {resendLoading ? (
                      <>
                        <FaSpinner className="spinner" />
                        Sending...
                      </>
                    ) : (
                      canResend ? 'Resend Verification Email' : `Resend in ${timer}s`
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="back-to-login">
            <Link to={isSignup ? '/login' : '/login'}>
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

export default VerifyOTP;