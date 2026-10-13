import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/small Mki.png";
import bigLogo from "../../assets/images/small Mki.png";
import "../../styles/components/terms_and_conditions.css";

const TermsAndConditions = () => {
  // useNavigate hook: used for both the "go back" action and to control page navigation
  const navigate = useNavigate();

  // State to control the visibility of the scroll-to-top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  // State to control the mobile navigation menu (hamburger) open/close
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * useEffect: attach a scroll listener to the window.
   * When the user scrolls past 300px, we show the scroll-to-top button.
   * Cleanup removes the listener when the component unmounts.
   */
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Smoothly scrolls the window back to the very top of the page.
   * Triggered by the floating scroll-to-top button.
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Uses the browser history to go back to the previous page
   * (e.g. the signup page the user came from).
   * Falls back to /signup if there is no history to go back to.
   */
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/signup");
    }
  };

  /**
   * Toggles the mobile navigation menu (hamburger) open/closed.
   */
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  /**
   * Closes the mobile menu when a nav link is clicked.
   */
  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Read-only declaration statements shown in section 17
  const declarationItems = [
    "I have read and agree to the Terms and Conditions.",
    "I consent to the processing of my personal information in accordance with POPIA.",
    "I understand my responsibility to maintain the security of my account.",
    "I agree to use the Portal ethically, lawfully, and in accordance with IIK Organisation NPC policies.",
    "I understand that my access may be suspended if I breach these Terms and Conditions.",
  ];

  return (
    <div className="terms-page">
      {/* ================= HEADER ================= */}
      <header className="terms-header-bar">
        <div className="terms-header-container">
          {/* Logo + portal name */}
          <div className="terms-header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>

          {/* Hamburger toggle (only visible on mobile via CSS) */}
          <button
            type="button"
            className="terms-menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className={`terms-menu-icon ${menuOpen ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          {/* Navigation links (collapses into a dropdown on mobile) */}
          <nav
            className={`terms-header-nav ${menuOpen ? "mobile-open" : ""}`}
          >
            <a href="https://www.iik.co.za/Home" onClick={closeMenu}>
              Home
            </a>
            
            <Link to="/BlogPage" onClick={closeMenu}>
              Blog
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="terms-main">
        <div className="terms-container">
          {/* Large hero logo + horizontal rule */}
          <div className="terms-hero">
            <div className="terms-hero-logo">
              <img src={bigLogo} alt="IIK Organisation Logo" />
            </div>
            <div className="terms-hero-line" />
          </div>

          {/* Page title and last updated date */}
          <div className="terms-title-block">
            <h1>IIK Organisation NPC Portal Terms and Conditions</h1>
            <p className="terms-updated">Last Updated: 28 September 2026</p>
          </div>

          <div className="terms-content">
            {/* 1. Acceptance of Terms */}
            <section className="terms-section">
              <h3>1. Acceptance of Terms</h3>
              <p>
                By accessing, registering for, or using the IIK Organisation NPC
                Portal ("the Portal"), you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions,
                the Privacy Policy, and any other policies published by IIK
                Organisation NPC.
              </p>
              <p>
                If you do not agree to these Terms and Conditions, you must not
                create an account or use the Portal.
              </p>
            </section>

            {/* 2. Purpose of the Portal */}
            <section className="terms-section">
              <h3>2. Purpose of the Portal</h3>
              <p>
                The Portal is provided to support the objectives of IIK
                Organisation NPC, including:
              </p>
              <ul>
                <li>STEM education initiatives;</li>
                <li>Digital skills development;</li>
                <li>Community information and learning services;</li>
                <li>Volunteer and stakeholder engagement;</li>
                <li>
                  Training, monitoring, reporting, and project management
                  activities.
                </li>
              </ul>
            </section>

            {/* 3. User Registration */}
            <section className="terms-section">
              <h3>3. User Registration</h3>
              <p>By creating an account, you confirm that:</p>
              <ul>
                <li>
                  The information provided is true, accurate, and complete.
                </li>
                <li>
                  You are authorised to submit any information provided.
                </li>
                <li>You will maintain the accuracy of your account details.</li>
                <li>
                  You will not impersonate another individual or organisation.
                </li>
              </ul>
              <p>
                IIK Organisation NPC reserves the right to suspend or terminate
                accounts containing false or misleading information.
              </p>
            </section>

            {/* 4. Protection of Personal Information */}
            <section className="terms-section">
              <h3>4. Protection of Personal Information</h3>
              <p>
                IIK Organisation NPC processes personal information in
                accordance with the Protection of Personal Information Act
                (POPIA).
              </p>
              <p>By using the Portal, you consent to:</p>
              <ul>
                <li>
                  The collection of information required for programme
                  administration and reporting.
                </li>
                <li>The storage of your information on secure systems.</li>
                <li>
                  The use of your information for communication regarding
                  organisational activities, training programmes, volunteer
                  opportunities, and compliance requirements.
                </li>
              </ul>
              <p>
                Users may request access to, correction of, or deletion of
                personal information where permitted by law.
              </p>
            </section>

            {/* 5. Confidentiality and Account Security */}
            <section className="terms-section">
              <h3>5. Confidentiality and Account Security</h3>
              <p>Users are responsible for:</p>
              <ul>
                <li>Maintaining the confidentiality of login credentials.</li>
                <li>Ensuring passwords are not shared with others.</li>
                <li>Reporting any unauthorised access immediately.</li>
              </ul>
              <p>
                IIK Organisation NPC may suspend any account where security
                concerns are identified.
              </p>
            </section>

            {/* 6. Acceptable Use */}
            <section className="terms-section">
              <h3>6. Acceptable Use</h3>
              <p>Users agree not to:</p>
              <ul>
                <li>Upload malicious software, viruses, or harmful code.</li>
                <li>Attempt unauthorised access to systems or data.</li>
                <li>Interfere with Portal operations.</li>
                <li>
                  Use the Portal for unlawful, fraudulent, or misleading
                  purposes.
                </li>
                <li>
                  Upload content that infringes intellectual property rights.
                </li>
                <li>Harass, threaten, or abuse other users.</li>
              </ul>
              <p>
                Violation of these provisions may result in account suspension
                or permanent removal.
              </p>
            </section>

            {/* 7. Cybersecurity */}
            <section className="terms-section">
              <h3>7. Cybersecurity</h3>
              <p>
                In line with the organisation's cybersecurity obligations, users
                acknowledge that IIK Organisation NPC may:
              </p>
              <ul>
                <li>Monitor system activity for security purposes.</li>
                <li>Implement multi-factor authentication where necessary.</li>
                <li>Conduct security reviews and audits.</li>
                <li>
                  Suspend access during security incidents or maintenance
                  activities.
                </li>
              </ul>
            </section>

            {/* 8. Intellectual Property */}
            <section className="terms-section">
              <h3>8. Intellectual Property</h3>
              <p>
                All content, documents, training materials, branding, logos,
                templates, reports, videos, and educational resources available
                on the Portal remain the property of IIK Organisation NPC unless
                otherwise stated.
              </p>
              <p>Users may not:</p>
              <ul>
                <li>Reproduce materials for commercial purposes.</li>
                <li>Sell or redistribute Portal content.</li>
                <li>Remove copyright or ownership notices.</li>
              </ul>
              <p>
                Written permission must be obtained before public
                redistribution.
              </p>
            </section>

            {/* 9. User Submissions */}
            <section className="terms-section">
              <h3>9. User Submissions</h3>
              <p>
                By submitting documents, reports, applications, volunteer
                records, project information, or other content to the Portal,
                you grant IIK Organisation NPC a non-exclusive right to:
              </p>
              <ul>
                <li>Store the content;</li>
                <li>Process the content for organisational purposes;</li>
                <li>
                  Use aggregated and anonymised data for reporting and impact
                  measurement.
                </li>
              </ul>
              <p>
                Ownership of original submissions remains with the user unless
                agreed otherwise.
              </p>
            </section>

            {/* 10. Ethics and Conflict of Interest */}
            <section className="terms-section">
              <h3>10. Ethics and Conflict of Interest</h3>
              <p>
                Users participating in governance, committees, procurement
                activities, or funding-related processes must disclose any
                actual, potential, or perceived conflicts of interest.
              </p>
              <p>
                Failure to disclose conflicts may result in removal from
                relevant activities and further action where appropriate.
              </p>
            </section>

            {/* 11. Monitoring and Investigation */}
            <section className="terms-section">
              <h3>11. Monitoring and Investigation</h3>
              <p>IIK Organisation NPC reserves the right to investigate:</p>
              <ul>
                <li>Fraud;</li>
                <li>Misconduct;</li>
                <li>Misrepresentation;</li>
                <li>Unauthorised use of Portal resources;</li>
                <li>Breaches of these Terms and Conditions.</li>
              </ul>
              <p>
                Where required by law, information may be provided to law
                enforcement agencies or regulatory bodies.
              </p>
            </section>

            {/* 12. Limitation of Liability */}
            <section className="terms-section">
              <h3>12. Limitation of Liability</h3>
              <p>IIK Organisation NPC shall not be liable for:</p>
              <ul>
                <li>Temporary interruption of services;</li>
                <li>Data loss resulting from user negligence;</li>
                <li>Third-party system failures;</li>
                <li>Internet service interruptions;</li>
                <li>
                  Any indirect or consequential losses arising from use of the
                  Portal.
                </li>
              </ul>
              <p>Users access and use the Portal at their own risk.</p>
            </section>

            {/* 13. Portal Availability */}
            <section className="terms-section">
              <h3>13. Portal Availability</h3>
              <p>
                While reasonable efforts will be made to ensure uninterrupted
                access, IIK Organisation NPC does not guarantee that the Portal
                will always be available.
              </p>
              <p>The organisation may suspend access for:</p>
              <ul>
                <li>Maintenance;</li>
                <li>Security upgrades;</li>
                <li>System improvements;</li>
                <li>Compliance requirements.</li>
              </ul>
            </section>

            {/* 14. Termination of Access */}
            <section className="terms-section">
              <h3>14. Termination of Access</h3>
              <p>
                IIK Organisation NPC may suspend or terminate a user account
                where:
              </p>
              <ul>
                <li>These Terms are breached;</li>
                <li>False information has been submitted;</li>
                <li>Illegal activity is suspected;</li>
                <li>
                  The user's actions present a risk to the organisation or other
                  users.
                </li>
              </ul>
            </section>

            {/* 15. Amendments */}
            <section className="terms-section">
              <h3>15. Amendments</h3>
              <p>
                IIK Organisation NPC reserves the right to modify these Terms
                and Conditions from time to time. Updated versions will be
                published on the Portal and become effective upon publication.
              </p>
            </section>

            {/* 16. Dispute Resolution */}
            <section className="terms-section">
              <h3>16. Dispute Resolution</h3>
              <p>
                Any disputes relating to the use of the Portal shall first be
                addressed through internal resolution processes.
              </p>
              <p>
                Should the matter remain unresolved, it may be referred to
                mediation or arbitration in accordance with the governance
                principles of IIK Organisation NPC.
              </p>
            </section>

            {/* 17. User Declaration (Read-Only) */}
            <section className="terms-section declaration-section">
              <h3>17. User Declaration</h3>
              <p>Before creating an account, users must confirm:</p>

              <div className="declaration-list">
                {declarationItems.map((item, index) => (
                  <div key={index} className="declaration-item">
                    <span className="declaration-bullet" aria-hidden="true"></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ===== Back Button (returns to previous page) ===== */}
          <div className="terms-back-wrapper">
            <button
              type="button"
              className="terms-back-btn"
              onClick={handleBack}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      </main>

      {/* ===== Scroll To Top Button ===== */}
      {showScrollTop && (
        <button
          className="terms-scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          type="button"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L12 20M12 4L5 11M12 4L19 11"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TermsAndConditions;