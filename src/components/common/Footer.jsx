// src/components/common/Footer.jsx
import React from 'react';

// TODO: replace with the official IIK social media page URLs
const socialLinks = [
  { label: 'Facebook', href: 'https://web.facebook.com/profile.php?id=61580379807189', icon: 'fa-facebook-f' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/iik-organisation-npo', icon: 'fa-linkedin-in' },
  { label: 'Instagram', href: 'https://www.instagram.com/iik_organisation/', icon: 'fa-instagram' },
  { label: 'YouTube', href: 'http://www.youtube.com/@IIKOrganisation', icon: 'fa-youtube' },
];

const Footer = () => {
  return (
    <footer className="learner-footer">
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} IIK Organisation NPO (318-977) | PBO Number : 930086625 | All Rights Reserved.</span>
          <div className="footer-social">
            {socialLinks.map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                <i className={`fab ${icon}`}></i>
              </a>
            ))}
          </div>
          <div className="footer-links">
              <a href="https://www.iik.co.za/contact-us">Get In Touch</a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;  // <--- THIS LINE IS CRITICAL!