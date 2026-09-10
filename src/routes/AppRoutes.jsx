import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from '../components/auth/Login';
import Signup from '../components/auth/Signup';
import Homepage from '../pages/Home/Homepage';
import About from '../pages/Home/About'; // ✅ Fixed: changed from './pages/Home/About' to '../pages/Home/About'
import Blog from '../pages/Home/Blog';
import ForgotPassword from '../components/auth/ForgotPassword';
import VerifyOTP from '../components/auth/VerifyOTP';
import ResetPassword from '../components/auth/ResetPassword';
import LearnerDashBoard from '../pages/Learner_Screens/Learner_DashBoard';
import LearnerProfile from '../pages/Learner_Screens/Learner_Profile';
import AdminDashboard from '../pages/Admin_Screens/Admin_Dashboard';
import AdminLearners from '../pages/Admin_Screens/Admin_Learners';
import AdminInterestedLearners from '../pages/Admin_Screens/Admin_InterestedLearners';
import Admin_Certificates from '../pages/Admin_Screens/Admin_Certificates';
import Admin_BulkUpload from '../pages/Admin_Screens/Admin_BulkCertificates';
import VerifyEmail from '../components/auth/VerifyEmail'; // ✅ Fixed: changed from './components/auth/VerifyEmail' to '../components/auth/VerifyEmail'
import EmailComposerModal from '../pages/Admin_Screens/EmailComposerModal';
import AdminAnalytics from '../pages/Admin_Screens/Admin_Analytics';
import LearnerCertificates from '../pages/Learner_Screens/Learner_Certificates';
import Admin_AccountSettings from '../pages/Admin_Screens/Admin_AccountSettings';
import AdminProgrammes from '../pages/Admin_Screens/Admin_Programmes';
import Admin_CreateProgramme from '../pages/Admin_Screens/Admin_CreateProgramme';
const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        {/* Learner routes */}
        <Route path="/learner-dashboard" element={<LearnerDashBoard />} />
        <Route path="/learner/profile" element={<LearnerProfile />} />
        <Route path="/learner-certificates" element={<LearnerCertificates />} />

        {/* ===== NEW ADMIN ROUTES ===== */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/learners" element={<AdminLearners />} />
        <Route path="/admin/interested-learners" element={<AdminInterestedLearners />} />
        <Route path="/admin-certificates" element={<Admin_Certificates />} />
        <Route path="/admin-bulkCertificates" element={<Admin_BulkUpload />} />
        <Route path="/admin-emailComposerModal" element={<EmailComposerModal />} />
        <Route path="/admin-analytics" element={<AdminAnalytics />} />
        <Route path="/admin/settings" element={<Admin_AccountSettings />} />
        <Route path="/admin/programmes" element={<AdminProgrammes />} />
        <Route path="/admin/create-programme" element={<Admin_CreateProgramme />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;