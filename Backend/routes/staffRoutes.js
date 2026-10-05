// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();

const {
    createStaff,
    getAllStaff,
    updateStaffStatus,
    deleteStaff,
    getMyAdminProfile,
    getAssignableRoles,
    updateMyAdminProfile,
    changeMyPassword,
    verifyMyPassword,
    getMyNotificationPrefs,
    updateMyNotificationPrefs,
    getDigitalCenters 
} = require('../controllers/staffController');

const { authenticate, isAdmin, isSuperAdmin, requireRole } = require('../middleware/auth');
const { validateStaffSignup } = require('../middleware/validation');

// ============================================
// SELF-SERVICE ROUTES — must come before /staff/:id
// ============================================

// Any logged-in admin (Admin or Super Admin)
router.get('/staff/me', authenticate, isAdmin, getMyAdminProfile);
router.put('/staff/me', authenticate, isAdmin, updateMyAdminProfile);
router.put('/staff/me/password', authenticate, isAdmin, changeMyPassword);
router.post('/staff/me/verify-password', authenticate, isAdmin, verifyMyPassword);

// Notification preferences
router.get('/staff/me/notifications', authenticate, isAdmin, getMyNotificationPrefs);
router.put('/staff/me/notifications', authenticate, isAdmin, updateMyNotificationPrefs);

// Roles list — Super Admin only
router.get('/staff/roles', authenticate, isSuperAdmin, getAssignableRoles);

// Digital centres — Super Admin only
router.get('/staff/digital-centers', authenticate, isSuperAdmin, getDigitalCenters);
// ============================================
// STAFF MANAGEMENT — Super Admin only
// ============================================
router.post('/staff', authenticate, isSuperAdmin, validateStaffSignup, createStaff);
router.get('/staff', authenticate, isSuperAdmin, getAllStaff);
router.patch('/staff/:id/status', authenticate, isSuperAdmin, updateStaffStatus);
router.delete('/staff/:id', authenticate, isSuperAdmin, deleteStaff);


module.exports = router;