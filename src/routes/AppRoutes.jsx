// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../components/auth/Login';
import Homepage from '../pages/learner/Homepage';
import Signup from '../components/auth/Signup';
import VerifyEmail from '../components/auth/VerifyEmail';
import AdminDashboard from '../pages/admin/AdminDashboard';
import LearnerDashboard from '../pages/learner/LearnerDashboard';


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/learner/homepage" element={<Homepage/>} />
         <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
         <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/learner/dashboard" element={<LearnerDashboard />} />
        {/* Now this is where to add more routes here as you build the app. dont forget */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;