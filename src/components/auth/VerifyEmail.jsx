// src/components/auth/VerifyEmail.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner, FaExclamationCircle, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import logo from '../../assets/images/small Mki.png';

const API_URL = 'http://localhost:5000/api';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Get email from location state
    if (location.state?.email) {
      setEmail(location.state.email);
    }

    // Check if there's a token in URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      verifyEmail(token);
    } else {
      setLoading(false);
      // Show waiting for verification message
      setError('');
    }
  }, [location]);

  // Auto-redirect after verification
  useEffect(() => {
    if (verified) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login', { 
              state: { 
                message: '✅ Email verified successfully! You can now login.' 
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [verified, navigate]);

  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/verify/${token}`);
      
      if (response.data.status === 'success') {
        setVerified(true);
        if (response.data.data) {
          setEmail(response.data.data.email);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Verification failed. Please try again.';
      setError(errorMsg);
      
      if (errorMsg.includes('Invalid') || errorMsg.includes('expired')) {
        const params = new URLSearchParams(location.search);
        const emailParam = params.get('email');
        if (emailParam) {
          setEmail(emailParam);
        }
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setError('Please provide your email address');
      return;
    }

    try {
      setResending(true);
      setResendMessage('');
      setError('');

      const response = await axios.post(`${API_URL}/auth/resend-verification`, { email });
      
      if (response.data.status === 'success') {
        setResendMessage('✅ Verification email resent successfully! Check your inbox.');
        setTimeout(() => {
          setResendMessage('');
        }, 5000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to resend verification email.';
      setError(errorMsg);
    } finally {
      setResending(false);
    }
  };

  // ============================================
  // STATE 1: LOADING - Token being verified
  // ============================================
  if (loading) {
    return (
      <div className="verify-page" style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5'
      }}>
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="logo">
              <img src={logo} alt="IIK Portal Logo" />
              <span className="logo-text">Learner Certificate Portal</span>
            </div>
            <div style={{ marginTop: '30px' }}>
              <FaSpinner className="spinner" style={{ 
                fontSize: '48px', 
                color: '#1a73e8',
                animation: 'spin 1s linear infinite'
              }} />
              <h3 style={{ marginTop: '20px', color: '#333' }}>Verifying your email...</h3>
              <p style={{ color: '#666' }}>Please wait while we confirm your account.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 2: SUCCESS - Email Verified ✅
  // ============================================
  if (verified) {
    return (
      <div className="verify-page" style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5'
      }}>
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', maxWidth: '450px' }}>
            <div className="logo">
              <img src={logo} alt="IIK Portal Logo" />
              <span className="logo-text">Learner Certificate Portal</span>
            </div>
            
            <div style={{ marginTop: '30px' }}>
              <FaCheckCircle style={{ fontSize: '64px', color: '#28a745' }} />
              <h3 style={{ marginTop: '20px', color: '#28a745' }}>Email Verified! ✅</h3>
              <p style={{ color: '#555', fontSize: '16px' }}>
                Your email has been successfully verified.
              </p>
              <p style={{ color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>
                Your account is now active! You can now log in.
              </p>
              
              {email && (
                <p style={{ color: '#666', fontSize: '14px' }}>
                  <strong>Email:</strong> {email}
                </p>
              )}
              
              <div style={{
                background: '#e8f5e9',
                padding: '12px',
                borderRadius: '6px',
                margin: '20px 0'
              }}>
                <p style={{ color: '#2e7d32', margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                  🔄 Redirecting to login in {countdown} seconds...
                </p>
              </div>
              
              <button
                onClick={() => navigate('/login', { 
                  state: { 
                    message: '✅ Email verified successfully! You can now login.' 
                  }
                })}
                style={{
                  padding: '12px 40px',
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1557b0'}
                onMouseLeave={(e) => e.target.style.background = '#1a73e8'}
              >
                Go to Login Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 3: AWAITING VERIFICATION - Email sent, waiting for user to click link
  // ============================================
  if (!loading && !verified && !error && email) {
    return (
      <div className="verify-page" style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5'
      }}>
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', maxWidth: '450px' }}>
            <div className="logo">
              <img src={logo} alt="IIK Portal Logo" />
              <span className="logo-text">Learner Certificate Portal</span>
            </div>
            
            <div style={{ marginTop: '30px' }}>
              <FaEnvelope style={{ fontSize: '64px', color: '#1a73e8' }} />
              <h3 style={{ marginTop: '20px', color: '#333' }}>📧 Check Your Email</h3>
              <p style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
                We've sent a verification link to:
              </p>
              
              <div style={{
                background: '#e3f2fd',
                padding: '12px',
                borderRadius: '6px',
                margin: '15px 0'
              }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1565c0', margin: 0 }}>
                  {email}
                </p>
              </div>
              
              <p style={{ fontSize: '14px', color: '#777' }}>
                Please click the link in the email to verify your account.
              </p>
              
              <div style={{
                background: '#fff3cd',
                padding: '15px',
                borderRadius: '6px',
                margin: '20px 0',
                borderLeft: '4px solid #ffc107'
              }}>
                <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
                  ⏰ The verification link expires in <strong>24 hours</strong>.
                </p>
              </div>
              
              <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <p style={{ fontSize: '14px', color: '#777', margin: '0 0 10px 0' }}>
                  Didn't receive the email?
                </p>
                <button 
                  className="btn-primary"
                  onClick={resendVerification}
                  disabled={resending}
                  style={{
                    padding: '10px 30px',
                    background: '#1a73e8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    opacity: resending ? 0.7 : 1,
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1557b0'}
                  onMouseLeave={(e) => e.target.style.background = '#1a73e8'}
                >
                  {resending ? 'Sending...' : '🔄 Resend Verification Email'}
                </button>
                
                {resendMessage && (
                  <p style={{ color: '#28a745', marginTop: '10px', fontSize: '14px' }}>
                    {resendMessage}
                  </p>
                )}
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <Link 
                  to="/login" 
                  style={{
                    display: 'inline-block',
                    padding: '10px 30px',
                    background: '#6c757d',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.background = '#6c757d'}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 4: ERROR - Token invalid or expired
  // ============================================
  if (error) {
    return (
      <div className="verify-page" style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f5f5'
      }}>
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', maxWidth: '450px' }}>
            <div className="logo">
              <img src={logo} alt="IIK Portal Logo" />
              <span className="logo-text">Learner Certificate Portal</span>
            </div>
            
            <div style={{ marginTop: '30px' }}>
              <FaExclamationCircle style={{ fontSize: '64px', color: '#dc3545' }} />
              <h3 style={{ marginTop: '20px', color: '#dc3545' }}>Verification Failed</h3>
              <p style={{ color: '#dc3545', fontSize: '16px' }}>{error}</p>
              
              {(email || location.state?.email) && (
                <div style={{ marginTop: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#555' }}>
                    We sent a verification link to: 
                    <br />
                    <strong style={{ color: '#333' }}>{email || location.state?.email}</strong>
                  </p>
                  
                  <button 
                    className="btn-primary"
                    onClick={resendVerification}
                    disabled={resending}
                    style={{
                      marginTop: '15px',
                      padding: '10px 30px',
                      background: '#1a73e8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: resending ? 'not-allowed' : 'pointer',
                      opacity: resending ? 0.7 : 1
                    }}
                  >
                    {resending ? 'Sending...' : '🔄 Resend Verification Email'}
                  </button>
                  
                  {resendMessage && (
                    <p style={{ color: '#28a745', marginTop: '10px', fontSize: '14px' }}>
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}
              
              <div style={{ marginTop: '20px' }}>
                <Link 
                  to="/login" 
                  style={{
                    display: 'inline-block',
                    padding: '10px 30px',
                    background: '#6c757d',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'background 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                  onMouseLeave={(e) => e.target.style.background = '#6c757d'}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 5: DEFAULT - No token, show email sent message
  // ============================================
  return (
    <div className="verify-page" style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f5f5'
    }}>
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: '450px' }}>
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>
          
          <div style={{ marginTop: '30px' }}>
            <FaEnvelope style={{ fontSize: '64px', color: '#1a73e8' }} />
            <h3 style={{ color: '#333' }}>📧 Check Your Email</h3>
            <p style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
              We've sent a verification link to your email address.
            </p>
            <p style={{ fontSize: '14px', color: '#777' }}>
              Please click the link in the email to verify your account.
            </p>
            
            {email && (
              <div style={{
                background: '#e3f2fd',
                padding: '12px',
                borderRadius: '6px',
                margin: '15px 0'
              }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1565c0', margin: 0 }}>
                  📧 {email}
                </p>
              </div>
            )}
            
            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <p style={{ fontSize: '14px', color: '#777', margin: '0 0 10px 0' }}>
                Didn't receive the email?
              </p>
              <button 
                className="btn-primary"
                onClick={resendVerification}
                disabled={resending}
                style={{
                  padding: '10px 30px',
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: resending ? 'not-allowed' : 'pointer',
                  opacity: resending ? 0.7 : 1,
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1557b0'}
                onMouseLeave={(e) => e.target.style.background = '#1a73e8'}
              >
                {resending ? 'Sending...' : '🔄 Resend Verification Email'}
              </button>
              
              {resendMessage && (
                <p style={{ color: '#28a745', marginTop: '10px', fontSize: '14px' }}>
                  {resendMessage}
                </p>
              )}
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <Link 
                to="/login" 
                style={{
                  display: 'inline-block',
                  padding: '10px 30px',
                  background: '#6c757d',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                onMouseLeave={(e) => e.target.style.background = '#6c757d'}
              >
                Back to Login
              </Link>
            </div>
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;