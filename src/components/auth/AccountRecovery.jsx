// src/components/auth/AccountRecovery.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaLock, 
  FaSpinner, 
  FaExclamationCircle, 
  FaIdCard,
  FaKey,
  FaQuestionCircle,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaUser,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import Footer from '../common/Footer';
import '../../styles/components/forgotpassword.css';
import logo from '../../assets/images/small Mki.png';
import { API } from '../../config/api'; 

const AccountRecovery = () => {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1 State
  const [idNumber, setIdNumber] = useState('');
  const [questions, setQuestions] = useState([]);
  
  // Step 2 State
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  
  // Step 3 State
  const [learnerName, setLearnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 

  // Controls the flow: 1 = Enter ID, 2 = Answer Questions, 3 = Reset Details
  const [step, setStep] = useState(1); 

  // LOCKOUT STATE
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  // Countdown timer effect for lockout
  useEffect(() => {
    if (lockoutTimeLeft > 0) {
      const timer = setInterval(() => {
        setLockoutTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setError(''); // Clear error when lockout expires
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTimeLeft]);

  // Password Requirements Logic
  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'lowercase', label: 'At least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'uppercase', label: 'At least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'number', label: 'At least one number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', label: 'At least one special character (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) }
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.test(newPassword));

  const handleIdChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    setIdNumber(numericValue);
    setError('');
  };

  // STEP 1
  const handleFindAccount = async (e) => {
    e.preventDefault();
    if (!idNumber.trim()) { setError('ID Number is required'); return; }
    if (!/^\d{13}$/.test(idNumber)) { setError('Please enter a valid 13-digit South African ID number.'); return; }

    setError(''); setIsLoading(true);

    try {
      const response = await fetch(API.auth.getRecoveryQuestions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: idNumber.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setQuestions(data.data);
        setStep(2); 
      } else {
        setError(data.message || 'No account found with this ID number.');
      }
    } catch (error) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2
  const handleVerifyAnswers = async (e) => {
    e.preventDefault();
    if (!answers.q1 || !answers.q2 || !answers.q3) { setError('Please answer all questions'); return; }
    if (lockoutTimeLeft > 0) return; // Prevent submission if locked

    setError(''); setIsLoading(true);

    try {
      const response = await fetch(API.auth.verifyAnswers, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_number: idNumber.trim(),
          security_answer_1: answers.q1,
          security_answer_2: answers.q2,
          security_answer_3: answers.q3
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data && data.data.name) {
          setLearnerName(`${data.data.name} ${data.data.surname}`);
        }
        setStep(3); 
      } else {
        // If the backend says they are locked out, start the countdown
        if (response.status === 403) {
          // Extract the minutes from the message (e.g., "try again in 3 minute(s)")
          const match = data.message.match(/(\d+)\s*minute/);
          const minutes = match ? parseInt(match[1]) : 3;
          setLockoutTimeLeft(minutes * 60); 
        }
        setError(data.message || 'One or more answers are incorrect.');
      }
    } catch (error) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3
  const handleResetDetails = async (e) => {
    e.preventDefault();
    if (!allRequirementsMet) { 
      setError('Please ensure your password meets all requirements.'); 
      return; 
    }

    setError(''); setIsLoading(true);

    try {
      const response = await fetch(API.auth.recoverAccount, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_number: idNumber.trim(),
          new_email: newEmail.trim() || null,
          new_phone: newPhone.trim() || null,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setMessage('Account recovered! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to recover account.');
      }
    } catch (error) {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format time (e.g. 180 -> "3:00")
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

          <h2>Account Recovery</h2>
          
          {success && (
            <div className="success-message" style={{ background: '#d4edda', color: '#155724', padding: '12px 16px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #c3e6cb' }}>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #f5c6cb' }}>
              <FaExclamationCircle style={{ color: '#721c24' }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter ID */}
          {step === 1 && (
            <>
              <p className="subtitle">
                Enter your South African ID number to find your account.
              </p>
              <form className="forgot-password-form" onSubmit={handleFindAccount}>
                <div className="form-group">
                  <label htmlFor="idNumber">South African ID Number</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <FaIdCard 
                      className="input-icon" 
                      style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} 
                    />
                    <input
                      type="text"
                      id="idNumber"
                      value={idNumber}
                      onChange={handleIdChange}
                      placeholder="Enter your 13-digit ID"
                      maxLength="13"
                      disabled={isLoading}
                      style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? <><FaSpinner className="spinner" /> Searching...</> : 'Find My Account'}
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Verify Identity */}
          {step === 2 && (
            <>
              <p className="subtitle">
                Answer your security questions to verify your identity.
              </p>
              
              {/* LOCKOUT TIMER MESSAGE */}
              {lockoutTimeLeft > 0 && (
                <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #fecaca', fontWeight: 'bold' }}>
                  <FaLock /> 
                  Account Locked. Try again in {formatTime(lockoutTimeLeft)}
                </div>
              )}

              <form className="forgot-password-form" onSubmit={handleVerifyAnswers}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaQuestionCircle style={{ color: '#64748b' }}/> {questions[0]}
                  </label>
                  <input type="text" className="input-field" value={answers.q1} onChange={(e) => setAnswers({ ...answers, q1: e.target.value })} required placeholder="Your Answer" disabled={lockoutTimeLeft > 0} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaQuestionCircle style={{ color: '#64748b' }}/> {questions[1]}
                  </label>
                  <input type="text" className="input-field" value={answers.q2} onChange={(e) => setAnswers({ ...answers, q2: e.target.value })} required placeholder="Your Answer" disabled={lockoutTimeLeft > 0} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaQuestionCircle style={{ color: '#64748b' }}/> {questions[2]}
                  </label>
                  <input type="text" className="input-field" value={answers.q3} onChange={(e) => setAnswers({ ...answers, q3: e.target.value })} required placeholder="Your Answer" disabled={lockoutTimeLeft > 0} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading || lockoutTimeLeft > 0}>
                  {isLoading ? <><FaSpinner className="spinner" /> Verifying...</> : 'Verify Answers'}
                </button>
                
                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', marginTop: '15px', cursor: 'pointer', width: '100%', textDecoration: 'underline' }}>
                  Use a different ID number
                </button>
              </form>
            </>
          )}

          {/* STEP 3: Reset Details */}
          {step === 3 && !success && (
            <>
              <h2 style={{ color: '#10b981', marginBottom: '5px' }}>Identity Verified <FaCheckCircle /></h2>
              <p className="subtitle">
                You can now update your contact details and reset your password.
              </p>
              <form className="forgot-password-form" onSubmit={handleResetDetails}>
                
                <div className="form-group">
                  <label>Learner Name</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <FaUser className="input-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      value={learnerName}
                      readOnly
                      disabled
                      style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Email Address (Optional)</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <FaEnvelope className="input-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Leave blank to keep current email"
                      style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Phone Number (Optional)</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <FaPhone className="input-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Leave blank to keep current phone"
                      style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <label>New Password <span style={{ color: 'red' }}>*</span></label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <FaKey className="input-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength="8"
                      placeholder="Enter new password"
                      disabled={isLoading}
                      style={{ width: '100%', padding: '10px 40px 10px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {newPassword && !allRequirementsMet && (
                    <div className="password-requirements" style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <p className="requirements-title" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Password must contain:</p>
                      <ul className="requirements-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {passwordRequirements.map((req) => {
                          const met = req.test(newPassword);
                          return (
                            <li key={req.id} className={met ? 'met' : 'unmet'} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: met ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
                              {met ? <FaCheckCircle className="req-icon met-icon" /> : <span className="req-icon unmet-icon">○</span>}
                              {req.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading || !allRequirementsMet}>
                  {isLoading ? <><FaSpinner className="spinner" /> Updating...</> : 'Save & Recover Account'}
                </button>
              </form>
            </>
          )}

          <div className="back-to-login" style={{ marginTop: '20px' }}>
            <Link to="/forgot-password">
              <FaArrowLeft style={{ marginRight: '0.5rem' }} />
              Back to Email Recovery
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AccountRecovery;