// src/components/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaLock, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import Footer from '../common/Footer';
import '../../styles/components/forgotpassword.css';
import logo from '../../assets/images/small Mki.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage('OTP sent to your email! Please check your inbox.');
        
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { 
              email: email.trim().toLowerCase(),
              from: 'forgot-password'
            } 
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Failed to connect to server. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <header className="forgot-password-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>IIK Portal</span>
          </div>
        </div>
      </header>

      <div className="forgot-password-container">
        <div className="forgot-password-card">
          
          <div className="icon-container">
            <div className="lock-icon-wrapper">
              <FaLock size={40} color="#000000" />
            </div>
          </div>

          <h2>Forgot Password?</h2>
          <p className="subtitle">
            No worries. Enter your email address and we'll send you an OTP to reset your password.
          </p>

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
          {error && (
            <div className="error-message" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#f8d7da',
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid #f5c6cb'
            }}>
              <FaExclamationCircle style={{ color: '#721c24' }} />
              <span>{error}</span>
            </div>
          )}

          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setSuccess(false);
                  }}
                  placeholder="Enter your email address"
                  className={error ? 'error' : ''}
                  disabled={isLoading || success}
                />
              </div>
              {error && <span className="error-text">{error}</span>}
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="spinner" />
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
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

      <Footer />
    </div>
  );
};

export default ForgotPassword;