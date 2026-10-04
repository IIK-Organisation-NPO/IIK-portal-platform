// src/pages/learner/Homepage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import Footer from "../../components/common/Footer";
import "../../styles/pages/learner.css";
import logo from "../../assets/images/small Mki.png";
import { API_BASE } from "../../config/api";

const Homepage = () => {
  const [programmes, setProgrammes] = useState([]);
  const [loadingProgrammes, setLoadingProgrammes] = useState(true);

  // Handles navigation to the signup page when "View Programmes" is clicked
  const handleViewProgrammes = () => {
    navigate("/signup");
  };

  // Set up the scroll listener when the component mounts,
  // and clean it up when the component unmounts
  useEffect(() => {
    let cancelled = false;

    const fetchProgrammes = async () => {
      try {
        setLoadingProgrammes(true);
        const res = await fetch(`${API_BASE}/api/programmes`);
        const data = await res.json();

        if (cancelled) return;

        if (data.success && Array.isArray(data.programmes)) {
          const visible = data.programmes
            .filter(
              (p) => p.status === "Active" || p.status === "Upcoming"
            )
            .map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description || "",
            }));

          setProgrammes(visible);
        } else {
          setProgrammes([]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Homepage: fetch programmes error:", err);
          setProgrammes([]);
        }
      } finally {
        if (!cancelled) setLoadingProgrammes(false);
      }
    };

    fetchProgrammes();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayedProgrammes = programmes.slice(0, 6);

  return (
    <div className="learner-home">
      <header className="home-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <nav className="header-nav">
            <Link to="/">Home</Link>
            <a
              href="https://www.iik.co.za/contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
            <Link to="/BlogPage">Blog</Link>
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

          {loadingProgrammes ? (
            <div style={{ padding: "2rem 0", color: "#64748b" }}>
              Loading programmes...
            </div>
          ) : displayedProgrammes.length === 0 ? (
            <div style={{ padding: "2rem 0", color: "#64748b" }}>
              No programmes available right now. Please check back soon.
            </div>
          ) : (
            <div className="programmes-grid">
              {displayedProgrammes.map((programme) => (
                <div className="programme-card" key={programme.id}>
                  <h3>{programme.name}</h3>
                  <p>{programme.description}</p>
                  <button className="btn-view">
                    View Programmes <FaChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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

      <Footer />
    </div>
  );
};

export default Homepage;