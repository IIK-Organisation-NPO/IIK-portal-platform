// src/pages/learner/Homepage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import Footer from "../../components/common/Footer";
import "../../styles/pages/learner.css";
import logo from "../../assets/images/small Mki.png"; // Change to your actual filename

const Homepage = () => {
  return (
    <div className="learner-home">
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
            <Link to="/blog">Blog</Link>
            <Link to="/about">About</Link>
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

      {/* Hero Section */}
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
            <Link to="/signup" className="btn-hero-primary">
              Get Started
            </Link>
            <Link to="/learn-more" className="btn-hero-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Programmes Section */}
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
            <div className="programme-card">
              <div className="icon">💻</div>
              <h3>Digital Literacy</h3>
              <p>
                Master essential computer skills, Internet navigation, email
                management, and online safety.
              </p>
              <button className="btn-view">
                View Programmes <FaChevronRight size={14} />
              </button>
            </div>
            <div className="programme-card">
              <div className="icon">📊</div>
              <h3>Microsoft 365</h3>
              <p>
                Learn Word, Excel, PowerPoint, Outlook and Teams for high-grade
                professional productivity.
              </p>
              <button className="btn-view">
                View Programmes <FaChevronRight size={14} />
              </button>
            </div>
            <div className="programme-card">
              <div className="icon">📈</div>
              <h3>Digital Marketing</h3>
              <p>
                Social media marketing, search engine optimization, content
                strategy, email campaigns, and analytics.
              </p>
              <button className="btn-view">
                View Programmes <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div
          className="container"
          style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h2>What Our Learners Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="quote">
                "The Microsoft 365 course completely transformed how I organize
                spreadsheets and project slides at work. Highly practical and
                professional."
              </p>
              <p className="author">Thomas Clamini</p>
              <p className="author-role">Customer Analyst</p>
            </div>
            <div className="testimonial-card">
              <p className="quote">
                "Excellent content delivery. Getting my Digital Literacy
                certificate was seamless with immediate results. Highly
                recommended for digital upskilling."
              </p>
              <p className="author">Nicole Smith</p>
              <p className="author-role">Administrative Head</p>
            </div>
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

      {/* Ready to start(CTA Section)*/}
      <section className="cta-section">
        <div
          className="container"
          style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <h2>Ready to start your learning journey?</h2>
          <p>Join thousands of professionals who have upskilled with IIK.</p>
          <Link to="/signup" className="btn-cta">
            Sign Up Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Homepage;
