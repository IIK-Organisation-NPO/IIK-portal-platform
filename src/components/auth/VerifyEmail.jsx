import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// Import the CSS styles for this component
import "/src/styles/components/VerifyEmail.css";
// Import the logo image - adjust the path based on your project structure
import logo from '../../assets/images/small Mki.png';

/**
 * VerifyEmail Component
 * 
 * This component handles the email verification process after user signup.
 * It allows users to enter a 6-digit verification code sent to their email,
 * with a 60-second resend timer and success animation upon verification.
 */
const VerifyEmail = () => {
  // State to store the 6-digit verification code as an array of strings
  const [code, setCode] = useState(['', '', '', '', '', '']);
  
  // Timer state for the resend cooldown (starts at 60 seconds)
  const [timer, setTimer] = useState(60);
  
  // Boolean to track if the resend button should be disabled
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  
  // Boolean to track if the email has been successfully verified
  const [isVerified, setIsVerified] = useState(false);
  
  // String to store and display error messages
  const [error, setError] = useState('');
  
  // Reference to the input elements for programmatic focus management
  const inputRefs = useRef([]);

  /**
   * Auto-focus the first input field when the component mounts
   * This improves user experience by allowing immediate typing
   */
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  /**
   * Timer logic that handles the 60-second countdown
   * The timer decrements every second until it reaches 0,
   * then enables the resend button
   */
  useEffect(() => {
    let interval = null;
    // Only run the timer if resend is disabled and timer is greater than 0
    if (isResendDisabled && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      // Enable the resend button when timer reaches 0
      setIsResendDisabled(false);
      clearInterval(interval);
    }
    // Cleanup the interval on component unmount or when dependencies change
    return () => clearInterval(interval);
  }, [isResendDisabled, timer]);

  /**
   * Handles changes to individual digit inputs
   * @param {number} index - The index of the input field (0-5)
   * @param {string} value - The new value entered by the user
   */
  const handleChange = (index, value) => {
    // Prevent entering more than one character
    if (value.length > 1) return;

    // Update the code array with the new digit
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // Clear any previous error messages
    setError('');

    // Auto-advance to the next input field if a digit was entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  /**
   * Handles keyboard navigation for the input fields
   * @param {number} index - The index of the current input field
   * @param {object} e - The keyboard event object
   */
  const handleKeyDown = (index, e) => {
    // Move to the previous input field when backspace is pressed
    // and the current field is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  /**
   * Handles pasting of the verification code
   * Allows users to paste the entire 6-digit code at once
   * @param {object} e - The paste event object
   */
  const handlePaste = (e) => {
    e.preventDefault();
    // Get the pasted text and limit to 6 characters
    const paste = e.clipboardData.getData('text').slice(0, 6);
    // Check if the pasted content is exactly 6 digits
    if (/^\d{6}$/.test(paste)) {
      const pasteArray = paste.split('');
      setCode(pasteArray);
      // Focus the last input field after successful paste
      inputRefs.current[5].focus();
    }
  };

  /**
   * Handles the verification process when the user clicks "Verify Email"
   * Validates the entered code and simulates API verification
   */
  const handleVerify = () => {
    // Combine the code array into a single string
    const enteredCode = code.join('');
    
    // Validate that all 6 digits are entered
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    // Mock verification - in production, this would make an API call
    // For demo purposes, "123456" is the valid code
    if (enteredCode === '123456') {
      setIsVerified(true);
      setError('');
      // The success animation will be shown via the conditional rendering below
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  /**
   * Handles the resend functionality when the user requests a new code
   * Resets the timer and clears the input fields
   */
  const handleResend = () => {
    // In production, you would make an API call here to resend the code
    
    // Reset the timer to 60 seconds
    setTimer(60);
    // Disable the resend button again
    setIsResendDisabled(true);
    // Clear all input fields
    setCode(['', '', '', '', '', '']);
    // Clear any previous error messages
    setError('');
    
    // Focus the first input field for better UX
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Show confirmation to the user (in production, use a toast notification)
    alert('A new verification code has been sent to your email.');
  };

  /**
   * Conditional rendering for the success state
   * When isVerified is true, display the success overlay with animation
   */
  if (isVerified) {
    return (
      <div className="verify-email-container">
        {/* Success overlay with animation */}
        <div className="success-overlay">
          <div className="success-modal">
            {/* Animated checkmark icon using SVG */}
            <div className="checkmark-wrapper">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified. You can now access your portal.</p>
            {/* Link to dashboard after successful verification */}
            <Link to="/Homepage" className="btn-primary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Main render for the verification form
   * Displayed when the user hasn't been verified yet
   */
  return (
    <div className="verify-email-container">
      {/* Header section with logo and navigation */}
      <header className="verify-email-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          {/* Navigation links */}
          <nav className="header-nav">
            <Link to="/Homepage">Home</Link>
            <a
              href="https://www.iik.co.za/contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
            <Link to="/Blog">Blog</Link>
          </nav>
        </div>
      </header>

      {/* Main content - verification card */}
      <div className="verify-content">
        <div className="verify-card">
          <h1>Verify Your Email</h1>
          <p className="verify-description">
            We have sent a verification code to your registered email address.
            Please enter the 6-digit code below to confirm and activate your portal access.
          </p>
          
          {/* Display the email where the code was sent */}
          <div className="email-display">
            <span className="email-icon">✉</span>
            <span className="email-address">Verification code sent to ***@example.com</span>
          </div>

          {/* Six individual input fields for the verification code */}
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
              />
            ))}
          </div>

          {/* Error message display */}
          {error && <p className="error-message">{error}</p>}

          {/* Verify email button */}
          <button onClick={handleVerify} className="btn-primary verify-btn">
            Verify Email
          </button>

          {/* Resend section with timer */}
          <div className="resend-section">
            <p>
              Didn't receive the email?{' '}
              <button
                onClick={handleResend}
                disabled={isResendDisabled}
                className={`resend-link ${isResendDisabled ? 'disabled' : ''}`}
              >
                Resend Code
              </button>
              {/* Show the timer countdown when resend is disabled */}
              {isResendDisabled && <span className="timer"> ({timer}s)</span>}
            </p>
            <p className="password-hint">(Password in OO-45)</p>
          </div>

          {/* Back to login link */}
          <Link to="/login" className="back-link">← Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;