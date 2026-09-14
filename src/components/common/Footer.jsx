// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="learner-footer">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 style={{ color: 'white' }}>IIK Portal</h3>
            <p>Accredited digital and business enablement training for corporate professionals and career-driven individuals.</p>
          </div>
          <div>
            <h4>LEGAL</h4>
            <div className="footer-links">
              <Link to="#">Privacy Policy</Link>
              <Link to="#">Terms of Service</Link>
              <Link to="#">POPIA Compliance</Link>
            </div>
          </div>
          <div>
            <h4>CONTACT INFO</h4>
            <div className="footer-links">
              <a href="mailto:info@ik.edu.za">info@ik.edu.za</a>
              <a href="tel:+2710114567890">+27 10 11 456 7890</a>
              <span>Johannesburg, South Africa</span>
            </div>
          </div>

        </div>
        <div className="footer-bottom">
          <span>© 2025 IIK Learner Certificate Portal. All rights reserved.</span>
          <span className="badge">South African QA Accredited Platform</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;  // <--- THIS LINE IS CRITICAL!