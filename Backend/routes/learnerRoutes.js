// backend/routes/learnerRoutes.js
const express = require('express');
const router = express.Router();
const learnerController = require('../controllers/learnerController');
const { authenticate, isLearner } = require('../middleware/auth');

// ============================================
//  DEBUG: Log all requests
// ============================================
router.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path} - Auth header:`, req.headers.authorization ? '✅ Present' : '❌ Missing');
    next();
});

// All routes require authentication and learner role
router.use(authenticate);
router.use(isLearner);

// ============================================
// PROFILE ROUTES
// ============================================

// Get learner profile
router.get('/profile', learnerController.getLearnerProfile);

// Update learner profile
router.put('/profile', learnerController.updateLearnerProfile);

// Change password
router.put('/change-password', learnerController.changePassword);

// Get learner stats
router.get('/stats', learnerController.getLearnerStats);

// ============================================
// PROGRAMME & INTEREST ROUTES
// ============================================

// Get all available programmes
router.get('/programmes', learnerController.getProgrammes);

//  Record interest in a programme (Primary route)
router.post('/interest', learnerController.recordInterest);

//  Express interest (Alias for frontend compatibility)
router.post('/express-interest', learnerController.recordInterest);

// Get learner's interests
router.get('/interests', learnerController.getLearnerInterests);

// ============================================
//  DEBUG: Test token route
// ============================================
router.get('/debug-token', authenticate, (req, res) => {
    console.log(' Debug token route - User:', req.user);
    res.json({
        success: true,
        message: 'Token is valid!',
        user: req.user
    });
});

// ============================================
// DEBUG: Public test route (NO authentication)
// ============================================
router.get('/public-test', (req, res) => {
    res.json({
        success: true,
        message: 'Public route is working! No token needed.'
    });
});

module.exports = router;