// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();

const {
    createStaff,
    getAllStaff,
    updateStaffStatus,
    deleteStaff,                 // ← NEW
    getMyAdminProfile,
    getAssignableRoles,
    updateMyAdminProfile,
    changeMyPassword
} = require('../controllers/staffController');

const { authenticate, isAdmin } = require('../middleware/auth');
const { validateStaffSignup } = require('../middleware/validation');

// ============================================
// SELF-SERVICE ROUTES — must come before /staff/:id
// ============================================
router.get('/staff/me', authenticate, isAdmin, getMyAdminProfile);
router.put('/staff/me', authenticate, isAdmin, updateMyAdminProfile);
router.put('/staff/me/password', authenticate, isAdmin, changeMyPassword);
router.get('/staff/roles', getAssignableRoles);

// ============================================
// STAFF MANAGEMENT
// ============================================
router.post('/staff', validateStaffSignup, createStaff);
router.get('/staff', getAllStaff);
router.patch('/staff/:id/status', updateStaffStatus);
router.delete('/staff/:id', deleteStaff);          // ← FIXED

module.exports = router;