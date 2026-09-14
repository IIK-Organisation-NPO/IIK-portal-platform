import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import "/src/styles/components/VerifyEmail.css";
import logo from '../../assets/images/small Mki.png';
import api from '../../services/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    const email = location.state?.email || sessionStorage.getItem('verifyEmail') || '';
    console.log('📧 Email from location/state:', email);
    setUserEmail(email);
    
    if (email) {
      sendOTP(email);
    } else {
      setError('No email found. Please try registering again.');
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isResendDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isResendDisabled, timer]);

  const sendOTP = async (email) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('📤 Sending OTP to:', email);
      console.log('🔗 API URL:', '/auth/send-otp');
      
      const response = await api.post('/auth/send-otp', { email });
      
      console.log('📥 Response:', response.data);
      
      if (response.data.success) {
        console.log('✅ OTP sent successfully');
        setTimer(60);
        setIsResendDisabled(true);
      } else {
        setError(response.data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error sending OTP:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(paste)) {
      const pasteArray = paste.split('');
      setCode(pasteArray);
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join('');
    
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    if (!/^\d{6}$/.test(enteredCode)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('🔐 Verifying OTP for:', userEmail);
      console.log('🔑 OTP:', enteredCode);

      const response = await api.post('/auth/verify-otp', {
        email: userEmail,
        otp: enteredCode
      });

      console.log('📥 Verify response:', response.data);

      if (response.data.success) {
        setIsVerified(true);
        sessionStorage.setItem('isVerified', 'true');
        sessionStorage.removeItem('verifyEmail');
      } else {
        setError(response.data.message || 'Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error verifying OTP:', err);
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userEmail) {
      setError('Email not found. Please try registering again.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔄 Resending OTP to:', userEmail);
      
      const response = await api.post('/auth/resend-otp', { email: userEmail });
      
      console.log('📥 Resend response:', response.data);
      
      if (response.data.success) {
        setTimer(60);
        setIsResendDisabled(true);
        setCode(['', '', '', '', '', '']);
        setError('');
        
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
        
        console.log('✅ New OTP sent successfully');
      } else {
        setError(response.data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error resending OTP:', err);
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="verify-email-container">
        <div className="success-overlay">
          <div className="success-modal">
            <div className="checkmark-wrapper">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified. You can now access your portal.</p>
            <Link to="/Login" className="btn-primary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const maskEmail = (email) => {
    if (!email) return 'your email';
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    const maskedUsername = username.slice(0, 2) + '*'.repeat(Math.min(username.length - 2, 4));
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="verify-email-container">
      <header className="verify-email-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <nav className="header-nav">
            <Link to="/Login">Login</Link>
            <a href="https://www.iik.co.za/contact-us" target="_blank" rel="noopener noreferrer">
              Contact
            </a>
            <Link to="/blog">Blog</Link>
          </nav>
        </div>
      </header>

      <div className="verify-content">
        <div className="verify-card">
          <h1>Verify Your Email</h1>
          <p className="verify-description">
            We have sent a 6-digit verification code to your registered email address.
            Please enter the code below to confirm and activate your portal access.
          </p>
          
          <div className="email-display">
            <span className="email-icon">✉</span>
            <span className="email-address">
              Verification code sent to {maskEmail(userEmail)}
            </span>
          </div>

          <div className="code-input-group">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                ref={(el) => (inputRefs.current[index] = el)}
                className="code-input"
                aria-label={`Digit ${index + 1}`}
                disabled={isLoading}
                autoComplete="off"
              />
            ))}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            onClick={handleVerify} 
            className="btn-primary verify-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="resend-section">
            <p>
              Didn't receive the email?{' '}
              <button
                onClick={handleResend}
                disabled={isResendDisabled || isLoading}
                className={`resend-link ${isResendDisabled ? 'disabled' : ''}`}
              >
                {isLoading ? 'Sending...' : 'Resend Code'}
              </button>
              {isResendDisabled && <span className="timer"> ({timer}s)</span>}
            </p>
          </div>

          <Link to="/Login" className="back-link">← Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;