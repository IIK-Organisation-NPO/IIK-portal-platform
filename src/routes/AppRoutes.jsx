import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from '../pages/Home/Homepage';
import Login from '../components/auth/Login';
import About from '../pages/Home/About'; 
import BlogPage from '../pages/Home/Blog';
import Signup from '../components/auth/Signup';
import ForgotPassword from '../components/auth/ForgotPassword';
import VerifyOTP from '../components/auth/VerifyOTP';
import ResetPassword from '../components/auth/ResetPassword';
import LearnerDashBoard from '../pages/Learner_Screens/Learner_DashBoard';
import LearnerProfile from '../pages/Learner_Screens/Learner_Profile';
import AdminDashboard from '../pages/Admin_Screens/Admin_Dashboard';
import AdminLearners from '../pages/Admin_Screens/Admin_Learners';
import AdminInterestedLearners from '../pages/Admin_Screens/Admin_InterestedLearners';
import AdminAnalytics from '../pages/Admin_Screens/Admin_Analytics';
import LearnerCertificates from '../pages/Learner_Screens/Learner_Certificates';
import Admin_AccountSettings from '../pages/Admin_Screens/Admin_AccountSettings';
import AdminProgrammes from '../pages/Admin_Screens/Admin_Programmes';
import Admin_CreateProgramme from '../pages/Admin_Screens/Admin_CreateProgramme';
import Admin_BlogManagement from '../pages/Admin_Screens/Admin_BlogManagement';
import SettingsPage from '../pages/Learner_Screens/Learner _Settings';
import LearnerProgrammes from '../pages/Learner_Screens/Learner_Programmes';
import AdminBlogCreate from '../pages/Admin_Screens/Admin_blogCreate';
import Admin_Certificates from '../pages/Admin_Screens/Admin_Certificates';
import Admin_BulkUpload from '../pages/Admin_Screens/Admin_BulkCertificates';
import VerifyEmail from '../components/auth/VerifyEmail'; 
import EmailComposerModal from '../pages/Admin_Screens/EmailComposerModal';
import AdminStaffManagement from '../pages/Admin_Screens/Admin_StaffManagement';
import LocateCenter from '../pages/Learner_Screens/Locate_Center';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        
        <Route path="/" element={<Homepage />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/BlogPage" element={<BlogPage />} />
        {/* Learner routes */}
        <Route path="/learner-dashboard" element={<LearnerDashBoard />} />
        <Route path="/learner/profile" element={<LearnerProfile />} />
        <Route path="/learner-certificates" element={<LearnerCertificates />} />
        <Route path="/learner/settings" element={<SettingsPage />} />
        <Route path="/learner-programmes" element={<LearnerProgrammes />} />
        <Route path="/locate-center" element={<LocateCenter />} />
        

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
        <Route path="/admin/blog-management" element={<Admin_BlogManagement />} />
        <Route path="/admin/blog-create" element={<AdminBlogCreate />} />
        <Route path="/admin/staff" element={<AdminStaffManagement />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;