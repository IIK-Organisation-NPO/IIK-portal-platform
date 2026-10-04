// src/routes/AppRoutes.jsx
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
import VerifyEmail from '../components/auth/VerifyEmail';

import LearnerDashBoard from '../pages/Learner_Screens/Learner_DashBoard';
import LearnerProfile from '../pages/Learner_Screens/Learner_Profile';
import LearnerCertificates from '../pages/Learner_Screens/Learner_Certificates';
import SettingsPage from '../pages/Learner_Screens/Learner _Settings';
import LearnerProgrammes from '../pages/Learner_Screens/Learner_Programmes';
import LocateCenter from '../pages/Learner_Screens/Locate_Center';

import AdminDashboard from '../pages/Admin_Screens/Admin_Dashboard';
import AdminLearners from '../pages/Admin_Screens/Admin_Learners';
import AdminInterestedLearners from '../pages/Admin_Screens/Admin_InterestedLearners';
import AdminAnalytics from '../pages/Admin_Screens/Admin_Analytics';
import Admin_Certificates from '../pages/Admin_Screens/Admin_Certificates';
import Admin_BulkUpload from '../pages/Admin_Screens/Admin_BulkCertificates';
import EmailComposerModal from '../pages/Admin_Screens/EmailComposerModal';
import Admin_AccountSettings from '../pages/Admin_Screens/Admin_AccountSettings';
import AdminProgrammes from '../pages/Admin_Screens/Admin_Programmes';
import Admin_CreateProgramme from '../pages/Admin_Screens/Admin_CreateProgramme';
import Admin_BlogManagement from '../pages/Admin_Screens/Admin_BlogManagement';
import AdminBlogCreate from '../pages/Admin_Screens/Admin_blogCreate';
import AdminStaffManagement from '../pages/Admin_Screens/Admin_StaffManagement';

import RoleRoute from '../components/auth/RoleRoute';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* ============================================ */}
        {/* PUBLIC ROUTES                                 */}
        {/* ============================================ */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/BlogPage" element={<BlogPage />} />

        {/* ============================================ */}
        {/* LEARNER ROUTES (learner only)                 */}
        {/* ============================================ */}
        <Route
          path="/learner-dashboard"
          element={
            <RoleRoute allowedRoles={['learner']}>
              <LearnerDashBoard />
            </RoleRoute>
          }
        />
        <Route
          path="/learner/profile"
          element={
            <RoleRoute allowedRoles={['learner']}>
              <LearnerProfile />
            </RoleRoute>
          }
        />
        <Route
          path="/learner-certificates"
          element={
            <RoleRoute allowedRoles={['learner']}>
              <LearnerCertificates />
            </RoleRoute>
          }
        />
        <Route
          path="/learner/settings"
          element={
            <RoleRoute allowedRoles={['learner']}>
              <SettingsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/learner-programmes"
          element={
            <RoleRoute allowedRoles={['learner']}>
              <LearnerProgrammes />
            </RoleRoute>
          }
        />
        <Route
          path="/locate-center"
          element={
            <RoleRoute allowedRoles={['learner']}>
              <LocateCenter />
            </RoleRoute>
          }
        />

        {/* ============================================ */}
        {/* ADMIN ROUTES (admin + super admin)            */}
        {/* ============================================ */}
        <Route
          path="/admin-dashboard"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/learners"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <AdminLearners />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/interested-learners"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <AdminInterestedLearners />
            </RoleRoute>
          }
        />
        <Route
          path="/admin-certificates"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Admin_Certificates />
            </RoleRoute>
          }
        />
        <Route
          path="/admin-analytics"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <AdminAnalytics />
            </RoleRoute>
          }
        />
        <Route
          path="/admin-bulkCertificates"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Admin_BulkUpload />
            </RoleRoute>
          }
        />
        <Route
          path="/admin-emailComposerModal"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <EmailComposerModal />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Admin_AccountSettings />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/programmes"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <AdminProgrammes />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/create-programme"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Admin_CreateProgramme />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/blog-management"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <Admin_BlogManagement />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/blog-create"
          element={
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <AdminBlogCreate />
            </RoleRoute>
          }
        />

        {/* ============================================ */}
        {/* SUPER ADMIN ONLY                              */}
        {/* ============================================ */}
        <Route
          path="/admin/staff"
          element={
            <RoleRoute allowedRoles={['superadmin']}>
              <AdminStaffManagement />
            </RoleRoute>
          }
        />

        {/* ============================================ */}
        {/* CATCH-ALL — anything not matched             */}
        {/* ============================================ */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;