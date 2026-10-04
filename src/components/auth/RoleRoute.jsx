// src/components/auth/RoleRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import NotFound from '../../pages/NotFound';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch {
    user = null;
  }

  // Not logged in -> send to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Determine role from stored user
  const roleId = Number(user.roleId ?? user.role_id ?? 0);
  const userType = String(user.userType || '').toLowerCase();
  const roleLabel = String(user.role || '').toLowerCase();

  const isSuperAdmin =
    userType === 'admin' &&
    (roleId === 3 || roleLabel.includes('super'));

  const isAdmin =
    userType === 'admin' ||
    roleId === 1 ||
    roleId === 3 ||
    roleLabel.includes('admin');

  const isLearner =
    userType === 'user' ||
    userType === 'learner' ||
    roleId === 2 ||
    roleLabel === 'user' ||
    roleLabel === 'learner';

  // If no allowedRoles, any logged-in user can view
  if (allowedRoles.length === 0) {
    return children;
  }

  const allowed = allowedRoles.some((role) => {
    if (role === 'admin') return isAdmin;
    if (role === 'superadmin') return isSuperAdmin;
    if (role === 'learner') return isLearner;
    return false;
  });

  // Wrong role -> render 404 page, do NOT redirect
  if (!allowed) {
    return <NotFound />;
  }

  return children;
};

export default RoleRoute;