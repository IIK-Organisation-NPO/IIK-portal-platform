// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../components/auth/Login';
import Homepage from '../pages/learner/Homepage';
import Signup from '../components/auth/Signup';
import ForgotPassword from '../components/auth/ForgotPassword';
import VerifyOTP from '../components/auth/VerifyOTP';
import ResetPassword from '../components/auth/ResetPassword';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/learner/homepage" element={<Homepage/>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Now this is where to add more routes here as you build the app. dont forget */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;