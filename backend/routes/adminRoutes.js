// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const Admin = require('../models/admin');
const User = require('../models/users');


// ADMIN DASHBOARD


/**
 * @route GET /api/admin/dashboard
 * @desc Get admin dashboard
 * @access Admin only
 */
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Get admin info
        const admin = await Admin.findById(req.user.userId);
        
        // Get stats
        const totalLearners = await User.countUsers();
        const totalAdmins = (await Admin.getAll()).length;
        
        res.status(200).json({
            status: 'success',
            message: 'Welcome to Admin Dashboard',
            data: {
                admin: {
                    email: req.user.email,
                    centerName: req.user.centerName
                },
                stats: {
                    totalLearners: totalLearners,
                    totalAdmins: totalAdmins,
                    totalCertificates: 0,
                    totalProgrammes: 0
                }
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});


// ADMIN PROFILE


/**
 * @route GET /api/admin/me
 * @desc Get admin profile
 * @access Admin only
 */
router.get('/me', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.userId);
        if (!admin) {
            return res.status(404).json({
                status: 'error',
                message: 'Admin not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                admin: {
                    id: admin.admin_id,
                    email: admin.email,
                    centerName: admin.center_name,
                    createdAt: admin.created_at
                }
            }
        });
    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});


// LEARNER MANAGEMENT (Admin Only)


/**
 * @route GET /api/admin/learners
 * @desc Get all learners
 * @access Admin only
 */
router.get('/learners', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const learners = await User.getAllUsers(100, 0);
        const total = await User.countUsers();
        
        res.status(200).json({
            status: 'success',
            data: {
                learners,
                total,
                page: 1,
                limit: 100
            }
        });
    } catch (error) {
        console.error('Get learners error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});

/**
 * @route GET /api/admin/learners/:id
 * @desc Get learner by ID
 * @access Admin only
 */
router.get('/learners/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const learner = await User.findById(req.params.id);
        if (!learner) {
            return res.status(404).json({
                status: 'error',
                message: 'Learner not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: { learner }
        });
    } catch (error) {
        console.error('Get learner error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});


// ADMIN MANAGEMENT (Super Admin Only)


/**
 * @route GET /api/admin/admins
 * @desc Get all admins
 * @access Admin only
 */
router.get('/admins', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const admins = await Admin.getAll();
        res.status(200).json({
            status: 'success',
            data: { admins }
        });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});


// STATS


/**
 * @route GET /api/admin/stats
 * @desc Get admin stats
 * @access Admin only
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const totalLearners = await User.countUsers();
        const totalAdmins = (await Admin.getAll()).length;
        
        res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    totalLearners,
                    totalAdmins,
                    totalCertificates: 0,
                    totalProgrammes: 0
                }
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});

module.exports = router;