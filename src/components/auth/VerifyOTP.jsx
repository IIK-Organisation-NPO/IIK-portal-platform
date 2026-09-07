// src/components/auth/VerifyOTP.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Footer from '../common/Footer';
import '../../styles/components/forgotpassword.css';
import logo from '../../assets/images/small Mki.png';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'e****@example.com';

  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    // Start timer
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
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 5);
    const digits = pastedData.replace(/\D/g, '').split('');

    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 5) {
        newOtp[index] = digit;
      }
    });
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextIndex = digits.length < 5 ? digits.length : 4;
    inputRefs.current[nextIndex].focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 5) {
      setError('Please enter the complete 5-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulate API verification
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to reset password page
      navigate('/reset-password', { state: { email } });
    }, 1500);
  };

  const handleResend = () => {
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '']);
    setError('');
    inputRefs.current[0].focus();
    // Simulate resend API call
    console.log('Resending OTP to:', email);
  };

  return (
    <div className="verify-otp-page">
      {/* Header */}
      <header className="verify-otp-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>IIK Portal</span>
          </div>

        </div>
      </header>

      {/* Verify OTP Form */}
      <div className="verify-otp-container">
        <div className="verify-otp-card">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>Verify OTP</h2>
          <p className="subtitle">
            Enter the 5-digit code sent to your email address
          </p>

          <div className="otp-email-display">
            Code sent to <a href={`mailto:${email}`}>{email}</a>
          </div>

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
                    className={error ? 'error' : ''}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              {error && <span className="error-text" style={{ textAlign: 'center' }}>{error}</span>}
            </div>

            <div className="resend-section">
              Didn't receive the code?{' '}
              {canResend ? (
                <Link to="#" onClick={handleResend}>Resend Code</Link>
              ) : (
                <span>
                  Resend in <span className="timer">{String(timer).padStart(2, '0')}</span>
                </span>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="back-to-login">
            <Link to="/login">
              <FaArrowLeft style={{ marginRight: '0.5rem' }} />
              Back to login
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
};

export default VerifyOTP;