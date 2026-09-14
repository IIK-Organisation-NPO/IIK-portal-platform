import React from 'react';
import { Link } from 'react-router-dom';
import logo from "../../assets/images/small Mki.png";
import missionImage from "../../assets/images/download.jfif";
import Footer from "../../components/common/Footer";
import "../../styles/pages/About.css";

const About = () => {
  return (
    <div className="about-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <nav className="header-nav">
            <Link to="/Homepage">Home</Link>
            <a
              href="https://www.iik.co.za/contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <div className="nav-actions">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section - Black background, centered, white text */}
      <section className="about-hero">
        <div className="hero-content">
          <div className="badge-wrapper">
            <span className="badge-line"></span>
            <p className="about-hero__badge">ACCREDITED TRAINING EXCELLENCE</p>
            <span className="badge-line"></span>
          </div>
          <h1>About IIK Portal</h1>
          <p className="about-hero__text">
            IIK Portal is South Africa's leading digital and business enablement
            training platform, dedicated to empowering corporate professionals
            and career-driven individuals with world-class, fully accredited skills.
          </p>
        </div>
      </section>

      {/* Mission & Stats Section with Image */}
      <section className="about-mission-stats">
        <div className="mission-stats-content">
          <div className="mission-image-wrapper">
            <img src={missionImage} alt="IIK Portal Mission" className="mission-image" />
          </div>
          <div className="mission-stats-text">
            <div className="mission-section">
              <h2>OUR MISSION</h2>
              <p className="mission-statement">
                Bridging the gap between corporate ambition and digital mastery
              </p>
              <p className="mission-details">
                Our commitment is to provide accessible, high-quality, and market-relevant
                digital education. By tailoring our curriculum to the evolving demands of
                the modern South African economy, we equip learners with the practical
                tools and recognized certifications needed to spearhead industry innovation.
                <br /><br />
                Whether you are an enterprise seeking group enablement training or an
                individual driving your own career upward, IIK Portal delivers the framework
                for sustainable educational impact.
              </p>
            </div>
            <div className="stats-section">
              <div className="stat-item">
                <span className="stat-number">98%</span>
                <span className="stat-label">COMPLETION RATE</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">15k+</span>
                <span className="stat-label">CERTIFIED LEARNERS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="about-offer">
        <div className="offer-content">
          <h2>WHAT WE OFFER</h2>
          <p className="offer-subtitle">Comprehensive learning built for career growth</p>
          <div className="offer-grid">
            <div className="offer-card">
              <div className="offer-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#C59B27"/>
                </svg>
              </div>
              <h3>Digital Certificates</h3>
              <p>
                Verifiable, secure, and shareable block-chained digital
                certificates to build and present your professional profile.
              </p>
            </div>
            <div className="offer-card">
              <div className="offer-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#C59B27"/>
                </svg>
              </div>
              <h3>Expert Instructors</h3>
              <p>
                Learn directly from certified active industry practitioners
                bringing modern corporate knowledge into every course.
              </p>
            </div>
            <div className="offer-card">
              <div className="offer-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15L17 12.23l-4-2.37V7z" fill="#C59B27"/>
                </svg>
              </div>
              <h3>Career Support</h3>
              <p>
                Resume reviews, portfolio audits, and direct matchmaking
                pathways with South Africa's leading employers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="about-values">
        <div className="values-content">
          <div className="values-header">
            <h2>OUR VALUES</h2>
            <p className="values-subtitle">The foundation of IIK Portal</p>
          </div>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-content">
                <h3>Excellence</h3>
                <p>
                  We hold ourselves and our learners to highest standards of
                  academic and technical mastery.
                </p>
              </div>
              <span className="value-number">01</span>
            </div>
            <div className="value-item">
              <div className="value-content">
                <h3>Accessibility</h3>
                <p>
                  Making world-class professional training frictionless,
                  adaptive, and fully online.
                </p>
              </div>
              <span className="value-number">02</span>
            </div>
            <div className="value-item">
              <div className="value-content">
                <h3>Innovation</h3>
                <p>
                  Continuously updating curriculum to reflect global digital
                  trends and local corporate needs.
                </p>
              </div>
              <span className="value-number">03</span>
            </div>
            <div className="value-item">
              <div className="value-content">
                <h3>Integrity</h3>
                <p>
                  Rigorous and accredited evaluation pathways ensuring true
                  competency and secure certification.
                </p>
              </div>
              <span className="value-number">04</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Info Section - Acts as Footer */}
        <Footer />

    </div>
  );
};

export default About;