// src/pages/learner/Homepage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronRight, FaArrowUp } from "react-icons/fa";
import Footer from "../../components/common/Footer";
import "../../styles/pages/learner.css";
import logo from "../../assets/images/small Mki.png";

const Homepage = () => {
  // Hook for programmatic navigation between routes
  const navigate = useNavigate();

  // State to track whether the scroll-to-top button should be visible
  const [isVisible, setIsVisible] = useState(false);

  // Callback that toggles the visibility of the scroll-to-top button
  // based on the current scroll position of the window
  const toggleVisibility = useCallback(() => {
    if (window.scrollY > 300) {
      setIsVisible(true); // Show button when scrolled past 300px
    } else {
      setIsVisible(false); // Hide button when near the top
    }
  }, []);

  // Smoothly scrolls the window back to the top of the page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Handles navigation to the signup page when "View Programmes" is clicked
  const handleViewProgrammes = () => {
    navigate("/signup");
  };

  // Set up the scroll listener when the component mounts,
  // and clean it up when the component unmounts
  useEffect(() => {
    // Attach the scroll event listener
    window.addEventListener("scroll", toggleVisibility);

    // Run once on mount to set the initial state
    toggleVisibility();

    // Cleanup: remove the listener to prevent memory leaks
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, [toggleVisibility]);

  return (
    <div className="learner-home">
      {/* ==================== HEADER ==================== */}
      {/* Contains the logo, navigation links, and login/signup buttons */}
      <header className="home-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <nav className="header-nav">
            {/* Internal navigation links using React Router */}
            <Link to="/Homepage">Home</Link>
            {/* External link to the IIK contact page */}
            <a
              href="https://www.iik.co.za/contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            {/* Login and Sign Up buttons */}
            <div className="nav-actions">
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/signup" className="btn-signup">
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      {/* Main banner with headline, subtitle, and call-to-action buttons */}
      <section className="hero-section">
        <div
          className="container"
          style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h1>Empowering Learners Through Digital Skills</h1>
          <p className="hero-subtitle">
            IIK offers accredited programmes in Digital Literacy, Microsoft 365,
            Digital Marketing and more. Earn your certificate today.
          </p>
          <div className="hero-buttons">
            {/* Primary CTA: routes to signup page */}
            <Link to="/signup" className="btn-hero-primary">
              Get Started
            </Link>
            {/* Secondary CTA: external link to the About page */}
            <a
              href="https://www.iik.co.za/About-Us"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-secondary"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ==================== PROGRAMMES SECTION ==================== */}
      {/* Displays three programme cards with descriptions and view buttons */}
      <section className="programmes-section">
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h2>Our Programmes</h2>
          <p>
            Choose from our high-impact professional courses designed to
            accelerate your digital capabilities.
          </p>
          <div className="programmes-grid">
            {/* Programme Card 1: Digital Literacy */}
            <div className="programme-card">
              <div className="icon">💻</div>
              <h3>Digital Literacy</h3>
              <p>
                Master essential computer skills, Internet navigation, email
                management, and online safety.
              </p>
              {/* Clicking navigates to the signup page */}
              <button className="btn-view" onClick={handleViewProgrammes}>
                View Programmes <FaChevronRight size={14} />
              </button>
            </div>

            {/* Programme Card 2: Microsoft 365 */}
            <div className="programme-card">
              <div className="icon">📊</div>
              <h3>Microsoft 365</h3>
              <p>
                Learn Word, Excel, PowerPoint, Outlook and Teams for high-grade
                professional productivity.
              </p>
              {/* Clicking navigates to the signup page */}
              <button className="btn-view" onClick={handleViewProgrammes}>
                View Programmes <FaChevronRight size={14} />
              </button>
            </div>

            {/* Programme Card 3: Digital Marketing */}
            <div className="programme-card">
              <div className="icon">📈</div>
              <h3>Digital Marketing</h3>
              <p>
                Social media marketing, search engine optimization, content
                strategy, email campaigns, and analytics.
              </p>
              {/* Clicking navigates to the signup page */}
              <button className="btn-view" onClick={handleViewProgrammes}>
                View Programmes <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS SECTION ==================== */}
      {/* Displays feedback from past learners */}
      <section className="testimonials-section">
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h2>What Our Learners Say</h2>
          <div className="testimonials-grid">
            {/* Testimonial 1 */}
            <div className="testimonial-card">
              <p className="quote">
                "The Microsoft 365 course completely transformed how I organize
                spreadsheets and project slides at work. Highly practical and
                professional."
              </p>
              <p className="author">Thomas Clamini</p>
              <p className="author-role">Customer Analyst</p>
            </div>

            {/* Testimonial 2 */}
            <div className="testimonial-card">
              <p className="quote">
                "Excellent content delivery. Getting my Digital Literacy
                certificate was seamless with immediate results. Highly
                recommended for digital upskilling."
              </p>
              <p className="author">Nicole Smith</p>
              <p className="author-role">Administrative Head</p>
            </div>

            {/* Testimonial 3 */}
            <div className="testimonial-card">
              <p className="quote">
                "The Digital Marketing modules were cutting-edge. It helped us
                set up campaigns that achieved measurable results within weeks."
              </p>
              <p className="author">Annie Yusuf</p>
              <p className="author-role">Digital Business Lead</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      {/* Final call-to-action prompting users to sign up */}
      <section className="cta-section">
        <div
          className="container"
          style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h2>Ready to start your learning journey?</h2>
          <p>Join thousands of professionals who have upskilled with IIK.</p>
          {/* Routes to the signup page */}
          <Link to="/signup" className="btn-cta">
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* ==================== SCROLL TO TOP BUTTON ==================== */}
      {/* Only visible when the user has scrolled down more than 300px */}
      <div
        className={`scroll-to-top ${isVisible ? "visible" : ""}`}
        onClick={scrollToTop}
        role="button"
        tabIndex={0}
        aria-label="Scroll to top"
        onKeyDown={(e) => {
          // Support keyboard activation (Enter or Space)
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            scrollToTop();
          }
        }}
      >
        <FaArrowUp />
      </div>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </div>
  );
};

export default Homepage;