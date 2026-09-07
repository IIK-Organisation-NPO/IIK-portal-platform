// src/components/auth/Signup.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaVenusMars,
} from "react-icons/fa";
import Footer from "../common/Footer";
import Input from "../common/Input";
import "../../styles/components/auth.css";
import logo from "../../assets/images/small Mki.png";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select your gender";
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "ID/Passport number is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreeTerms) {
      newErrors.terms = "You must agree to the Terms of Service";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Signup attempt with:", formData);
      navigate("/learner/homepage");
    }
  };

  return (
    <div className="signup-page">
      {/* Header */}
      <header className="auth-header">
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
            <Link to="/Blog">Blog</Link>
          </nav>
        </div>
      </header>

      {/* Signup Form */}
      <div className="auth-container">
        <div className="auth-card auth-card-wide">
          <div className="logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span className="logo-text">Learner Certificate Portal</span>
          </div>

          <h2>Create Your Account</h2>
          <p className="subtitle">
            Enter your details below to set up your learner profile
          </p>

          <form className="auth-form signup-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Sarah Krumac"
                    className={errors.fullName ? "error" : ""}
                  />
                </div>
                {errors.fullName && (
                  <span className="error-text">{errors.fullName}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. sarah@example.com"
                    className={errors.email ? "error" : ""}
                  />
                </div>
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +27 82 123 4567"
                    className={errors.phone ? "error" : ""}
                  />
                </div>
                {errors.phone && (
                  <span className="error-text">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="gender">Gender</label>
                <div className="input-wrapper">
                  <FaVenusMars className="input-icon" />
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={errors.gender ? "error" : ""}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>
                {errors.gender && (
                  <span className="error-text">{errors.gender}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="idNumber">ID Number / Passport Number</label>
                <div className="input-wrapper">
                  <FaIdCard className="input-icon" />
                  <input
                    type="text"
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="13-digit South African ID or Passport"
                    className={errors.idNumber ? "error" : ""}
                  />
                </div>
                {errors.idNumber && (
                  <span className="error-text">{errors.idNumber}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={errors.password ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-text">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={errors.confirmPassword ? "error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="error-text">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width terms-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the <Link to="/terms">Terms of Service</Link> and{" "}
                    <Link to="/privacy">Privacy Policy</Link> (POPIA compliant).
                  </span>
                </label>
                {errors.terms && (
                  <span className="error-text">{errors.terms}</span>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Create Account
            </button>
          </form>

          <div className="auth-divider">
            <hr />
            <span>or continue with</span>
            <hr />
          </div>

          <button className="btn-google">
            <FaGoogle size={20} /> Google
          </button>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>

          <div className="signup-disclaimer">
            <p>
              Your personal information is secure with us. IIK respects your
              privacy and manages all collected personal information strictly in
              accordance with the Protection of Personal Information Act
              (POPIA), Act No. 4 of 2013.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Signup;
