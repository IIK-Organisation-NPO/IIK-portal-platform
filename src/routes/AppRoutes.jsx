import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../components/auth/Login';
import Homepage from '../pages/learner/Homepage';
import Signup from '../components/auth/Signup';
import ForgotPassword from '../components/auth/ForgotPassword';
import VerifyOTP from '../components/auth/VerifyOTP';
import ResetPassword from '../components/auth/ResetPassword';
import LearnerDashBoard from '../pages/Learner_Screens/Learner_DashBoard';
import LearnerProfile from '../pages/Learner_Screens/Learner_Profile';
import AdminDashboard from '../pages/Admin_Screens/Admin_Dashboard';
import AdminLearners from '../pages/Admin_Screens/Admin_Learners';
import AdminCertificates from '../pages/Admin_Screens/Admin_Certificates';
import AdminBulkCertificates from '../pages/Admin_Screens/Admin_BulkCertificates';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={< Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/learner/homepage" element={<Homepage />} />
        {/* Learner routes */}
        <Route path="/learner-dashboard" element={<LearnerDashBoard />} />
        <Route path="/learner/profile" element={<LearnerProfile />} />


        {/* ===== NEW ADMIN ROUTES ===== */}

        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/learners" element={<AdminLearners />} />

        <Route path="/admin-certificates" element={<AdminCertificates />} />
        <Route path="/admin-bulkCertificates" element={<AdminBulkCertificates />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
